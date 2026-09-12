/**
 * CSV, by hand, on purpose (docs/14 §3).
 *
 * The constraint in the document is not "a file format" — it is *diffable by eye, by grep and by
 * pandas*: one record per line, no nesting, and the same column order every night, so
 * `diff yesterday/mastery.csv today/mastery.csv` is a readable answer to "what changed". A
 * dependency would not do that better, and this is 30 lines.
 */

export type CsvValue = string | number | boolean | Date | null | undefined;

/** RFC 4180 quoting: only when needed, so the common case stays readable. */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(round2(value)) : "";
  const text = value.replace(/\r?\n/g, " ").trim();
  return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function csvRow(cells: readonly CsvValue[]): string {
  return cells.map(csvCell).join(",");
}

/** A whole file: the header, then one line per record, newline-terminated. */
export function csvFile(header: readonly string[], rows: readonly CsvValue[][]): string {
  return [csvRow(header), ...rows.map(csvRow)].join("\n").concat("\n");
}

/** Median, for "how long this exercise usually takes" — a mean is wrecked by one abandoned tab. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

export function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 1000;
}
