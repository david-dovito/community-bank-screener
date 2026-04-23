from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.ncua import get_credit_unions, get_credit_union

router = APIRouter(prefix="/credit-unions", tags=["credit-unions"])


@router.get("/")
async def screen_credit_unions(
    state: Optional[str] = Query(None),
    asset_min: Optional[float] = Query(None),
    asset_max: Optional[float] = Query(None),
    limit: int = Query(default=50, le=500),
    offset: int = Query(default=0),
):
    rows = await get_credit_unions(
        state=state,
        asset_min=asset_min,
        asset_max=asset_max,
        limit=limit,
        offset=offset,
    )
    return {"count": len(rows), "data": rows}


@router.get("/{cu_number}")
async def get_cu_detail(cu_number: int):
    cu = await get_credit_union(cu_number)
    if not cu:
        raise HTTPException(404, detail="Credit union not found")
    return cu
