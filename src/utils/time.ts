/**
 * Get the recommended meal type based on the current time of day.
 * 
 * Rules:
 * - 05:00 ~ 10:30 -> BREAKFAST
 * - 10:30 ~ 14:00 -> LUNCH
 * - 17:00 ~ 20:00 -> DINNER
 * - All other times -> SNACK
 */
export const getMealTypeByTime = (): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 05:00 = 300 mins
  // 10:30 = 630 mins
  // 14:00 = 840 mins
  // 17:00 = 1020 mins
  // 20:00 = 1200 mins

  if (timeInMinutes >= 300 && timeInMinutes < 630) {
    return 'BREAKFAST';
  } else if (timeInMinutes >= 630 && timeInMinutes < 840) {
    return 'LUNCH';
  } else if (timeInMinutes >= 1020 && timeInMinutes < 1200) {
    return 'DINNER';
  } else {
    return 'SNACK';
  }
};

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: '早餐',
  LUNCH: '午餐',
  DINNER: '晚餐',
  SNACK: '點心',
};

export const MEAL_TYPE_ICONS: Record<string, string> = {
  BREAKFAST: '🍳',
  LUNCH: '🍱',
  DINNER: '🍛',
  SNACK: '🍦',
};
