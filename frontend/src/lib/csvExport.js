/** @typedef {import('./types').StockRow} StockRow */

/**
 * Escape a single CSV cell value per RFC 4180: wrap in quotes and double up
 * any internal quotes if the value contains a comma, quote, or newline.
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of flat objects into a CSV string. Column order follows
 * the keys of the first row; rows with missing keys render as empty cells.
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string}
 */
export function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Build a CSV from `rows` and trigger an immediate browser download.
 * Returns false (and downloads nothing) if there's no data to export.
 * @param {StockRow[]} rows
 * @param {string} [filename]
 * @returns {boolean}
 */
export function exportToCsv(rows, filename = "Nifty_Quant_Report.csv") {
  const csv = rowsToCsv(rows);
  if (!csv) return false;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke on next tick so the download has time to start in all browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);

  return true;
}