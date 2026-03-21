/**
 * Calendar dates (YYYY-MM-DD) in the device local timezone.
 * Avoid `Date#toISOString().split('T')[0]` — it uses UTC and can show the wrong calendar day before 08:00 in UTC+8.
 */

const DATE_PART_PAD_LENGTH = 2;
const DATE_PART_PAD_CHAR = '0';

function padDatePart(n: number): string {
  return String(n).padStart(DATE_PART_PAD_LENGTH, DATE_PART_PAD_CHAR);
}

/** Format a local `Date` as YYYY-MM-DD (local calendar). */
export function formatDateOnlyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = padDatePart(date.getMonth() + 1);
  const d = padDatePart(date.getDate());
  return `${y}-${m}-${d}`;
}

/** Today's date string in the local timezone. */
export function getTodayDateStringLocal(): string {
  return formatDateOnlyLocal(new Date());
}

/** Parse YYYY-MM-DD as local calendar date (no UTC midnight shift). */
export function parseDateOnlyLocal(dateOnly: string): Date {
  const parts = dateOnly.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (parts.length !== 3 || year == null || month == null || day == null) {
    return new Date(NaN);
  }
  return new Date(year, month - 1, day);
}

/** Add calendar days to a YYYY-MM-DD string; returns YYYY-MM-DD in local timezone. */
export function addCalendarDays(dateOnly: string, deltaDays: number): string {
  const d = parseDateOnlyLocal(dateOnly);
  if (Number.isNaN(d.getTime())) {
    return dateOnly;
  }
  d.setDate(d.getDate() + deltaDays);
  return formatDateOnlyLocal(d);
}
