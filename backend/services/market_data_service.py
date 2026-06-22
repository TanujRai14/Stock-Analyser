import asyncio
import logging
import math
import time
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.universe import get_active_universe
from models import ScanDocument, StockScanResult
from repositories.fundamental_repository import get_cached_growth, upsert_growth

logger = logging.getLogger(__name__)

EMA_SHORT_WINDOW = 50
EMA_LONG_WINDOW = 200
GROWTH_THRESHOLD_PCT = 15.0
RSI_WINDOW = 14
VOLUME_WINDOW = 20
MAX_CONCURRENCY = 100

NET_INCOME_ROW_CANDIDATES = [
    "Net Income",
    "Net Income Common Stockholders",
    "NetIncome",
    "Net Income Applicable To Common Shares",
]


def _clean_float(value: object, digits: int = 2) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(number) or math.isinf(number):
        return None
    return round(number, digits)


def _fetch_price_history_sync(ticker: str) -> pd.DataFrame | None:
    try:
        df = yf.Ticker(ticker).history(period="1y", interval="1d", auto_adjust=False)
    except Exception as exc:
        logger.warning("[%s] Price fetch failed: %s", ticker, exc)
        return None
    if df is None or df.empty:
        logger.warning("[%s] No price history returned.", ticker)
        return None
    return df


def _fetch_quarterly_net_income_sync(ticker: str) -> tuple[pd.Series | None, str | None]:
    tk = yf.Ticker(ticker)
    income_df = None
    try:
        income_df = tk.quarterly_income_stmt
    except Exception:
        income_df = None

    if income_df is None or income_df.empty:
        try:
            income_df = tk.quarterly_financials
        except Exception:
            income_df = None

    if income_df is None or income_df.empty:
        logger.warning("[%s] No quarterly financials available.", ticker)
        return None, None

    for row_label in NET_INCOME_ROW_CANDIDATES:
        if row_label in income_df.index:
            series = income_df.loc[row_label].dropna().sort_index(ascending=False)
            fiscal_period = str(series.index[0].date()) if not series.empty else None
            return (series if not series.empty else None), fiscal_period

    logger.warning("[%s] Net income row not found.", ticker)
    return None, None


async def fetch_ticker_data(ticker: str) -> pd.DataFrame | None:
    return await asyncio.to_thread(_fetch_price_history_sync, ticker)


def compute_emas(price_df: pd.DataFrame) -> tuple[float | None, float | None, float | None]:
    closes = price_df["Close"].dropna()
    if len(closes) < EMA_LONG_WINDOW:
        return None, None, None
    latest_close = closes.iloc[-1]
    ema50 = closes.ewm(span=EMA_SHORT_WINDOW, adjust=False).mean().iloc[-1]
    ema200 = closes.ewm(span=EMA_LONG_WINDOW, adjust=False).mean().iloc[-1]
    return _clean_float(latest_close), _clean_float(ema50), _clean_float(ema200)


def compute_rsi(price_df: pd.DataFrame) -> float | None:
    closes = price_df["Close"].dropna()
    if len(closes) < RSI_WINDOW + 1:
        return None
    delta = closes.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(RSI_WINDOW).mean()
    avg_loss = loss.rolling(RSI_WINDOW).mean()
    latest_loss = avg_loss.iloc[-1]
    if pd.isna(latest_loss):
        return None
    if latest_loss == 0:
        return 100.0
    rs = avg_gain.iloc[-1] / latest_loss
    return _clean_float(100 - (100 / (1 + rs)))


def compute_volume_signal(price_df: pd.DataFrame) -> tuple[int | None, float | None, bool]:
    if "Volume" not in price_df.columns:
        return None, None, False
    volumes = price_df["Volume"].dropna()
    if len(volumes) < VOLUME_WINDOW:
        return None, None, False
    latest_volume = int(volumes.iloc[-1])
    volume_sma20 = _clean_float(volumes.rolling(VOLUME_WINDOW).mean().iloc[-1])
    volume_spike = bool(volume_sma20 is not None and latest_volume > (2 * volume_sma20))
    return latest_volume, volume_sma20, volume_spike


