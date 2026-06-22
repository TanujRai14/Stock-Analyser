/** @typedef {import('./types').StockRow} StockRow */

// Lightweight ticker -> sector lookup. NOT exhaustive — covers common large/mid
// caps as a starting point. Extend this as your scanned universe grows; consider
// moving to a CSV/JSON file you maintain separately once it gets large.
export const SECTOR_MAP = {
  "RELIANCE.NS": "Energy",
  "ONGC.NS": "Energy",
  "BPCL.NS": "Energy",
  "IOC.NS": "Energy",
  "TCS.NS": "IT",
  "INFY.NS": "IT",
  "WIPRO.NS": "IT",
  "HCLTECH.NS": "IT",
  "TECHM.NS": "IT",
  "LTIM.NS": "IT",
  "HDFCBANK.NS": "Banking",
  "ICICIBANK.NS": "Banking",
  "SBIN.NS": "Banking",
  "AXISBANK.NS": "Banking",
  "KOTAKBANK.NS": "Banking",
  "INDUSINDBK.NS": "Banking",
  "BANKBARODA.NS": "Banking",
  "BAJFINANCE.NS": "Finance",
  "BAJAJFINSV.NS": "Finance",
  "HDFCLIFE.NS": "Finance",
  "SBILIFE.NS": "Finance",
  "ICICIPRULI.NS": "Finance",
  "MARUTI.NS": "Auto",
  "TATAMOTORS.NS": "Auto",
  "M&M.NS": "Auto",
  "BAJAJ-AUTO.NS": "Auto",
  "EICHERMOT.NS": "Auto",
  "HEROMOTOCO.NS": "Auto",
  "SUNPHARMA.NS": "Pharma",
  "DRREDDY.NS": "Pharma",
  "CIPLA.NS": "Pharma",
  "DIVISLAB.NS": "Pharma",
  "APOLLOHOSP.NS": "Pharma",
  "HINDUNILVR.NS": "FMCG",
  "ITC.NS": "FMCG",
  "NESTLEIND.NS": "FMCG",
  "BRITANNIA.NS": "FMCG",
  "TATACONSUM.NS": "FMCG",
  "TATASTEEL.NS": "Metals",
  "JSWSTEEL.NS": "Metals",
  "HINDALCO.NS": "Metals",
  "VEDL.NS": "Metals",
  "BHARTIARTL.NS": "Telecom",
  "IDEA.NS": "Telecom",
  "LT.NS": "Infra",
  "ULTRACEMCO.NS": "Infra",
  "GRASIM.NS": "Infra",
  "TITAN.NS": "Consumer",
  "ASIANPAINT.NS": "Consumer",
};

/**
 * @param {string} ticker
 * @returns {string}
 */
export function getSector(ticker) {
  return SECTOR_MAP[ticker] || "Other";
}

/**
 * Aggregate bullish-trend density per sector from scanner rows.
 * @param {StockRow[]} rows
 * @returns {Array<{sector: string, total: number, bullish: number, bullishPct: number}>}
 *   Sorted descending by bullishPct.
 */
export function buildSectorHeatmap(rows) {
  /** @type {Record<string, {sector: string, total: number, bullish: number}>} */
  const buckets = {};

  for (const row of rows) {
    const sector = getSector(row.ticker);
    if (!buckets[sector]) buckets[sector] = { sector, total: 0, bullish: 0 };
    buckets[sector].total += 1;
    if (row.trend_rule_pass) buckets[sector].bullish += 1;
  }

  return Object.values(buckets)
    .map((b) => ({ ...b, bullishPct: b.total > 0 ? (b.bullish / b.total) * 100 : 0 }))
    .sort((a, b) => b.bullishPct - a.bullishPct);
}