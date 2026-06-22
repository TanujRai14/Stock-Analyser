import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

import { useWatchlist } from "./hooks/useWatchlist";
import { QUICK_FILTERS, SORT_OPTIONS, applyQuickFilter, applySort } from "./lib/filterSort";
import { exportToCsv } from "./lib/csvExport";

import ErrorBoundary from "./components/ErrorBoundary";
import MarketPulseHeader from "./components/MarketPulseHeader";
import SectorHeatmap from "./components/SectorHeatmap";
import FilterToolbar from "./components/FilterToolbar";
import StockTable from "./components/StockTable";
import StockChartModal from "./components/StockChartModal";

const API_URL = process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}/screener` : "http://localhost:8000/api/screener";

/** @param {{ label: string, value: number|string, accent: string, hint?: string }} props */
function KpiCard({ label, value, accent, hint }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: accent }} />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-4xl font-semibold text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * @param {number|null|undefined} n
 * @param {number} [digits]
 */
function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeFilter, setActiveFilter] = useState(QUICK_FILTERS.ALL);
  const [sortKey, setSortKey] = useState(SORT_OPTIONS.DEFAULT);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);

  const { watchlist, isStarred, toggleStar } = useWatchlist();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Increase Axios connection timeout to 60000ms (60s) to fully allow the yfinance pipeline to compile
      const res = await axios.get(API_URL, { timeout: 60000 });
      
      // 🚀 FIX: Extract 'results' from the response object wrapper!
      const stockArray = res.data && Array.isArray(res.data.results) ? res.data.results : [];
      
      setRows(stockArray);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response ? `Backend responded with ${err.response.status}.` : "Could not reach the backend at localhost:8000. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleRows = useMemo(() => {
    let result = rows;
    if (watchlistOnly) result = result.filter((r) => watchlist.includes(r.ticker));
    result = applyQuickFilter(result, activeFilter);
    result = applySort(result, sortKey);
    return result;
  }, [rows, watchlistOnly, watchlist, activeFilter, sortKey]);

  const totalScanned = rows.length;
  const passedTrend = rows.filter((r) => r.trend_rule_pass).length;
  const shortlisted = rows.filter((r) => r.shortlisted).length;

  const handleExport = () => {
    const exported = exportToCsv(visibleRows, "Nifty_Quant_Report.csv");
    if (!exported) {
      // eslint-disable-next-line no-alert
      alert("Nothing to export yet — run a scan or adjust your filters first.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E16] text-slate-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        @keyframes tape-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .tape-track { animation: tape-scroll 120s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .tape-track { animation: none; } }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(700px circle at 12% -10%, rgba(34,197,139,0.10), transparent 60%), radial-gradient(900px circle at 90% 0%, rgba(232,184,92,0.08), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400/80">swing-trade funnel</p>
            <h1 className="font-display mt-1 text-3xl font-semibold text-white sm:text-4xl">
              Screener<span className="text-slate-500">://</span>dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">{lastUpdated ? `Last scanned ${lastUpdated.toLocaleTimeString()}` : "Awaiting first scan"}</p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export report
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="group inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-4.5M20 15a8 8 0 01-14 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? "Scanning..." : "Refresh scan"}
            </button>
          </div>
        </header>

        {/* ticker tape */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] py-2.5">
            <div className="tape-track flex w-max gap-8 whitespace-nowrap px-4 font-mono text-xs">
              {[...rows, ...rows].map((r, i) => (
                <span key={i} className="flex items-center gap-1.5 text-slate-400">
                  <span className="font-semibold text-slate-200">{r.ticker}</span>
                  <span>{fmtNum(r.price)}</span>
                  <span className={r.trend_rule_pass ? "text-emerald-400" : "text-rose-400"}>{r.trend_rule_pass ? "▲" : "▼"}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* error banner */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            <div>
              <p className="font-medium">Scan failed</p>
              <p className="text-rose-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Stocks scanned" value={totalScanned} accent="#64748B" />
          <KpiCard label="Passed trend rule" value={passedTrend} accent="#E8B85C" hint="Price > 50 EMA > 200 EMA" />
          <KpiCard label="High conviction" value={shortlisted} accent="#22C58B" hint="Trend + growth rule" />
        </section>

        {/* market pulse + sector heatmap */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ErrorBoundary label="Market pulse">
            <MarketPulseHeader rows={rows} />
          </ErrorBoundary>
          <ErrorBoundary label="Sector heatmap">
            <SectorHeatmap rows={rows} />
          </ErrorBoundary>
        </section>

        {/* filter toolbar */}
        <section className="mt-6">
          <ErrorBoundary label="Filter toolbar">
            <FilterToolbar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              sortKey={sortKey}
              onSortChange={setSortKey}
              watchlistOnly={watchlistOnly}
              onToggleWatchlistOnly={() => setWatchlistOnly((v) => !v)}
              resultCount={visibleRows.length}
            />
          </ErrorBoundary>
        </section>

        {/* table */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <ErrorBoundary label="Stock table">
            <StockTable rows={visibleRows} loading={loading} isStarred={isStarred} onToggleStar={toggleStar} onSelectTicker={setSelectedTicker} />
          </ErrorBoundary>
        </section>

        <footer className="mt-6 text-center text-xs text-slate-600">Data sourced from yfinance via the local screener funnel. Not investment advice.</footer>
      </div>

      <ErrorBoundary label="Price chart">
        <StockChartModal ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
      </ErrorBoundary>
    </div>
  );
}