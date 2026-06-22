from motor.motor_asyncio import AsyncIOMotorDatabase

from models import ScanDocument, ScanSummary


async def ensure_scan_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.scans.create_index("scan_date")
    await db.scans.create_index("timestamp")
    await db.scans.create_index("scan_id", unique=True)


async def save_scan(db: AsyncIOMotorDatabase, scan: ScanDocument) -> ScanDocument:
    doc = scan.model_dump(mode="python")
    await db.scans.update_one({"scan_id": scan.scan_id}, {"$set": doc}, upsert=True)
    return scan


async def get_scan_by_date(
    db: AsyncIOMotorDatabase,
    scan_date: str,
    universe_name: str | None = None,
) -> ScanDocument | None:
    query: dict[str, str] = {"scan_date": scan_date}
    if universe_name:
        query["universe_name"] = universe_name
    doc = await db.scans.find_one(query, {"_id": 0}, sort=[("timestamp", -1)])
    return ScanDocument(**doc) if doc else None


async def get_scan_by_id(db: AsyncIOMotorDatabase, scan_id: str) -> ScanDocument | None:
    doc = await db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
    return ScanDocument(**doc) if doc else None


async def get_recent_scans(db: AsyncIOMotorDatabase, limit: int = 10) -> list[ScanSummary]:
    cursor = db.scans.find(
        {},
        {
            "_id": 0,
            "scan_id": 1,
            "scan_date": 1,
            "timestamp": 1,
            "total_scanned_count": 1,
            "shortlisted_count": 1,
            "execution_time_seconds": 1,
            "universe_name": 1,
        },
    ).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(limit)
    return [ScanSummary(**doc) for doc in docs]
