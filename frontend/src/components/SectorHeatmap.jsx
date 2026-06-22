import React, { useMemo } from "react";
import { buildSectorHeatmap } from "../lib/sectorMap";

/** @typedef {import('../lib/types').StockRow} StockRow */

/**
 * @param {{ rows: StockRow[] }} props
 */
export default function SectorHeatmap({ rows }) {
  const heatmap = useMemo(() => buildSectorHeatmap(rows), [rows]);

  if (heatmap.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">Sector heatmap</p>
        <p className="mt-3 text-sm text-slate-500">No scanned stocks to map yet — run a scan first.</p>
      </section>
    );
  }

  const maxPct = Math.max(...heatmap.map((h) => h.bullishPct), 1);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">Sector heatmap</p>
      <p className="mt-1 text-xs text-slate-500">Share of scanned tickers passing the trend rule, by sector</p>

      <div className="mt-4 space-y-2.5">
        {heatmap.map((s) => (
          <div key={s.sector} className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 truncate font-mono text-xs text-slate-300">{s.sector}</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-emerald-400/80 transition-all duration-500"
                style={{ width: `${(s.bullishPct / maxPct) * 100}%` }}
              />
            </div>
            <span className="w-16 flex-shrink-0 text-right font-mono text-xs text-slate-400">
              {s.bullish}/{s.total}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
