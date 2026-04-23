"""
Community Bank Screener — FastAPI backend
Data sources: FDIC BankFind Suite + NCUA quarterly reports (both free, no API key)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.middleware.bot_protection import BotProtectionMiddleware
from backend.routers import banks, financials, branches, credit_unions

app = FastAPI(
    title="Community Bank Screener API",
    description="FDIC + NCUA data — no paid APIs required",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Bot protection must be first
app.add_middleware(BotProtectionMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(banks.router)
app.include_router(financials.router)
app.include_router(branches.router)
app.include_router(credit_unions.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "name": "Community Bank Screener API",
        "docs": "/docs",
        "sources": ["FDIC BankFind Suite", "NCUA Quarterly Call Reports"],
    }
