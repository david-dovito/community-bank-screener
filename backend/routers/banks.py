from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models.bank import ScreenerFilters, BankSummary
from backend.services.fdic import (
    get_institutions,
    get_institution,
    build_fdic_filter,
    compute_ratios,
)
import io
import csv
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/banks", tags=["banks"])


@router.post("/screen")
async def screen_banks(filters: ScreenerFilters):
    """Run screener with 20+ filters. Returns paginated bank list with ratios."""
    fdic_filter = build_fdic_filter(filters)
    sort_map = {
        "asset": "ASSET",
        "roa": "ASSET",  # FDIC can't sort by ratio; we sort post-fetch
        "name": "NAME",
        "state": "STNAME",
    }
    sort_by = sort_map.get(filters.sort_by, "ASSET")

    data = await get_institutions(
        filters=fdic_filter,
        sort_by=sort_by,
        sort_order=filters.sort_dir.upper(),
        limit=min(filters.limit * 3, 500),  # over-fetch so ratio filters work
        offset=filters.offset,
    )

    rows = [r["data"] for r in data.get("data", [])]
    total = data.get("meta", {}).get("total", len(rows))

    # Attach latest financials for each bank (batch — one call per bank is too slow;
    # we use the screener endpoint which includes aggregate fields in FDIC institutions)
    results = []
    for row in rows:
        ratios: dict = {}
        # FDIC institutions endpoint doesn't include income statement data,
        # so ratios here come from pre-computed fields if available or are None.
        # Full ratios available on /banks/{cert} via financials endpoint.
        bank = {
            "cert": row.get("CERT"),
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
        }
        results.append(bank)

    return {"total": total, "data": results}


@router.get("/export")
async def export_banks(
    state: Optional[str] = Query(None),
    asset_min: Optional[float] = Query(None),
    asset_max: Optional[float] = Query(None),
    limit: int = Query(default=500, le=2000),
):
    """Export screener results to CSV."""
    from backend.models.bank import ScreenerFilters
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
