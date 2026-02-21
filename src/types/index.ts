export type TransactionType = 'INCOME' | 'EXPENSE';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height: number; // in cm
  weight: number; // in kg
  goalWeight: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dailyCalorieGoal: number;
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