def compute_yoy_net_profit_growth(net_income_series: pd.Series | None) -> float | None:
    if net_income_series is None or len(net_income_series) < 5:
        return None
    latest = net_income_series.iloc[0]
    year_ago = net_income_series.iloc[4]
    if pd.isna(latest) or pd.isna(year_ago) or year_ago == 0:
        return None
    return _clean_float(((latest - year_ago) / abs(year_ago)) * 100)


async def fetch_fundamentals(db: AsyncIOMotorDatabase, ticker: str) -> tuple[float | None, str | None]:
    # We have completely stripped out the MongoDB caching layers temporarily 
    # to stop the network thread from hanging on dead database connections.
    try:
        series, fiscal_period = await asyncio.to_thread(_fetch_quarterly_net_income_sync, ticker)
        growth = compute_yoy_net_profit_growth(series)
        return growth, fiscal_period
    except Exception as e:
        logger.warning("[%s] Raw fundamentals extraction failed: %s", ticker, str(e))
        return None, None
async def process_ticker(
    db: AsyncIOMotorDatabase,
    ticker: str,
    semaphore: asyncio.Semaphore,
) -> StockScanResult:
    started = time.perf_counter()
    async with semaphore:
        try:
            price_df = None
            try:
                price_df = await fetch_ticker_data(ticker)
            except Exception as e:
                logger.warning(f"[{ticker}] Price ingestion down: {str(e)}")

            # Gracefully handle missing database dependencies
            growth_pct = None
            _fiscal_period = None
            try:
                fundamentals = await fetch_fundamentals(db, ticker)
                if fundamentals and len(fundamentals) >= 2:
                    growth_pct, _fiscal_period = fundamentals
            except Exception as e:
                logger.warning(f"[{ticker}] MongoDB metadata offline: {str(e)}")

            price = ema50 = ema200 = rsi = volume_sma20 = None
            latest_volume = None
            volume_spike = False

            if price_df is not None and not price_df.empty:
                price, ema50, ema200 = compute_emas(price_df)
                rsi = compute_rsi(price_df)
                latest_volume, volume_sma20, volume_spike = compute_volume_signal(price_df)

            # Explicit comparison validation rules
            has_prices = bool(price is not None and ema50 is not None and ema200 is not None)
            trend_rule_pass = bool(has_prices and price > ema50 > ema200)
            
            # Safe numeric tracking evaluation
            growth_rule_pass = bool(growth_pct is not None and growth_pct > GROWTH_THRESHOLD_PCT)

            return StockScanResult(
                ticker=ticker,
                price=price,
                ema50=ema50,
                ema200=ema200,
                yoy_growth=growth_pct,
                yoy_net_profit_growth_pct=growth_pct,
                rsi=rsi,
                latest_volume=latest_volume,
                volume_sma20=volume_sma20,
                volume_spike=volume_spike,
                overbought=bool(rsi is not None and rsi > 70),
                oversold=bool(rsi is not None and rsi < 30),
                trend_rule_pass=trend_rule_pass,
                growth_rule_pass=growth_rule_pass,
                data_sufficient=bool(price is not None),
                shortlisted=bool(trend_rule_pass and growth_rule_pass),
            )
        except Exception as exc:
            logger.exception("[%s] Processing failed completely", ticker)
            return StockScanResult(ticker=ticker, error=str(exc))
        finally:
            logger.info("[%s] processed in %.2fs", ticker, time.perf_counter() - started)


# ----------------------------------------------------------------------------
# CORE QUANT SCAN COORDINATOR ENGINE
# ----------------------------------------------------------------------------

async def run_scan(db: AsyncIOMotorDatabase, tickers: list[str] | None = None) -> ScanDocument:
    universe = get_active_universe()
    selected_tickers = tickers or universe.tickers
    started = time.perf_counter()
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    logger.info("Starting quant computations across %s tickers.", len(selected_tickers))
    results = await asyncio.gather(
        *(process_ticker(db, ticker, semaphore) for ticker in selected_tickers)
    )
    execution_time = round(time.perf_counter() - started, 2)

    return ScanDocument(
        scan_date=datetime.now(timezone.utc).date().isoformat(),
        timestamp=datetime.now(timezone.utc),
        total_scanned_count=len(selected_tickers),
        shortlisted_count=sum(1 for row in results if hasattr(row, 'shortlisted') and row.shortlisted),
        execution_time_seconds=execution_time,
        universe_name=universe.name,
        results=results,
    )