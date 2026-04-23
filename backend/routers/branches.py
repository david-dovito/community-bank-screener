from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.fdic import get_branches, get_all_branches_in_state

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("/{cert}")
async def get_bank_branches(cert: int):
    """All branches for a single bank — lat/lng for map rendering."""
    rows = await get_branches(cert)
    if not rows:
        raise HTTPException(404, detail="No branches found")
    return {"cert": cert, "count": len(rows), "branches": rows}


@router.get("/state/{state}")
async def get_branches_by_state(state: str):
    """All active branches in a state — used for heatmap layer."""
    rows = await get_all_branches_in_state(state.upper())
    return {"state": state.upper(), "count": len(rows), "branches": rows}
