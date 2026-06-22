import React from "react";
import { QUICK_FILTERS, SORT_OPTIONS } from "../lib/filterSort";

const QUICK_FILTER_LABELS = [
  { key: QUICK_FILTERS.ALL, label: "All" },
  { key: QUICK_FILTERS.SHORTLISTED, label: "Shortlisted bullish" },
  { key: QUICK_FILTERS.HIGH_VOLUME, label: "High volume breakouts" },
  { key: QUICK_FILTERS.OVERSOLD, label: "Oversold recovery plays" },
];

const SORT_LABELS = {
  [SORT_OPTIONS.DEFAULT]: "Default order",
  [SORT_OPTIONS.PRICE_DESC]: "Price: high to low",
  [SORT_OPTIONS.RSI_EXTREME]: "RSI: most extreme first",
  [SORT_OPTIONS.VOLUME_FIRST]: "Volume spikes first",
};

/**
 * @param {{
 *   activeFilter: string,
 *   onFilterChange: (key: string) => void,
 *   sortKey: string,
 *   onSortChange: (key: string) => void,
 *   watchlistOnly: boolean,
 *   onToggleWatchlistOnly: () => void,
 *   resultCount: number,
 * }} props
 */
export default function FilterToolbar({
  activeFilter,
  onFilterChange,
  sortKey,
  onSortChange,
  watchlistOnly,
  onToggleWatchlistOnly,
  resultCount,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === key
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06]"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={onToggleWatchlistOnly}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            watchlistOnly
              ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
              : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06]"
          }`}
        >
          ★ My watchlist
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-slate-500">{resultCount} shown</span>
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-[#0A0E16]">
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
