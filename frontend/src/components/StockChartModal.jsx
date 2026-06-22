import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

// NOTE: this calls a NEW endpoint that doesn't exist on your backend yet.
// /api/screener returns today's snapshot only — this modal needs a full
// year of daily closes + EMAs per ticker. See backend/history_endpoint.py
// for a ready-to-wire FastAPI route that reuses your existing screener.py
// fetch/EMA logic (no DB, no paid API — just another yfinance call).
const HISTORY_API_BASE = "http://localhost:8000/api/screener/history";

/**
 * Expected response shape from the history endpoint:
 *   [{ date: "2025-06-01", close: 1234.5, ema50: 1200.1, ema200: 1100.0 }, ...]
 *
 * @param {{ ticker: string|null, onClose: () => void }} props
 */
export default function StockChartModal({ ticker, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${HISTORY_API_BASE}/${encodeURIComponent(ticker)}`, { timeout: 20000 });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err.response
          ? `History endpoint responded with ${err.response.status}.`
          : "Could not reach the history endpoint — has it been added to the backend yet?"
      );
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!ticker) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${ticker} price chart`}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B0F18] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">1-year price action</p>
            <h3 className="font-display mt-0.5 text-2xl font-semibold text-slate-50">{ticker}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            aria-label="Close chart"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5 h-80">
          {loading && <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>}

          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="px-6 text-sm text-rose-300">{error}</p>
              <button onClick={fetchHistory} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No historical data returned for {ticker}.</div>
          )}

          {!loading && !error && history.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} minTickGap={40} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} width={50} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#0B0F18", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
                <Line type="monotone" dataKey="close" name="Close" stroke="#E2E8F0" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="ema50" name="50 EMA" stroke="#22C58B" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="ema200" name="200 EMA" stroke="#E8B85C" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
