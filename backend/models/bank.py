from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class CharterType(str, Enum):
    national_bank = "NB"
    state_member = "SM"
    state_nonmember = "SN"
    savings_bank = "SB"
    savings_assoc = "SA"
    credit_union = "CU"


class BankSummary(BaseModel):
    cert: int
    name: str
    city: str
    stname: str
    zip: Optional[str] = None
    asset: Optional[float] = None  # thousands
    repdte: Optional[str] = None
    charter_class: Optional[str] = None
    specgrp: Optional[int] = None
    active: bool = True


class BankFinancials(BaseModel):
    cert: int
    repdte: str
    asset: Optional[float] = None
    dep: Optional[float] = None
    lnlsnet: Optional[float] = None
    netinc: Optional[float] = None
    intinc: Optional[float] = None
    eintexp: Optional[float] = None
    nonii: Optional[float] = None
    nonix: Optional[float] = None
    # Derived ratios
    roa: Optional[float] = None
    roe: Optional[float] = None
    nim: Optional[float] = None
    efficiency_ratio: Optional[float] = None
    loan_to_deposit: Optional[float] = None
    npl_ratio: Optional[float] = None
    tier1_ratio: Optional[float] = None
    equity: Optional[float] = None
    intexp: Optional[float] = None


class BankDetail(BankSummary):
    address: Optional[str] = None
    stalp: Optional[str] = None
    county: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    webaddr: Optional[str] = None
    hctmult: Optional[str] = None  # bank holding company
    estymd: Optional[str] = None   # established date
    instcat: Optional[int] = None
    financials: Optional[list[BankFinancials]] = None


class Branch(BaseModel):
    cert: int
    brnum: int
    brname: str
    city: str
    stname: str
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bkclass: Optional[str] = None
    asset: Optional[float] = None


class ScreenerFilters(BaseModel):
    # Geography
    state: Optional[list[str]] = None
    city: Optional[str] = None

    # Size
    asset_min: Optional[float] = None  # thousands
    asset_max: Optional[float] = None

    # Charter
    charter_class: Optional[list[str]] = None
    specgrp: Optional[list[int]] = None

    # Profitability
    roa_min: Optional[float] = None
    roa_max: Optional[float] = None
    roe_min: Optional[float] = None
    roe_max: Optional[float] = None
    nim_min: Optional[float] = None
    nim_max: Optional[float] = None

    # Efficiency
    efficiency_min: Optional[float] = None
    efficiency_max: Optional[float] = None

    # Credit quality
    npl_min: Optional[float] = None
    npl_max: Optional[float] = None

    # Capital
    tier1_min: Optional[float] = None

    # Funding
    loan_to_deposit_min: Optional[float] = None
    loan_to_deposit_max: Optional[float] = None

    # Valuation
    ptbv_min: Optional[float] = None
    ptbv_max: Optional[float] = None

    # M&A
    ma_prob_min: Optional[float] = None

    # Pagination
    limit: int = Field(default=50, le=500)
    offset: int = Field(default=0, ge=0)
    sort_by: str = "asset"
    sort_dir: str = "desc"


class PeerCompareRequest(BaseModel):
    certs: list[int] = Field(..., min_length=2, max_length=5)
    period: Optional[str] = None  # YYYYMMDD


class MAScore(BaseModel):
    cert: int
    name: str
    score: float  # 0-100
    factors: dict[str, float]


class CreditUnion(BaseModel):
    cu_number: int
    cu_name: str
    state: str
    city: str
    asset_total: Optional[float] = None
    member_count: Optional[int] = None
    roa: Optional[float] = None
    net_worth_ratio: Optional[float] = None
    loan_to_asset: Optional[float] = None
    delinquency_rate: Optional[float] = None
    active: bool = True


class MutualConversion(BaseModel):
    cert: int
    name: str
    state: str
    asset: Optional[float] = None
    equity: Optional[float] = None
    conversion_date: Optional[str] = None
    ipo_price: Optional[float] = None
    current_price: Optional[float] = None
    ptbv: Optional[float] = None
    status: str  # "announced" | "completed" | "potential"
