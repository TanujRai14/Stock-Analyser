from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class StockScanResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ticker: str
    price: float | None = None
    ema50: float | None = None
    ema200: float | None = None
    yoy_growth: float | None = None
    yoy_net_profit_growth_pct: float | None = None
    rsi: float | None = None
    latest_volume: int | None = None
    volume_sma20: float | None = None
    volume_spike: bool = False
    overbought: bool = False
    oversold: bool = False
    trend_rule_pass: bool = False
    growth_rule_pass: bool = False
    data_sufficient: bool = False
    shortlisted: bool = False
    error: str | None = None


class ScanDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scan_id: str = Field(default_factory=lambda: str(uuid4()))
    scan_date: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_scanned_count: int
    shortlisted_count: int
    execution_time_seconds: float
    universe_name: str
    results: list[StockScanResult]


class ScreenerResponse(BaseModel):
    status: Literal["success", "error"]
    source: Literal["cache", "fresh"] | None = None
    count: int = 0
    scan: ScanDocument | None = None
    data: list[StockScanResult] = Field(default_factory=list)
    message: str | None = None


class ScanSummary(BaseModel):
    scan_id: str
    scan_date: str
    timestamp: datetime
    total_scanned_count: int
    shortlisted_count: int
    execution_time_seconds: float
    universe_name: str


class UniverseResponse(BaseModel):
    active_universe: str
    total_tickers: int


class ThesisItem(BaseModel):
    ticker: str
    thesis: str


class AnalyzeShortlistResponse(BaseModel):
    status: Literal["success", "error"]
    scan_id: str | None = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: list[ThesisItem] = Field(default_factory=list)
    message: str | None = None
