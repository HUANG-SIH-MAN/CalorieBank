# Food Text AI & Saved Meals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Gemini text-based meal estimation in `FoodScanModal`, persistent saved-meal templates with CRUD and one-tap logging, and copy-from-history with optional “save as saved meal,” including Web backup/restore for `savedMeals`.

**Architecture:** Extend `FoodAnalysisResult` consumers with a new `analyzeFoodText` in `geminiService`. Introduce `SavedMeal` type and SQLite table + AsyncStorage parity, wired through `AppContext`. UI changes in `FoodScanModal`, `LogScreen`, and `SettingsScreen` (or a small `SavedMealsModal` component). Web `WebBackupData` gains `savedMeals`; native backup uses the DB file after migration.

**Tech Stack:** Expo / React Native, TypeScript, `@google/genai`, `expo-sqlite`, `@react-native-async-storage/async-storage`, existing `googleDriveService` web backup.

---

### Task 1: Types and constants

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/constants/savedMeals.ts` (or `foodText.ts`) — e.g. `MIN_FOOD_TEXT_DESCRIPTION_LENGTH`, export for Gemini + UI validation

**Steps:**
1. Add `export interface SavedMeal { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; createdAt?: string }`.
2. Add named constant(s) for minimum text length (e.g. `10` as `MIN_FOOD_TEXT_DESCRIPTION_LENGTH` — single source of truth).
3. Run: `npx tsc --noEmit`  
   **Expected:** Pass (no new errors).

4. Commit: `git add src/types/index.ts src/constants/savedMeals.ts`  
   `git commit -m "feat: add SavedMeal type and food text length constant"`

---

### Task 2: `analyzeFoodText` in geminiService

**Files:**
- Modify: `src/services/geminiService.ts`

**Steps:**
1. Add `analyzeFoodText(description: string, apiKey: string, modelName: string): Promise<FoodAnalysisResult>`:
   - Reuse API key sanitization and error handling patterns from `analyzeFoodImage`.
   - `generateContent` with **text-only** user message; `responseMimeType: "application/json"` (same as image path).
   - Prompt: nutritionist role, conservative estimates, align rules with image prompt (main vs side dish, user description is the only signal).
   - Reject empty/whitespace; if length `< MIN_FOOD_TEXT_DESCRIPTION_LENGTH`, throw a clear `Error` message in Traditional Chinese consistent with the app.
2. Parse JSON and round macros like `analyzeFoodImage` (reuse or extract shared `roundToOneDecimal` if DRY without large refactor).
3. Run: `npx tsc --noEmit`  
   **Expected:** Pass.

4. Commit: `git commit -m "feat: add Gemini text-based food analysis"`

---

### Task 3: SQLite `saved_meals` and dbService CRUD

**Files:**
- Modify: `src/services/dbService.ts`

**Steps:**
1. In `initDatabase` `execAsync`, add `CREATE TABLE IF NOT EXISTS saved_meals (...)` with columns matching `SavedMeal` (map `createdAt` to TEXT nullable).
2. Export: `saveSavedMeal`, `deleteSavedMealFromDb`, `getAllSavedMeals` (ORDER BY `createdAt` DESC or `rowid` DESC — pick one documented choice).
3. Update `clearAllData` to `DELETE FROM saved_meals`.
4. Run: `npx tsc --noEmit`

5. Commit: `git commit -m "feat: add saved_meals table and SQLite CRUD"`

---

### Task 4: AppContext — state, AsyncStorage, reset, restore

**Files:**
- Modify: `src/context/AppContext.tsx`
- Modify: `src/services/googleDriveService.ts` (`WebBackupData`)

**Steps:**
1. Extend `WebBackupData` with optional `savedMeals?: unknown[]` (or typed `SavedMeal[]`).
2. Add `STORAGE_KEYS.SAVED_MEALS = '@saved_meals'`.
3. Context: `savedMeals: SavedMeal[]`, `addSavedMeal`, `updateSavedMeal`, `deleteSavedMeal` (mirror food log patterns: new id via `Date.now().toString()`).
4. `loadData`: `Promise.all` includes `getAllSavedMeals`; `setSavedMeals`.
5. `loadDataFromAsyncStorage`: read `SAVED_MEALS` JSON.
6. `resetAppData`: clear saved meals state + AsyncStorage key + SQLite delete (via `clearAllData` already extended).
7. `applyRestoredData`: parse `data.savedMeals`, set state, `AsyncStorage.setItem` for web.
8. Export new methods on context value and update `useMemo` deps.

**Note:** `applyRestoredData` currently early-returns when `dbRef.current` is set — keep that behavior; document that web restore path carries `savedMeals`.

9. Run: `npx tsc --noEmit`

10. Commit: `git commit -m "feat: wire SavedMeal state and web backup field"`

---

### Task 5: Settings backup/restore payload (web)

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

**Steps:**
1. In `handleBackup` for `Platform.OS === 'web'`, pass `savedMeals` from context into `backupToDriveWeb` payload.
2. Confirm `restoreFromDriveWeb` + `applyRestoredData` persists `savedMeals` to AsyncStorage (Task 4).

3. Run: `npx tsc --noEmit`

4. Commit: `git commit -m "fix: include saved meals in web Google Drive backup"`

---

### Task 6: FoodScanModal — text path

**Files:**
- Modify: `src/components/FoodScanModal.tsx`

**Steps:**
1. Extend `Stage` with a text-input stage (e.g. `'text'` or `'text_input'`) or use `idle` + `inputMode: 'camera' | 'text'`.
2. UI: Button “文字描述” alongside camera flow; multiline `TextInput`; “分析” calls `analyzeFoodText` with SecureStore key and `userProfile.geminiModel`.
3. On success: populate `result` / `edit*` fields and `setStage('result')` — **reuse** existing result UI (portion, tags, confirm).
4. On API missing key: open existing `GeminiConfigModal` like photo path.
5. Validate length with shared constant before calling API.

6. Run: `npx tsc --noEmit`

7. Commit: `git commit -m "feat: add text-based food analysis to FoodScanModal"`

---

### Task 7: Saved meals UI (modal or screen) + Settings entry

**Files:**
- Create: `src/components/SavedMealsModal.tsx` (or similar)
- Modify: `src/screens/SettingsScreen.tsx` and/or `src/screens/LogScreen.tsx`

**Steps:**
1. Modal lists `savedMeals`; each row: name, kcal summary, actions **加入今日** (uses parent-supplied `targetDate` or today), **編輯**, **刪除**.
2. Add flow: form fields for name + nutrition (same rounding as manual entry).
3. “加入今日” calls `addFoodLog` with `mealType: getMealTypeByTime()` from `src/utils/time`.
4. Wire visibility state from Settings (button “常用餐 / 我的套餐”) and optionally a second entry on `LogScreen` diet tab header.

5. Run: `npx tsc --noEmit`

6. Commit: `git commit -m "feat: add saved meals list and apply to log"`

---

### Task 8: LogScreen — copy log + optional save as saved meal

**Files:**
- Modify: `src/screens/LogScreen.tsx`

**Steps:**
1. Add a control per row (e.g. `ellipsis-horizontal` button) opening `Alert.alert` with buttons or a small inline modal:
   - **複製到…** — default target `selectedDate`; allow choosing another date via existing `DatePickerModal` pattern or a second date state for “copy target”.
   - Implement: `addFoodLog({ ...log fields except id, date: targetDate, mealType: log.mealType })` with **new** `id` via `addFoodLog` (already generates id).
2. **加入常用餐** — prompt for display name (default `log.name`); `addSavedMeal({ name, calories, protein, carbs, fat, createdAt })`.
3. Optional combined flow: after copy, ask “是否加入常用餐？” — only if product-wise desired; design doc allows optional checkbox-style flow via sequential alerts (keep MVP simple).

4. Run: `npx tsc --noEmit`

5. Commit: `git commit -m "feat: copy food log to date and save as saved meal"`

---

### Task 9: Manual QA and polish

**Steps:**
1. **Web:** Backup → clear local storage (devtools) → restore → `savedMeals` present.
2. **Native:** Fresh install path creates `saved_meals` table; add template → restart app → persists.
3. Text AI: short string → validation error; reasonable description → result screen → confirm log.
4. Copy: duplicate to another day → two distinct ids in DB.

5. Final commit if any copy/string fixes: `git commit -m "fix: adjust saved meal and copy UX copy"`

---

## Verification commands

| Command | Expect |
|---------|--------|
| `npx tsc --noEmit` | Exit code 0 |

(Project has no `npm test` script; rely on `tsc` + manual QA above.)

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-03-21-food-text-and-saved-meals.md`. Two execution options:

1. **Subagent-Driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration  
2. **Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints  

Which approach?
