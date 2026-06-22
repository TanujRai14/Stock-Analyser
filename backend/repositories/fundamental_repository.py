from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase


async def ensure_fundamental_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.fundamental_cache.create_index("ticker", unique=True)
    await db.fundamental_cache.create_index("last_updated")


async def get_cached_growth(
    db: AsyncIOMotorDatabase,
    ticker: str,
    max_age_days: int = 30,
) -> dict | None:
    doc = await db.fundamental_cache.find_one({"ticker": ticker}, {"_id": 0})
    if not doc:
        return None

    last_updated = doc.get("last_updated")
    if isinstance(last_updated, str):
        last_updated = datetime.fromisoformat(last_updated)
    if last_updated and last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)

    if not last_updated or datetime.now(timezone.utc) - last_updated > timedelta(days=max_age_days):
        return None
    return doc


async def upsert_growth(
    db: AsyncIOMotorDatabase,
    ticker: str,
    yoy_growth: float | None,
    fiscal_period: str | None,
) -> None:
    await db.fundamental_cache.update_one(
        {"ticker": ticker},
        {
            "$set": {
                "ticker": ticker,
                "yoy_growth": yoy_growth,
                "fiscal_period": fiscal_period,
                "last_updated": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
