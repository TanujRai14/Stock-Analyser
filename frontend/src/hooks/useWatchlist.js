import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "stock_analyser_watchlist";

/** @returns {string[]} */
function readStoredWatchlist() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt JSON, private-mode storage block, or storage unavailable —
    // fail soft and start with an empty list rather than crashing the app.
    return [];
  }
}

/**
 * Client-side watchlist persisted to localStorage. No backend, no account
 * system — the list lives only in this browser.
 *
 * @returns {{
 *   watchlist: string[],
 *   isStarred: (ticker: string) => boolean,
 *   toggleStar: (ticker: string) => void,
 * }}
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(readStoredWatchlist);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // Storage quota exceeded or unavailable — watchlist still works for
      // this session via React state, it just won't persist on reload.
    }
  }, [watchlist]);

  const isStarred = useCallback((ticker) => watchlist.includes(ticker), [watchlist]);

  const toggleStar = useCallback((ticker) => {
    setWatchlist((prev) => (prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]));
  }, []);

  return { watchlist, isStarred, toggleStar };
}