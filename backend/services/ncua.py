"""
NCUA credit union data — quarterly call reports via public data portal.
https://www.ncua.gov/analysis/credit-union-corporate-call-report-data/quarterly-data
"""
import httpx
import io
import zipfile
import csv
import logging
from cachetools import TTLCache

logger = logging.getLogger(__name__)

NCUA_BASE = "https://www.ncua.gov/files/publications/call-report-data"
CACHE: TTLCache = TTLCache(maxsize=64, ttl=86400)  # 24hr — data updates quarterly

# NCUA publishes quarterly ZIPs: foicu.txt (institution), fs220.txt (financials)
FOICU_FIELDS = [
    "CU_NUMBER", "CU_NAME", "STATE", "CITY", "ZIP_CODE", "ACTIVE",
    "MEMBER_COUNT", "TOTAL_ASSETS",
]
FS220_FIELDS = [
    "CU_NUMBER", "CYCLE_DATE",
    "TOTAL_ASSETS_N", "TOTAL_LIABILITIES_N", "NET_WORTH_N",
    "NET_INCOME_N", "TOTAL_LOANS_N", "TOTAL_DEPOSITS_N",
    "TOTAL_DELINQUENT_LOANS_N", "TOTAL_CHARGED_OFF_N",
]


async def _fetch_ncua_zip(year: int, quarter: int) -> dict[str, list[dict]]:
    key = f"ncua:{year}q{quarter}"
    if key in CACHE:
        return CACHE[key]

    url = f"{NCUA_BASE}/{year}/call-report-data-{year}-q{quarter}.zip"
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.get(url)
            r.raise_for_status()
        except httpx.HTTPStatusError:
            logger.warning(f"NCUA ZIP not found: {url}")
            return {}

    result: dict[str, list[dict]] = {}
    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        for name in zf.namelist():
            lower = name.lower()
            if "foicu" in lower or "fs220" in lower:
                with zf.open(name) as f:
                    text = f.read().decode("latin-1")
                    reader = csv.DictReader(io.StringIO(text))
                    result[lower.split(".")[0]] = list(reader)

    CACHE[key] = result
    return result


def _latest_quarter() -> tuple[int, int]:
    from datetime import date
    today = date.today()
    q = (today.month - 1) // 3
    if q == 0:
        return today.year - 1, 4
    return today.year, q


async def get_credit_unions(
    state: str | None = None,
    asset_min: float | None = None,
    asset_max: float | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    year, quarter = _latest_quarter()
    data = await _fetch_ncua_zip(year, quarter)

    foicu_rows = data.get("foicu", [])
    fs220_map: dict[str, dict] = {}
    for row in data.get("fs220", []):
        fs220_map[row.get("CU_NUMBER", "")] = row

    results = []
    for row in foicu_rows:
        if row.get("ACTIVE", "1") != "1":
            continue
        if state and row.get("STATE", "").upper() != state.upper():
            continue

        assets_raw = row.get("TOTAL_ASSETS", "0") or "0"
        try:
            assets = float(assets_raw.replace(",", ""))
        except ValueError:
            assets = 0.0

        if asset_min is not None and assets < asset_min:
            continue
        if asset_max is not None and assets > asset_max:
            continue

        cu_num = row.get("CU_NUMBER", "")
        fin = fs220_map.get(cu_num, {})

        def safe_float(val: str | None) -> float | None:
            if not val:
                return None
            try:
                return float(val.replace(",", ""))
            except ValueError:
                return None

        fin_assets = safe_float(fin.get("TOTAL_ASSETS_N")) or assets
        net_worth = safe_float(fin.get("NET_WORTH_N"))
        net_income = safe_float(fin.get("NET_INCOME_N"))
        total_loans = safe_float(fin.get("TOTAL_LOANS_N"))
        total_deposits = safe_float(fin.get("TOTAL_DEPOSITS_N"))
        delinquent = safe_float(fin.get("TOTAL_DELINQUENT_LOANS_N"))
        members_raw = row.get("MEMBER_COUNT", "")
        try:
            members = int(members_raw.replace(",", ""))
        except ValueError:
            members = None

        roa = (net_income / fin_assets * 100) if fin_assets and net_income is not None else None
        nw_ratio = (net_worth / fin_assets * 100) if fin_assets and net_worth is not None else None
        loan_to_asset = (total_loans / fin_assets * 100) if fin_assets and total_loans is not None else None
        delinq_rate = (delinquent / total_loans * 100) if total_loans and delinquent is not None else None

        results.append({
            "cu_number": int(cu_num) if cu_num.isdigit() else 0,
            "cu_name": row.get("CU_NAME", ""),
            "state": row.get("STATE", ""),
            "city": row.get("CITY", ""),
            "asset_total": fin_assets,
            "member_count": members,
            "roa": round(roa, 4) if roa is not None else None,
            "net_worth_ratio": round(nw_ratio, 4) if nw_ratio is not None else None,
            "loan_to_asset": round(loan_to_asset, 2) if loan_to_asset is not None else None,
            "delinquency_rate": round(delinq_rate, 4) if delinq_rate is not None else None,
        })

    results.sort(key=lambda x: x.get("asset_total") or 0, reverse=True)
    return results[offset: offset + limit]


async def get_credit_union(cu_number: int) -> dict | None:
    results = await get_credit_unions(limit=9999)
    for r in results:
        if r["cu_number"] == cu_number:
            return r
    return None
