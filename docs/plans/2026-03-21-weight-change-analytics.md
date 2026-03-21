# Weight change analytics (30→7→3 fallback) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Analysis screen main-stat "projected weight gain/loss from calories" with actual weight change from `WeightLog`, using a 30→7→3 day cascade; show "—" when insufficient data. No global "last two logs" fallback.

**Architecture:** Compute weight delta inside `AnalysisScreen.tsx`’s existing `stats` `useMemo`: for each window length in order `[30, 7, 3]`, filter logs by `generateDateData(days)` date set, sort by `date` then `id`, require ≥2 logs, then `delta = last.weight - first.weight`. Expose `label` (Traditional Chinese per design doc), `value` string with sign + one decimal, or null for "—". Remove `KCAL_PER_KG_WEIGHT_LOSS` and the old deficit projection block. Optionally extract a small pure helper in `src/utils/` with named constants for window lengths (no magic numbers) if it keeps `AnalysisScreen` readable.

**Tech Stack:** React Native (Expo), TypeScript, existing `AppContext` `weightLogs`.

---

### Task 1: Pure helper for windowed weight delta (optional but recommended)

**Files:**
- Create: `src/utils/weightChangeInWindow.ts` (or similar single-purpose name)
- Modify: `src/screens/AnalysisScreen.tsx` (import helper)

**Step 1:** Implement `getWeightChangeKg(weightLogs: WeightLog[], windowDays: number, allowedDates: string[]): { delta: number } | null`:
- Filter logs where `log.date` is in `allowedDates` (caller passes `generateDateData(windowDays)`).
- Sort by `date` ascending, then `id` ascending.
- If length &lt; 2, return `null`.
- Return `{ delta: last.weight - first.weight }`.

**Step 2:** Export ordered fallback: `WEIGHT_CHANGE_WINDOW_DAYS = [30, 7, 3] as const` and a function `resolveWeightChangeDisplay(weightLogs, generateDateDataFn)` returning `{ labelKey: '30d'|'7d'|'3d'|'insufficient', deltaKg: number | null }` with label strings colocated or in `AnalysisScreen` for i18n.

**Step 3:** If the project has no unit test runner, skip automated tests; rely on Task 4 manual checks.

**Step 4:** Commit

```bash
git add src/utils/weightChangeInWindow.ts
git commit -m "feat(analytics): add weight change helper for sliding windows"
```

*(If you inline everything in `AnalysisScreen` without a new file, fold this task into Task 2 and omit the commit above.)*

---

### Task 2: Replace projection stats in `AnalysisScreen`

**Files:**
- Modify: `src/screens/AnalysisScreen.tsx` (stats `useMemo`, main card JSX)

**Step 1:** Remove: `avgDailyDeficit`, `projectedKgRaw`, `isWeightGain`, `projectedWeightLabel`, `projectedWeightValue`, and the `dates30` loop that only served projection (lines ~227–256 region). Remove unused `KCAL_PER_KG_WEIGHT_LOSS` import/constant if nothing else references it.

**Step 2:** Add new computed fields, e.g. `weightChangeLabel`, `weightChangeValue` (string with `+`/`-` and `toFixed(1)` or null), using cascade 30→7→3 and labels:
- 30d: `30 天內體重變化`
- 7d: `7 天內體重變化`
- 3d: `3 天內體重變化`
- insufficient: label `30 天內體重變化`, value null → render `—`

**Step 3:** Update JSX: replace `stats.projectedWeightLabel` / `stats.projectedWeightValue` with the new fields; default fallback text must not say `預計減重 (30天)`.

**Step 4:** Run TypeScript check (if configured):

```bash
npx tsc --noEmit
```

Expected: no errors in `AnalysisScreen.tsx`.

**Step 5:** Commit

```bash
git add src/screens/AnalysisScreen.tsx src/utils/weightChangeInWindow.ts
git commit -m "feat(analytics): show actual weight change with 30-7-3 day fallback"
```

---

### Task 3: Manual verification

**Step 1:** In app, open 數據分析 with 0–1 weight logs in 30 days → main stat shows `—` and label `30 天內體重變化`.

**Step 2:** Add two weight logs 3 days apart within last 3 days → should show `3 天內體重變化` and signed delta.

**Step 3:** With enough logs spanning 30 days → `30 天內體重變化` and delta = last−first in window.

**Step 4:** Commit only if documentation updates are needed; otherwise no extra commit.

---

## Reference

- Design: `docs/plans/2026-03-21-weight-change-analytics-design.md`
