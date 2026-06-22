import React from "react";
import { Brain, Loader2, X } from "lucide-react";

export default function AISummaryPanel({
  open,
  summaries,
  loading,
  error,
  generatedAt,
  onGenerate,
  onClose,
}) {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 w-full max-w-md border-l border-white/10 bg-[#080d14] shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">AI thesis</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Shortlist analysis</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <button
            onClick={onGenerate}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate AI Analysis"}
          </button>
          {generatedAt && <p className="mt-2 font-mono text-xs text-slate-500">Updated {new Date(generatedAt).toLocaleString()}</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && summaries.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">
              Generate analysis after today's scan creates a shortlist.
            </div>
          )}

          {summaries.map((item) => (
            <article key={item.ticker} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <h3 className="font-mono text-sm font-semibold text-slate-100">{item.ticker}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.thesis}</p>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
