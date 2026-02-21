import { ACTIVITY_LEVELS, WEIGHT_SPEEDS } from '../constants/fitness';

interface CalcParams {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weight: number;
  height: number;
  age: number;
  activityLevel: string;
  goalWeight: number;
  speedId?: string; // e.g. 'STEADY'
}

export const calculateDailyCalorieGoal = ({
  gender,
  weight,
  height,
  age,
  activityLevel,
  goalWeight,
  speedId = 'STEADY'
}: CalcParams): number => {
  const act = ACTIVITY_LEVELS.find(l => l.id === activityLevel)?.factor || 1.2;
  const spdOffset = WEIGHT_SPEEDS.find(s => s.id === speedId)?.offset || 500;

  // Mifflin-St Jeor Equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === 'MALE') {
    bmr += 5;
  } else {
    // Treat OTHER as FEMALE for conservative calculation or similar
    bmr -= 161;
  }

  const tdee = bmr * act;

  let goal;
  if (goalWeight < weight) {
    goal = tdee - spdOffset;
  } else if (goalWeight > weight) {
    goal = tdee + spdOffset;
  } else {
    goal = tdee;
  }

  return Math.round(goal);
};

export interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
}

export const calculateMacroGoals = (totalCalories: number, weight: number, goalWeight: number): MacroGoals => {
  let pRatio, cRatio, fRatio;
  
  if (goalWeight > weight + 0.5) {
    // Bulking / 增肌
    pRatio = 0.25; cRatio = 0.50; fRatio = 0.25;
  } else if (goalWeight < weight - 0.5) {
    // Cutting / 減脂
    pRatio = 0.30; cRatio = 0.40; fRatio = 0.30;
  } else {
    // Maintaining / 一般維持
    pRatio = 0.15; cRatio = 0.55; fRatio = 0.30;
  }

  return {
    protein: Math.round((totalCalories * pRatio) / 4),
    carbs: Math.round((totalCalories * cRatio) / 4),
    fat: Math.round((totalCalories * fRatio) / 9),
  };
};
