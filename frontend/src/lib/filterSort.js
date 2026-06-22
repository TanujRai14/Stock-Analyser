/** @typedef {import('./types').StockRow} StockRow */

export const QUICK_FILTERS = {
  ALL: "all",
  SHORTLISTED: "shortlisted",
  HIGH_VOLUME: "high_volume",
  OVERSOLD: "oversold",
};

export const SORT_OPTIONS = {
  DEFAULT: "default",
  PRICE_DESC: "price_desc",
  RSI_EXTREME: "rsi_extreme",
  VOLUME_FIRST: "volume_first",
};

/**
 * @param {StockRow[]} rows
 * @param {string} filter - one of QUICK_FILTERS
 * @returns {StockRow[]}
 */
export function applyQuickFilter(rows, filter) {
  switch (filter) {
    case QUICK_FILTERS.SHORTLISTED:
      return rows.filter((r) => r.shortlisted);
    case QUICK_FILTERS.HIGH_VOLUME:
      return rows.filter((r) => r.volume_spike);
    case QUICK_FILTERS.OVERSOLD:
      return rows.filter((r) => typeof r.rsi === "number" && r.rsi < 30);
    case QUICK_FILTERS.ALL:
    default:
      return rows;
  }
}

/**
 * @param {StockRow[]} rows
 * @param {string} sortKey - one of SORT_OPTIONS
 * @returns {StockRow[]} a new sorted array; never mutates the input
 */
export function applySort(rows, sortKey) {
  const copy = [...rows];
  switch (sortKey) {
    case SORT_OPTIONS.PRICE_DESC:
      return copy.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    case SORT_OPTIONS.RSI_EXTREME:
      return copy.sort((a, b) => {
        const da = typeof a.rsi === "number" ? Math.abs(a.rsi - 50) : -1;
        const db = typeof b.rsi === "number" ? Math.abs(b.rsi - 50) : -1;
        return db - da;
      });
    case SORT_OPTIONS.VOLUME_FIRST:
      return copy.sort((a, b) => (b.volume_spike ? 1 : 0) - (a.volume_spike ? 1 : 0));
    case SORT_OPTIONS.DEFAULT:
    default:
      return copy;
  }
}