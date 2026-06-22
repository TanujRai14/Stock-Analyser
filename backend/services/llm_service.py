import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any

import requests

from models import StockScanResult, ThesisItem


class LLMError(RuntimeError):
    pass


def _build_prompt(rows: list[StockScanResult]) -> str:
    payload = [
        {
            "ticker": row.ticker,
            "price": row.price,
            "ema50": row.ema50,
            "ema200": row.ema200,
            "yoy_growth": row.yoy_growth,
            "rsi": row.rsi,
            "overbought": row.overbought,
            "oversold": row.oversold,
            "latest_volume": row.latest_volume,
            "volume_sma20": row.volume_sma20,
            "volume_spike": row.volume_spike,
        }
        for row in rows
    ]
    return (
        "Return strict JSON only as an object with a data array. "
        "Each data item must have keys ticker and thesis. "
        "Write professional investment commentary in maximum 3 concise sentences per stock. "
        "Discuss trend, EMA alignment, earnings growth, RSI condition, and volume confirmation. "
        f"Metrics: {json.dumps(payload, separators=(',', ':'))}"
    )


def _extract_json_array(text: str) -> list[dict[str, Any]]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        stripped = stripped.removeprefix("json").strip()
    parsed = json.loads(stripped)
    if isinstance(parsed, dict):
        parsed = parsed.get("data") or parsed.get("theses") or parsed.get("results")
    if isinstance(parsed, list):
        return parsed
    raise LLMError("LLM response did not contain a thesis array.")


def _call_openai(prompt: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise LLMError("OPENAI_API_KEY is not configured.")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a concise equity research analyst."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        timeout=45,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    if isinstance(parsed, dict) and "data" in parsed:
        return json.dumps(parsed["data"])
    if isinstance(parsed, dict) and "theses" in parsed:
        return json.dumps(parsed["theses"])
    return content


def _call_gemini(prompt: str) -> str:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise LLMError("GOOGLE_API_KEY is not configured.")
    model = os.environ.get("LLM_MODEL", "gemini-1.5-flash")
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        params={"key": api_key},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=45,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


async def generate_shortlist_theses(rows: list[StockScanResult]) -> list[ThesisItem]:
    if not rows:
        return []

    provider = os.environ.get("LLM_PROVIDER", "openai").strip().lower()
    prompt = _build_prompt(rows)

    last_error: Exception | None = None
    for _attempt in range(2):
        try:
            if provider == "gemini":
                raw = await asyncio.to_thread(_call_gemini, prompt)
            else:
                raw = await asyncio.to_thread(_call_openai, prompt)
            items = _extract_json_array(raw)
            return [ThesisItem(**item) for item in items]
        except Exception as exc:
            last_error = exc
            await asyncio.sleep(1)

    generated_at = datetime.now(timezone.utc).isoformat()
    raise LLMError(f"LLM analysis failed at {generated_at}: {last_error}")
