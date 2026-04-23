"""
FDIC BankFind Suite API client — https://banks.data.fdic.gov/api/
All endpoints are public, no API key required.
"""
import asyncio
import httpx
from typing import Optional
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://banks.data.fdic.gov/api"
CACHE: TTLCache = TTLCache(maxsize=512, ttl=3600)  # 1hr TTL


async def _get(client: httpx.AsyncClient, path: str, params: dict) -> dict:
    key = f"{path}:{sorted(params.items())}"
    if key in CACHE:
        return CACHE[key]

    params.setdefault("output", "json")
    r = await client.get(f"{BASE_URL}{path}", params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    CACHE[key] = data
    return data


async def get_institutions(
    filters: Optional[str] = None,
    fields: Optional[str] = None,
    sort_by: str = "ASSET",
    sort_order: str = "DESC",
    limit: int = 50,
    offset: int = 0,
) -> dict:
    params: dict = {
        "limit": limit,
        "offset": offset,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "fields": fields or (
            "CERT,NAME,CITY,STNAME,ZIP,ASSET,REPDTE,INSTCAT,SPECGRP,"
            "CHRTAGNT,ACTIVE,LATITUDE,LONGITUDE,WEBADDR,ESTYMD,HCTMULT"
        ),
    }
    if filters:
        params["filters"] = filters
    async with httpx.AsyncClient() as client:
        return await _get(client, "/institutions", params)


async def get_institution(cert: int) -> dict:
    params = {
        "filters": f"CERT:{cert}",
        "fields": (
            "CERT,NAME,CITY,STNAME,ZIP,ADDRESS,COUNTY,STALP,ASSET,REPDTE,"
            "INSTCAT,SPECGRP,CHRTAGNT,ACTIVE,LATITUDE,LONGITUDE,WEBADDR,"
            "ESTYMD,HCTMULT,CHANGECODE"
        ),
        "limit": 1,
    }
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/institutions", params)
    rows = data.get("data", [])
    return rows[0]["data"] if rows else {}


async def get_financials(
    cert: int,
    fields: Optional[str] = None,
    limit: int = 80,  # ~20 years of quarterly data
) -> list[dict]:
    params = {
        "filters": f"CERT:{cert}",
        "fields": fields or (
            "CERT,REPDTE,ASSET,DEP,LNLSNET,NETINC,INTINC,EINTEXP,"
            "NONII,NONIX,EQ,LNLSDEPA,SC,RBCT1J,INTEXP,LNLSNCO"
        ),
        "sort_by": "REPDTE",
        "sort_order": "DESC",
        "limit": limit,
    }
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/financials", params)
    return [r["data"] for r in data.get("data", [])]


async def get_branches(cert: int) -> list[dict]:
    params = {
        "filters": f"CERT:{cert}",
        "fields": (
            "CERT,BRNUM,BRNAME,CITY,STNAME,ZIP,LATITUDE,LONGITUDE,BKCLASS"
        ),
        "limit": 500,
    }
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/branches", params)
    return [r["data"] for r in data.get("data", [])]


async def get_history(cert: int) -> list[dict]:
    params = {
        "filters": f"CERT:{cert}",
        "fields": "CERT,INSTNAME,CLASS,EFFDATE,PROCDATE,PCITY,PSTALP,CHANGECODE",
        "sort_by": "EFFDATE",
        "sort_order": "DESC",
        "limit": 100,
    }
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/history", params)
    return [r["data"] for r in data.get("data", [])]


async def get_all_branches_in_state(state: str) -> list[dict]:
    params = {
        "filters": f"STALP:{state} AND ACTIVE:1",
        "fields": "CERT,BRNUM,BRNAME,CITY,STNAME,ZIP,LATITUDE,LONGITUDE",
        "limit": 5000,
    }
    async with httpx.AsyncClient() as client:
        data = await _get(client, "/branches", params)
    return [r["data"] for r in data.get("data", [])]


def compute_ratios(fin: dict) -> dict:
    """Derive ratio fields from raw FDIC financial data."""
    asset = fin.get("ASSET") or 0
    dep = fin.get("DEP") or 0
    netinc = fin.get("NETINC") or 0
    eq = fin.get("EQ") or 0
    intinc = fin.get("INTINC") or 0
    eintexp = fin.get("EINTEXP") or 0
    nonii = fin.get("NONII") or 0
    nonix = fin.get("NONIX") or 0
    lnlsnet = fin.get("LNLSNET") or 0
    lnlsnco = fin.get("LNLSNCO") or 0
    lnlsdepa = fin.get("LNLSDEPA") or 0  # past-due + nonaccrual proxy
    rbct1j = fin.get("RBCT1J") or 0

    roa = (netinc / asset * 100) if asset else None
    roe = (netinc / eq * 100) if eq else None
    nim = ((intinc - eintexp) / asset * 100) if asset else None
    noninterest_income = nonii or 0
    total_revenue = (intinc - eintexp + noninterest_income)
    efficiency = (nonix / total_revenue * 100) if total_revenue else None
    loan_to_deposit = (lnlsnet / dep * 100) if dep else None
    npl_ratio = (lnlsdepa / lnlsnet * 100) if lnlsnet else None
    tier1_ratio = (rbct1j / asset * 100) if asset else None

    return {
        "roa": round(roa, 4) if roa is not None else None,
        "roe": round(roe, 4) if roe is not None else None,
        "nim": round(nim, 4) if nim is not None else None,
        "efficiency_ratio": round(efficiency, 2) if efficiency is not None else None,
        "loan_to_deposit": round(loan_to_deposit, 2) if loan_to_deposit is not None else None,
        "npl_ratio": round(npl_ratio, 4) if npl_ratio is not None else None,
        "tier1_ratio": round(tier1_ratio, 4) if tier1_ratio is not None else None,
    }


def build_fdic_filter(f) -> str:
    """Convert ScreenerFilters into FDIC filter string."""
    parts = ["ACTIVE:1"]

    if f.state:
        states = " OR ".join(f.state)
        parts.append(f"STALP:({states})")

    if f.asset_min is not None:
        parts.append(f"ASSET:[{int(f.asset_min)} TO *]")
    if f.asset_max is not None:
        parts.append(f"ASSET:[* TO {int(f.asset_max)}]")

    if f.charter_class:
        cc = " OR ".join(f.charter_class)
        parts.append(f"CHRTAGNT:({cc})")

    if f.specgrp:
        sg = " OR ".join(str(s) for s in f.specgrp)
        parts.append(f"SPECGRP:({sg})")

    return " AND ".join(parts)
