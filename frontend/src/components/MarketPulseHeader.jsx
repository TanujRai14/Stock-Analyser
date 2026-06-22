import React, { useMemo } from "react";

/** @typedef {import('../lib/types').StockRow} StockRow */

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {{ rows: StockRow[] }} props
 */
export default function MarketPulseHeader({ rows }) {
  const stats = useMemo(() => {
    const withRsi = rows.filter((r) => typeof r.rsi === "number" && !Number.isNaN(r.rsi));
    const overbought = withRsi.filter((r) => r.rsi > 70);
    const oversold = withRsi.filter((r) => r.rsi < 30);
    const avgRsi = withRsi.length > 0 ? withRsi.reduce((sum, r) => sum + r.rsi, 0) / withRsi.length : null;
    return {
      sampleSize: withRsi.length,
      overboughtCount: overbought.length,
      oversoldCount: oversold.length,
      avgRsi,
    };
  }, [rows]);

  const needlePct = stats.avgRsi !== null ? clamp(stats.avgRsi, 0, 100) : 50;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">Market pulse</p>
          <p className="font-display mt-1 text-2xl font-semibold text-slate-50">
            {stats.avgRsi !== null ? `Avg RSI ${stats.avgRsi.toFixed(1)}` : "RSI data unavailable"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-mono text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {stats.oversoldCount} oversold (RSI&lt;30)
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-mono text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {stats.overboughtCount} overbought (RSI&gt;70)
          </span>
        </div>
      </div>

      {/* fear-greed speedometer */}
      <div className="mt-5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0A0E16] bg-white shadow-md transition-all duration-700"
            style={{ left: `${needlePct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wide text-slate-500">
          <span>Fear · 0</span>
          <span>Neutral · 50</span>
          <span>Greed · 100</span>
        </div>
      </div>

      {stats.sampleSize === 0 && (
        <p className="mt-3 text-xs text-slate-500">
          No RSI values found in the current scan — confirm your backend response includes an
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5 font-mono">rsi</code>
          field per row.
        </p>
      )}
    </section>
  );
}
