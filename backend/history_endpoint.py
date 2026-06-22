import logging
import math
import pandas as pd
from fastapi import APIRouter, HTTPException

# Import the actual working tools and constants from your market data service
from services.market_data_service import fetch_ticker_data, EMA_SHORT_WINDOW, EMA_LONG_WINDOW

logger = logging.getLogger(__name__)
history_router = APIRouter()

@history_router.get("/screener/history")
async def get_price_history(ticker: str):
    """
    Returns a list of {date, price, ema50, ema200} for the trailing 1 year,
    suitable for direct use in the frontend's Recharts line chart.
    """
    logger.info(f"Fetching historical charting array for query: {ticker}")
    
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker parameter is required")

    # 1. Await the async data fetch function from your service file
    price_df = await fetch_ticker_data(ticker)
    
    # ... leave the rest of your math loop logic exactly the same ...

    if price_df is None or price_df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No price history available for '{ticker}'.",
        )

    try:
        # 2. Drop rows missing execution closing data
        df = price_df.dropna(subset=["Close"]).copy()
        
        # 3. Compute rolling exponential moving averages directly on the dataframe
        df["EMA50"] = df["Close"].ewm(span=EMA_SHORT_WINDOW, adjust=False).mean()
        df["EMA200"] = df["Close"].ewm(span=EMA_LONG_WINDOW, adjust=False).mean()
        
        # 4. Map rows into standard JSON dictionary objects for the frontend
        chart_data = []
        for timestamp, row in df.iterrows():
            # Format date object seamlessly
            date_str = timestamp.strftime("%Y-%m-%d") if hasattr(timestamp, "strftime") else str(timestamp)
            
            # Filter out any NaN data elements so Recharts doesn't break
            ema50_val = row["EMA50"]
            ema200_val = row["EMA200"]
            
            chart_data.append({
                "date": date_str,
                "price": round(float(row["Close"]), 2),
                "ema50": round(float(ema50_val), 2) if not pd.isna(ema50_val) else None,
                "ema200": round(float(ema200_val), 2) if not pd.isna(ema200_val) else None,
            })
            
        return {"status": "success", "ticker": ticker, "data": chart_data}

    except Exception as exc:
        logger.exception(f"Error parsing historical tracking grid for {ticker}")
        raise HTTPException(status_code=500, detail=str(exc))