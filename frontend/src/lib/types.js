/**
 * Shared type documentation for the stock-scanner row shape returned by
 * GET /api/screener. Plain JS + JSDoc (no TypeScript build step required).
 *
 * If your backend uses different field names, update this file first —
 * every other module references this shape via:
 *   /** @typedef {import('./types').StockRow} StockRow *\/
 *
 * @typedef {Object} StockRow
 * @property {string} ticker - e.g. "RELIANCE.NS"
 * @property {number|null} price - latest close
 * @property {number|null} ema50
 * @property {number|null} ema200
 * @property {number|null} rsi - 0-100. Assumed field name; adjust if backend differs.
 * @property {boolean} [volume_spike] - assumed field name; adjust if backend differs.
 * @property {boolean} trend_rule_pass
 * @property {boolean} [growth_rule_pass]
 * @property {boolean} shortlisted
 * @property {boolean} [data_sufficient]
 */

export {};