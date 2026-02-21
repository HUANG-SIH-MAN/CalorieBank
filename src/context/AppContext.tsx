import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, FoodLog, WeightLog, WaterLog, ExerciseLog } from '../types';

interface AppContextType {
  userProfile: UserProfile | null;
  foodLogs: FoodLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  exerciseLogs: ExerciseLog[];
  setUserProfile: (profile: UserProfile) => void;
  addFoodLog: (log: Omit<FoodLog, 'id'>) => void;
  deleteFoodLog: (id: string) => void;
  addWeightLog: (log: Omit<WeightLog, 'id'>) => void;
  deleteWeightLog: (id: string) => void;
  addWaterLog: (amount: number, date: string) => void;
  deleteWaterLog: (id: string) => void;
  addExerciseLog: (log: Omit<ExerciseLog, 'id'>) => void;
  deleteExerciseLog: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  FOOD_LOGS: '@food_logs',
  WEIGHT_LOGS: '@weight_logs',
  WATER_LOGS: '@water_logs',
  EXERCISE_LOGS: '@exercise_logs',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setProfileState] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileStr, foodStr, weightStr, waterStr, exerciseStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.FOOD_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LOGS),
      ]);

      if (profileStr) setProfileState(JSON.parse(profileStr));
      if (foodStr) setFoodLogs(JSON.parse(foodStr));
      if (weightStr) setWeightLogs(JSON.parse(weightStr));
      if (waterStr) setWaterLogs(JSON.parse(waterStr));
      if (exerciseStr) setExerciseLogs(JSON.parse(exerciseStr));
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserProfile = async (profile: UserProfile) => {
    setProfileState(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  };

  const addFoodLog = async (log: Omit<FoodLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...foodLogs];
    setFoodLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
  };

  const deleteFoodLog = async (id: string) => {
    const updated = foodLogs.filter(l => l.id !== id);
    setFoodLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
  };

  const addWeightLog = async (log: Omit<WeightLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...weightLogs];
    setWeightLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(updated));
  };

  const deleteWeightLog = async (id: string) => {
    const updated = weightLogs.filter(l => l.id !== id);
    setWeightLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(updated));
  };

  const addWaterLog = async (amount: number, date: string) => {
    const newLog = {
      id: Date.now().toString(),
      amount,
      date,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...waterLogs];
    setWaterLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(updated));
  };

  const deleteWaterLog = async (id: string) => {
    const updated = waterLogs.filter(l => l.id !== id);
    setWaterLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(updated));
  };

  const addExerciseLog = async (log: Omit<ExerciseLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...exerciseLogs];
    setExerciseLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updated));
  };

  const deleteExerciseLog = async (id: string) => {
    const updated = exerciseLogs.filter(l => l.id !== id);
    setExerciseLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updated));
  };

  const value = useMemo(() => ({
    userProfile,
    foodLogs,
    weightLogs,
    waterLogs,
    exerciseLogs,
    setUserProfile,
    addFoodLog,
    deleteFoodLog,
    addWeightLog,
    deleteWeightLog,
    addWaterLog,
    deleteWaterLog,
    addExerciseLog,
    deleteExerciseLog,
    isLoading,
  }), [userProfile, foodLogs, weightLogs, waterLogs, exerciseLogs, isLoading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
