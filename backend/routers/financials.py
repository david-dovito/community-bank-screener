from fastapi import APIRouter, HTTPException
from backend.services.fdic import get_financials, get_institution, compute_ratios
from backend.models.bank import PeerCompareRequest
import asyncio

router = APIRouter(prefix="/financials", tags=["financials"])


@router.get("/{cert}")
async def get_bank_financials(cert: int, limit: int = 80):
    """Return up to 80 quarters of financial data with computed ratios."""
    rows = await get_financials(cert, limit=limit)
    if not rows:
        raise HTTPException(404, detail="No financial data found")

    enriched = []
    for row in rows:
        ratios = compute_ratios(row)
        enriched.append({**row, **ratios})

    return {"cert": cert, "count": len(enriched), "data": enriched}


@router.post("/peer-compare")
async def peer_compare(req: PeerCompareRequest):
    """Compare up to 5 banks side-by-side on key metrics."""
    if len(req.certs) < 2 or len(req.certs) > 5:
        raise HTTPException(400, detail="Provide 2–5 cert numbers")

    tasks = [
        asyncio.gather(get_institution(c), get_financials(c, limit=1))
        for c in req.certs
    ]
    results = await asyncio.gather(*tasks)

    peers = []
    for (inst, fins), cert in zip(results, req.certs):
        latest = fins[0] if fins else {}
        ratios = compute_ratios(latest)
        peers.append({
            "cert": cert,
            "name": inst.get("NAME", f"CERT {cert}"),
            "state": inst.get("STNAME"),
            "asset": inst.get("ASSET"),
            "repdte": latest.get("REPDTE"),
            **ratios,
        })

    return {"peers": peers}
