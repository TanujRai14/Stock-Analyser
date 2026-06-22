import React from "react";

/** @typedef {import('../lib/types').StockRow} StockRow */

/**
 * @param {number|null|undefined} n
 * @param {number} [digits]
 * @returns {string}
 */
function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** @param {number|null|undefined} rsi */
function rsiTone(rsi) {
  if (typeof rsi !== "number") return "text-slate-500";
  if (rsi > 70) return "text-amber-400";
  if (rsi < 30) return "text-rose-400";
  return "text-slate-300";
}

/**
 * @param {{
 *   rows: StockRow[],
 *   loading?: boolean,
 *   isStarred: (ticker: string) => boolean,
 *   onToggleStar: (ticker: string) => void,
 *   onSelectTicker: (ticker: string) => void,
 * }} props
 */
export default function StockTable({ rows, loading = false, isStarred, onToggleStar, onSelectTicker }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3.5 font-medium" aria-label="Watchlist" />
            <th className="px-3 py-3.5 font-medium">Ticker</th>
            <th className="px-3 py-3.5 text-right font-medium">Price</th>
            <th className="px-3 py-3.5 text-right font-medium">50 EMA</th>
            <th className="px-3 py-3.5 text-right font-medium">200 EMA</th>
            <th className="px-3 py-3.5 text-right font-medium">RSI</th>
            <th className="px-3 py-3.5 text-right font-medium">Volume</th>
            <th className="px-3 py-3.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            rows.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-white/5">
                <td colSpan={8} className="px-3 py-4">
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                </td>
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                No stocks match the current filters.
              </td>
            </tr>
          )}

          {rows.map((r) => (
            <tr
              key={r.ticker}
              className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
              onClick={() => onSelectTicker(r.ticker)}
              title={`View ${r.ticker} chart`}
            >
              <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleStar(r.ticker)}
                  aria-label={isStarred(r.ticker) ? `Remove ${r.ticker} from watchlist` : `Add ${r.ticker} to watchlist`}
                  className={`transition ${isStarred(r.ticker) ? "text-amber-400" : "text-slate-600 hover:text-slate-300"}`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill={isStarred(r.ticker) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </td>
              <td className="px-3 py-3.5 font-medium text-slate-100">
                <span className="inline-flex items-center gap-1.5">
                  {r.ticker}
                  {r.data_sufficient === false && (
                    <span title="Insufficient data for one or more metrics" className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                  )}
                </span>
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-slate-300">{fmtNum(r.price)}</td>
              <td className="px-3 py-3.5 text-right font-mono text-slate-400">{fmtNum(r.ema50)}</td>
              <td className="px-3 py-3.5 text-right font-mono text-slate-400">{fmtNum(r.ema200)}</td>
              <td className={`px-3 py-3.5 text-right font-mono ${rsiTone(r.rsi)}`}>{fmtNum(r.rsi, 1)}</td>
              <td className="px-3 py-3.5 text-right">
                {r.volume_spike ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                    SPIKE
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </td>
              <td className="px-3 py-3.5 text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide ${
                    r.shortlisted
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/30 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {r.shortlisted ? "Shortlisted" : "No setup"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
