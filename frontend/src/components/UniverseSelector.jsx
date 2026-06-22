import React from "react";
import { Database } from "lucide-react";

export default function UniverseSelector({ universe }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
      <Database className="h-4 w-4 text-cyan-300" />
      <select
        value={universe?.active_universe || "NIFTY100"}
        disabled
        className="bg-transparent font-mono text-slate-200 outline-none"
      >
        <option>NIFTY100</option>
        <option>NIFTY250</option>
        <option>NIFTY500</option>
      </select>
      <span className="font-mono text-xs text-slate-500">
        {universe?.total_tickers ? `${universe.total_tickers} tickers` : "loading"}
      </span>
    </div>
  );
}
