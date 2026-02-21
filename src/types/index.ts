export type TransactionType = 'INCOME' | 'EXPENSE';

export interface ExerciseType {
  id: string;
  name: string;
  met: number;
  icon: string;
  isCustom?: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height: number; // in cm
  weight: number; // in kg
  goalWeight: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  weightChangeSpeed?: 'SLOW' | 'STEADY' | 'FAST';
  dailyCalorieGoal: number;
  waterGoal?: number; // Optional, can be calculated
  waterContainers?: {
    small: number;
    medium: number;
    large: number;
  };
  favoriteExerciseIds?: string[];
  customExercises?: ExerciseType[];
  stepGoal?: number;
}

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  date: string; // ISO date
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string; // ISO date
}
export interface WaterLog {
  id: string;
  amount: number; // in ml
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: string; // Full timestamp for specific entry time
}
export interface ExerciseLog {
  id: string;
  name: string;
  caloriesBurned: number;
  durationMinutes: number;
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: string;
}
