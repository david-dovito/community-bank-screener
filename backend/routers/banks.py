import asyncio
import io
import csv
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from backend.models.bank import ScreenerFilters, BankSummary
from backend.services.fdic import (
    get_institutions,
    get_financials,
    build_fdic_filter,
    compute_ratios,
)

router = APIRouter(prefix="/banks", tags=["banks"])

_RATIO_FIELDS = [
    ("roa_min", "roa_max", "roa"),
    ("roe_min", "roe_max", "roe"),
    ("nim_min", "nim_max", "nim"),
    ("efficiency_min", "efficiency_max", "efficiency_ratio"),
    ("npl_min", "npl_max", "npl_ratio"),
    ("loan_to_deposit_min", "loan_to_deposit_max", "loan_to_deposit"),
]


def _has_ratio_filters(f: ScreenerFilters) -> bool:
    return any(
        getattr(f, lo) is not None or getattr(f, hi) is not None
        for lo, hi, _ in _RATIO_FIELDS
    ) or f.tier1_min is not None


def _passes_ratio_filters(ratios: dict, f: ScreenerFilters) -> bool:
    for lo_attr, hi_attr, key in _RATIO_FIELDS:
        lo = getattr(f, lo_attr)
        hi = getattr(f, hi_attr)
        if lo is None and hi is None:
            continue
        val = ratios.get(key)
        if val is None:
            return False
        if lo is not None and val < lo:
            return False
        if hi is not None and val > hi:
            return False
    if f.tier1_min is not None:
        t1 = ratios.get("tier1_ratio")
        if t1 is None or t1 < f.tier1_min:
            return False
    return True


@router.post("/screen")
async def screen_banks(filters: ScreenerFilters):
    """Run screener with 20+ filters. Returns paginated bank list with ratios."""
    fdic_filter = build_fdic_filter(filters)
    sort_map = {
        "asset": "ASSET",
        "roa": "ASSET",  # FDIC can't sort by ratio; sort post-fetch
        "name": "NAME",
        "state": "STNAME",
    }
    sort_by = sort_map.get(filters.sort_by, "ASSET")
    use_ratio_filter = _has_ratio_filters(filters)

    # Over-fetch more when ratio-filtering so we have enough after post-filter
    prefetch = min(filters.limit * 5, 200) if use_ratio_filter else min(filters.limit * 3, 500)

    data = await get_institutions(
        filters=fdic_filter,
        sort_by=sort_by,
        sort_order=filters.sort_dir.upper(),
        limit=prefetch,
        offset=filters.offset,
    )

    rows = [r["data"] for r in data.get("data", [])]
    total = data.get("meta", {}).get("total", len(rows))

    ratio_map: dict = {}
    if use_ratio_filter:
        sem = asyncio.Semaphore(50)

        async def fetch_ratios(cert: int) -> tuple[int, dict]:
            async with sem:
                try:
                    fins = await get_financials(cert, limit=1)
                    return cert, compute_ratios(fins[0]) if fins else {}
                except Exception:
                    return cert, {}

        certs = [r["CERT"] for r in rows if r.get("CERT")]
        results_pairs = await asyncio.gather(*[fetch_ratios(c) for c in certs])
        ratio_map = dict(results_pairs)

    results = []
    for row in rows:
        cert = row.get("CERT")
        ratios = ratio_map.get(cert, {})

        if use_ratio_filter and not _passes_ratio_filters(ratios, filters):
            continue

        results.append({
            "cert": cert,
            "name": row.get("NAME"),
            "city": row.get("CITY"),
            "stname": row.get("STNAME"),
            "zip": row.get("ZIP"),
            "asset": row.get("ASSET"),
            "repdte": row.get("REPDTE"),
            "charter_class": row.get("CHRTAGNT"),
            "specgrp": row.get("SPECGRP"),
            "active": row.get("ACTIVE", 1) == 1,
            **ratios,
        })
        if len(results) >= filters.limit:
            break

    return {"total": total, "data": results}


@router.get("/export")
async def export_banks(
    state: Optional[str] = Query(None),
    asset_min: Optional[float] = Query(None),
    asset_max: Optional[float] = Query(None),
    limit: int = Query(default=500, le=2000),
):
    """Export screener results to CSV."""
    f = ScreenerFilters(
        state=[state] if state else None,
        asset_min=asset_min,
        asset_max=asset_max,
        limit=limit,
    )
    fdic_filter = build_fdic_filter(f)
    data = await get_institutions(filters=fdic_filter, limit=limit)
    rows = [r["data"] for r in data.get("data", [])]

    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=banks.csv"},
    )
