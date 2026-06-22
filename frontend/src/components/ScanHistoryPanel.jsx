import React from "react";
import { Clock3 } from "lucide-react";

export default function ScanHistoryPanel({ scans, activeScanId, onSelect }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-amber-200" />
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">Recent scans</h2>
      </div>
      <div className="space-y-2">
        {scans.length === 0 && <p className="text-sm text-slate-500">No scan history yet.</p>}
        {scans.map((scan) => (
          <button
            key={scan.scan_id}
            onClick={() => onSelect(scan.scan_id)}
            className={`w-full rounded-md border px-3 py-2 text-left transition ${
              activeScanId === scan.scan_id
                ? "border-emerald-300/40 bg-emerald-300/10"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-300">{scan.scan_date}</span>
              <span className="font-mono text-xs text-slate-500">{scan.execution_time_seconds}s</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">{scan.universe_name}</span>
              <span className="text-emerald-300">{scan.shortlisted_count}/{scan.total_scanned_count}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
