"""
Compatibility wrapper for the original prototype screener.

The production API now uses services.market_data_service directly so it can
persist scans and reuse Mongo caches. This module keeps the old CLI/import
contract available for scripts that still call run_screener().
"""

import asyncio
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from config.universe import get_active_universe
from services.market_data_service import run_scan

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def run_screener(tickers: list[str] | None = None) -> list[dict]:
    async def _run() -> list[dict]:
        client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        try:
            db = client[os.environ["DB_NAME"]]
            scan = await run_scan(db, tickers)
            return [row.model_dump() for row in scan.results]
        finally:
            client.close()

    return asyncio.run(_run())


if __name__ == "__main__":
    universe = get_active_universe()
    print(f"\nRunning screener on {len(universe.tickers)} {universe.name} tickers at {datetime.now().isoformat()}\n")
    for row in run_screener():
        print(row)
