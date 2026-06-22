import os
from dataclasses import dataclass

from data.nifty100 import NIFTY100_TICKERS
from data.nifty250 import NIFTY250_TICKERS
from data.nifty500 import NIFTY500_TICKERS


@dataclass(frozen=True)
class Universe:
    name: str
    tickers: list[str]


UNIVERSES: dict[str, list[str]] = {
    "NIFTY100": NIFTY100_TICKERS,
    "NIFTY250": NIFTY250_TICKERS,
    "NIFTY500": NIFTY500_TICKERS,
}


def get_active_universe() -> Universe:
    configured = os.environ.get("SCREENING_UNIVERSE", "NIFTY100").strip().upper()
    name = configured if configured in UNIVERSES else "NIFTY100"
    return Universe(name=name, tickers=UNIVERSES[name])
