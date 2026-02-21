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
