import { readTab, appendRow, updateRange, TABS } from "@/lib/sheets";

/** e.g. 5 May 2026 -> "FY-26-27" (Indian FY: Apr 1 - Mar 31) */
export function computeFyPrefix(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, so April = 3
  const fyStartYear = month >= 3 ? year : year - 1;
  const shortStart = String(fyStartYear).slice(-2);
  const shortEnd = String(fyStartYear + 1).slice(-2);
  return `FY-${shortStart}-${shortEnd}`;
}

/**
 * Reads the Counter tab, increments the row matching this FY prefix
 * (creating it if this is the first invoice of the financial year),
 * and returns the fully formatted serial number.
 *
 * Note: Sheets has no row locking, so this read-then-write is not fully
 * atomic. Acceptable for a single/low-concurrency internal admin tool —
 * flagged in the PRD as a known, low-risk tradeoff.
 */
export async function getNextSerialNumber(invoiceDate: Date): Promise<string> {
  const fyPrefix = computeFyPrefix(invoiceDate);
  const rows = await readTab(TABS.counter); // [fy_prefix, last_serial][]

  const rowIndex = rows.findIndex((r) => r[0] === fyPrefix);
  let nextSerial: number;

  if (rowIndex === -1) {
    nextSerial = 1;
    await appendRow(TABS.counter, [fyPrefix, nextSerial]);
  } else {
    const lastSerial = Number(rows[rowIndex][1] || 0);
    nextSerial = lastSerial + 1;
    // +2 because readTab starts at row 2 (row 1 is the header)
    const sheetRow = rowIndex + 2;
    await updateRange(`${TABS.counter}!A${sheetRow}:B${sheetRow}`, [fyPrefix, nextSerial]);
  }

  return `${fyPrefix}-${String(nextSerial).padStart(6, "0")}`;
}
