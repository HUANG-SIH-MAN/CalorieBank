import type { WeightLog } from '../types';

/** Cascade order for main analytics card (longest window first). */
export const WEIGHT_CHANGE_WINDOW_DAYS = [30, 7, 3] as const;

export const LABEL_WEIGHT_CHANGE_FALLBACK = '30 天內體重變化';

const WINDOW_DAY_TO_LABEL: Record<(typeof WEIGHT_CHANGE_WINDOW_DAYS)[number], string> = {
  30: '30 天內體重變化',
  7: '7 天內體重變化',
  3: '3 天內體重變化',
};

function formatSignedKgOneDecimal(deltaKg: number): string {
  const text = deltaKg.toFixed(1);
  if (deltaKg >= 0) {
    return `+${text}`;
  }
  return text;
}

function getWeightDeltaKgInWindow(
  logs: WeightLog[],
  allowedDates: readonly string[]
): number | null {
  const allowed = new Set(allowedDates);
  const inWindow = logs.filter(l => allowed.has(l.date));
  const sorted = [...inWindow].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) {
      return byDate;
    }
    return a.id.localeCompare(b.id);
  });
  if (sorted.length < 2) {
    return null;
  }
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return last.weight - first.weight;
}

/**
 * First window in 30→7→3 with at least two weight logs wins; otherwise label fallback + null value.
 */
export function resolveWeightChangeDisplay(
  weightLogs: WeightLog[],
  generateDateData: (days: number) => string[]
): { label: string; valueKg: string | null } {
  for (const windowDays of WEIGHT_CHANGE_WINDOW_DAYS) {
    const dates = generateDateData(windowDays);
    const deltaKg = getWeightDeltaKgInWindow(weightLogs, dates);
    if (deltaKg != null) {
      return {
        label: WINDOW_DAY_TO_LABEL[windowDays],
        valueKg: formatSignedKgOneDecimal(deltaKg),
      };
    }
  }
  return { label: LABEL_WEIGHT_CHANGE_FALLBACK, valueKg: null };
}
