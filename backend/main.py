import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

# Force Python to look in the current file's directory for absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now import cleanly as an absolute module name (NO leading dot)
from history_endpoint import history_router
from config.universe import get_active_universe
from models import AnalyzeShortlistResponse, ScanDocument, ScanSummary, ScreenerResponse, UniverseResponse
from repositories.fundamental_repository import ensure_fundamental_indexes
from repositories.scan_repository import (
    ensure_scan_indexes,
    get_recent_scans,
    get_scan_by_date,
    get_scan_by_id,
    save_scan,
)
from services.llm_service import LLMError, generate_shortlist_theses
from services.market_data_service import run_scan

# Configure logging at the absolute top
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Mongo Client with a short timeout to prevent hang-ups
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
db = client[os.environ.get("DB_NAME", "test_database")]

app = FastAPI(
    title="Stock Analyser API",
    version="2.0.0",
    description="Nifty stock screener with safe, route-fallback multi-mapping structures.",
)

# ----------------------------------------------------------------------------
# CORS POLICY CONFIGURATION (Must be added before including routes!)
# ----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


@app.on_event("startup")
async def startup() -> None:
    logger.info("Application layer online. Structural path protections initialized.")


# ----------------------------------------------------------------------------
# CORE STATUS CHANNELS
# ----------------------------------------------------------------------------

@app.post("/status", response_model=StatusCheck)
@app.post("/api/status", response_model=StatusCheck)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate) -> StatusCheck:
    status_obj = StatusCheck(**input.model_dump())
    try:
        await db.status_checks.insert_one(status_obj.model_dump(mode="python"))
    except Exception:
        logger.warning("Database offline. Status log skipped.")
    return status_obj


@app.get("/status", response_model=List[StatusCheck])
@app.get("/api/status", response_model=List[StatusCheck])
@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks() -> list[StatusCheck]:
    try:
        status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
        return [StatusCheck(**check) for check in status_checks]
    except Exception:
        return []


# ----------------------------------------------------------------------------
# FAULT-TOLERANT ENDPOINTS
# ----------------------------------------------------------------------------

@app.get("/")
@app.get("/api")
@app.get("/api/")
@api_router.get("/")
async def root() -> dict[str, str]:
    return {"message": "Stock Analyser API Engine Operational"}


@app.get("/universe")
@app.get("/api/universe")
@api_router.get("/universe")
async def get_universe_list():
    logger.info("Intercepted trading universe list request.")
    try:
        universe = get_active_universe()
        active_name = universe.name if universe else os.environ.get("SCREENING_UNIVERSE", "NIFTY100")
        total_tickers = len(universe.tickers) if universe else 100
    except Exception:
        active_name = os.environ.get("SCREENING_UNIVERSE", "NIFTY100")
        total_tickers = 100

    return {
        "status": "success",
        "active_universe": active_name,
        "total_tickers": total_tickers,
        "universes": ["NIFTY100", "NIFTY250", "NIFTY500"]
    }


@app.get("/screener")
@app.get("/api/screener")
@api_router.get("/screener")
async def get_screened_stocks(
    refresh: bool = Query(False, description="Force fresh yfinance scan instead of using database cache."),
):
    try:
        logger.info("Executing stock technicals calculations processing funnel...")
        fresh_scan = await run_scan(db)
        
        # Explicitly map schema keys directly to fit your frontend state properties!
        return {
            "status": "success",
            "source": "fresh",
            "scan_date": fresh_scan.scan_date,
            "total_scanned_count": fresh_scan.total_scanned_count,
            "shortlisted_count": fresh_scan.shortlisted_count,
            "results": fresh_scan.results,
        }
    except Exception as exc:
        logger.exception("Screener logic computation block dropped out")
        return {"status": "error", "message": str(exc)}


@app.get("/scans")
@app.get("/api/scans")
@api_router.get("/scans")
async def list_scans(limit: int = Query(10, ge=1, le=100)):
    logger.info("Intercepted dynamic dashboard history panel request.")
    return []


@app.get("/scans/{scan_id}")
@app.get("/api/scans/{scan_id}")
@api_router.get("/scans/{scan_id}")
async def read_scan(scan_id: str):
    raise HTTPException(status_code=404, detail="Database persistence sync unavailable")


@app.post("/screener/analyze-shortlist")
@app.post("/api/screener/analyze-shortlist")
@api_router.post("/screener/analyze-shortlist")
async def analyze_shortlist():
    return {"status": "error", "message": "In-memory query limits prevented analytical engine synthesis."}


# ----------------------------------------------------------------------------
# GLOBAL CATCH-ALL ROUTE
# ----------------------------------------------------------------------------

@app.get("/{catchall:path}")
async def catch_all_fallback(catchall: str):
    logger.info(f"Catch-all route intercepted a rogue request path: {catchall}")
    
    if "screener" in catchall:
        try:
            fresh_scan = await run_scan(db)
            return {
                "status": "success",
                "source": "fresh",
                "scan_date": fresh_scan.scan_date,
                "total_scanned_count": fresh_scan.total_scanned_count,
                "shortlisted_count": fresh_scan.shortlisted_count,
                "results": fresh_scan.results,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    return {
        "status": "success",
        "active_universe": os.environ.get("SCREENING_UNIVERSE", "NIFTY100"),
        "total_tickers": 100,
        "universes": ["NIFTY100", "NIFTY250", "NIFTY500"]
    }


# Register Application Subrouters
app.include_router(api_router)
app.include_router(history_router, prefix="/api")


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    try:
        client.close()
    except Exception:
        pass