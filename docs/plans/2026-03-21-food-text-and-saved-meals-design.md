# Food Text AI & Saved Meals — Design

**Status:** Approved (2026-03-21)

## Summary

Add two user-facing capabilities:

1. **Text-based AI estimation** — In the same flow as photo analysis (`FoodScanModal`), the user can describe a meal in text; Gemini returns the same `FoodAnalysisResult` shape, then the existing result/edit/confirm path applies.
2. **Saved meals (“常用餐 / 我的套餐”)** — Persistent templates (`name`, calories, macros) independent of daily logs. One-tap add to a selected date with meal type derived like new food entries (`getMealTypeByTime()`).
3. **Copy from history** — From the diet log list, copy a past entry to today or another date (new `FoodLog` id). Optionally **also save as a saved meal** in the same flow.

## Data Model

- **`SavedMeal`** (`src/types/index.ts`): `id`, `name`, `calories`, `protein`, `carbs`, `fat`, optional `createdAt` (ISO string).
- No required link to `FoodLog`; “加入常用餐” from a log **copies** values into a new `SavedMeal`.

## Persistence

- **SQLite** (`dbService.ts`): New `saved_meals` table; CRUD mirroring other entities. Extend `clearAllData` to delete from `saved_meals`.
- **Web / AsyncStorage**: New key (e.g. `@saved_meals`) and load/save in `AppContext` when `dbRef` is null.
- **Web Google Drive JSON backup** (`WebBackupData`): Add `savedMeals: SavedMeal[]`; extend `SettingsScreen` backup payload and `applyRestoredData`.
- **Native Google Drive backup**: Full DB file upload — schema change is included once the user backs up after migration.

## Gemini

- New **`analyzeFoodText(description, apiKey, modelName)`** in `geminiService.ts`, JSON output aligned with photo analysis; prompt rules consistent (conservative estimates, main vs side dish, no 0 kcal except non-food).
- Minimum description length enforced via a named constant (no scattered magic numbers).

## UI / UX

- **`FoodScanModal`**: Idle state offers photo vs text; text path → analyze → shared `result` stage; errors match existing Gemini handling.
- **`LogScreen`**: Per food row, actions for **copy to date** (default selected date or picker) and optional **save as saved meal** (name prompt).
- **Saved meals**: Entry from Settings and/or Log (e.g. “常用餐” opens list modal: list, add, edit, delete, apply to current `selectedDate`).

## Out of Scope (YAGNI)

- Unified “food library” entity merging history and templates.
- Rich Bottom Sheet / dedicated full-screen copy flow (can be incremental later).
