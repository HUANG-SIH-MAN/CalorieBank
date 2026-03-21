import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { UserProfile, FoodLog, WeightLog, WaterLog, ExerciseLog, SavedMeal } from '../types';
import type { WebBackupData } from '../services/googleDriveService';
import * as dbService from '../services/dbService';

interface AppContextType {
  userProfile: UserProfile | null;
  foodLogs: FoodLog[];
  savedMeals: SavedMeal[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  exerciseLogs: ExerciseLog[];
  setUserProfile: (profile: UserProfile) => void;
  addFoodLog: (log: Omit<FoodLog, 'id'>) => void;
  updateFoodLog: (id: string, updates: Partial<Omit<FoodLog, 'id'>>) => void;
  deleteFoodLog: (id: string) => void;
  addSavedMeal: (meal: Omit<SavedMeal, 'id'>) => void;
  updateSavedMeal: (id: string, updates: Partial<Omit<SavedMeal, 'id'>>) => void;
  deleteSavedMeal: (id: string) => void;
  addWeightLog: (log: Omit<WeightLog, 'id'>) => void;
  deleteWeightLog: (id: string) => void;
  addWaterLog: (amount: number, date: string) => void;
  deleteWaterLog: (id: string) => void;
  addExerciseLog: (log: Omit<ExerciseLog, 'id'>) => void;
  deleteExerciseLog: (id: string) => void;
  resetAppData: () => Promise<void>;
  reloadFromDatabase: () => Promise<void>;
  applyRestoredData: (data: WebBackupData) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  FOOD_LOGS: '@food_logs',
  WEIGHT_LOGS: '@weight_logs',
  WATER_LOGS: '@water_logs',
  EXERCISE_LOGS: '@exercise_logs',
  SAVED_MEALS: '@saved_meals',
  MIGRATION_COMPLETED: '@db_migration_completed_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setProfileState] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const db = await dbService.initDatabase();
      dbRef.current = db;

      if (db) {
        // Check for migration
        const migrationDone = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
        if (!migrationDone) {
          await migrateFromAsyncStorage(db);
        }

        await loadData(db);
      } else {
        // Fallback for web (AsyncStorage only)
        await loadDataFromAsyncStorage();
      }
    } catch (error) {
      console.error('Failed to initialize app', error);
      setIsLoading(false);
    }
  };

  const migrateFromAsyncStorage = async (db: SQLite.SQLiteDatabase) => {
    try {
      console.log('Starting data migration to SQLite...');
      const profileStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        await dbService.saveUserProfile(db, profile);

        // Migrate logs
        const foodStr = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_LOGS);
        if (foodStr) {
          const logs = JSON.parse(foodStr) as FoodLog[];
          for (const log of logs) await dbService.saveFoodLog(db, log);
        }

        const weightStr = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
        if (weightStr) {
          const logs = JSON.parse(weightStr) as WeightLog[];
          for (const log of logs) await dbService.saveWeightLog(db, log);
        }

        const waterStr = await AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS);
        if (waterStr) {
          const logs = JSON.parse(waterStr) as WaterLog[];
          for (const log of logs) await dbService.saveWaterLog(db, log);
        }

        const exerciseStr = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LOGS);
        if (exerciseStr) {
          const logs = JSON.parse(exerciseStr) as ExerciseLog[];
          for (const log of logs) await dbService.saveExerciseLog(db, log);
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
      console.log('Migration completed successfully.');
    } catch (e) {
      console.error('Migration failed', e);
    }
  };

  const loadData = async (db: SQLite.SQLiteDatabase) => {
    try {
      const [profile, foods, meals, weights, waters, exercises] = await Promise.all([
        dbService.getUserProfile(db),
        dbService.getAllFoodLogs(db),
        dbService.getAllSavedMeals(db),
        dbService.getAllWeightLogs(db),
        dbService.getAllWaterLogs(db),
        dbService.getAllExerciseLogs(db),
      ]);

      setProfileState(profile);
      setFoodLogs(foods);
      setSavedMeals(meals);
      setWeightLogs(weights);
      setWaterLogs(waters);
      setExerciseLogs(exercises);
    } catch (error) {
      console.error('Failed to load DB data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromAsyncStorage = async () => {
    try {
      const [profileStr, foodStr, savedStr, weightStr, waterStr, exerciseStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.FOOD_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS),
        AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.WATER_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LOGS),
      ]);

      if (profileStr) setProfileState(JSON.parse(profileStr));
      if (foodStr) setFoodLogs(JSON.parse(foodStr));
      if (savedStr) setSavedMeals(JSON.parse(savedStr));
      if (weightStr) setWeightLogs(JSON.parse(weightStr));
      if (waterStr) setWaterLogs(JSON.parse(waterStr));
      if (exerciseStr) setExerciseLogs(JSON.parse(exerciseStr));
    } catch (error) {
      console.error('Failed to load async data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserProfile = async (profile: UserProfile) => {
    setProfileState(profile);
    if (dbRef.current) {
      await dbService.saveUserProfile(dbRef.current, profile);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }
  };

  const addFoodLog = async (log: Omit<FoodLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...foodLogs];
    setFoodLogs(updated);
    if (dbRef.current) {
      await dbService.saveFoodLog(dbRef.current, newLog);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
    }
  };

  const updateFoodLog = async (id: string, updates: Partial<Omit<FoodLog, 'id'>>) => {
    const existing = foodLogs.find(l => l.id === id);
    if (!existing) return;
    const updatedLog: FoodLog = { ...existing, ...updates };
    const updated = foodLogs.map(l => (l.id === id ? updatedLog : l));
    setFoodLogs(updated);
    if (dbRef.current) {
      await dbService.saveFoodLog(dbRef.current, updatedLog);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
    }
  };

  const deleteFoodLog = async (id: string) => {
    const updated = foodLogs.filter(l => l.id !== id);
    setFoodLogs(updated);
    if (dbRef.current) {
      await dbService.deleteFoodLogFromDb(dbRef.current, id);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
    }
  };

  const addSavedMeal = async (meal: Omit<SavedMeal, 'id'>) => {
    const newMeal: SavedMeal = {
      ...meal,
      id: Date.now().toString(),
      createdAt: meal.createdAt ?? new Date().toISOString(),
    };
    const updated = [newMeal, ...savedMeals];
    setSavedMeals(updated);
    if (dbRef.current) {
      await dbService.saveSavedMeal(dbRef.current, newMeal);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(updated));
    }
  };

  const updateSavedMeal = async (id: string, updates: Partial<Omit<SavedMeal, 'id'>>) => {
    const existing = savedMeals.find(m => m.id === id);
    if (!existing) return;
    const updatedMeal: SavedMeal = { ...existing, ...updates };
    const updated = savedMeals.map(m => (m.id === id ? updatedMeal : m));
    setSavedMeals(updated);
    if (dbRef.current) {
      await dbService.saveSavedMeal(dbRef.current, updatedMeal);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(updated));
    }
  };

  const deleteSavedMeal = async (id: string) => {
    const updated = savedMeals.filter(m => m.id !== id);
    setSavedMeals(updated);
    if (dbRef.current) {
      await dbService.deleteSavedMealFromDb(dbRef.current, id);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(updated));
    }
  };

  const addWeightLog = async (log: Omit<WeightLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...weightLogs];
    setWeightLogs(updated);
    if (dbRef.current) {
      await dbService.saveWeightLog(dbRef.current, newLog);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(updated));
    }
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        weight: newLog.weight,
        ...(newLog.bodyFatPercent != null ? { bodyFatPercent: newLog.bodyFatPercent } : {}),
      });
    }
  };

  const deleteWeightLog = async (id: string) => {
    const updated = weightLogs.filter(l => l.id !== id);
    setWeightLogs(updated);
    if (dbRef.current) {
      await dbService.deleteWeightLogFromDb(dbRef.current, id);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(updated));
    }
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
    if (dbRef.current) {
      await dbService.saveWaterLog(dbRef.current, newLog);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(updated));
    }
  };

  const deleteWaterLog = async (id: string) => {
    const updated = waterLogs.filter(l => l.id !== id);
    setWaterLogs(updated);
    if (dbRef.current) {
      await dbService.deleteWaterLogFromDb(dbRef.current, id);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(updated));
    }
  };

  const addExerciseLog = async (log: Omit<ExerciseLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    const updated = [newLog, ...exerciseLogs];
    setExerciseLogs(updated);
    if (dbRef.current) {
      await dbService.saveExerciseLog(dbRef.current, newLog);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updated));
    }
  };

  const deleteExerciseLog = async (id: string) => {
    const updated = exerciseLogs.filter(l => l.id !== id);
    setExerciseLogs(updated);
    if (dbRef.current) {
      await dbService.deleteExerciseLogFromDb(dbRef.current, id);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updated));
    }
  };

  const resetAppData = async () => {
    try {
      if (dbRef.current) {
        await dbService.clearAllData(dbRef.current);
      }

      // Clear AsyncStorage
      const allKeys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(allKeys);

      // Clear SecureStore
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('gemini_api_key');
      } else {
        (global as any).__geminiKey = '';
      }

      // Reset States
      setProfileState(null);
      setFoodLogs([]);
      setSavedMeals([]);
      setWeightLogs([]);
      setWaterLogs([]);
      setExerciseLogs([]);
    } catch (error) {
      console.error('Failed to reset app data', error);
      throw error;
    }
  };

  const reloadFromDatabase = async () => {
    if (Platform.OS === 'web' || !dbRef.current) return;
    try {
      const db = await dbService.initDatabase();
      if (!db) return;
      dbRef.current = db;
      await loadData(db);
    } catch (error) {
      console.error('Failed to reload from database', error);
    }
  };

  const applyRestoredData = async (data: WebBackupData) => {
    if (dbRef.current) return;
    const profile = data.userProfile as UserProfile | null;
    const foods = (data.foodLogs || []) as FoodLog[];
    const meals = (data.savedMeals || []) as SavedMeal[];
    const weights = (data.weightLogs || []) as WeightLog[];
    const waters = (data.waterLogs || []) as WaterLog[];
    const exercises = (data.exerciseLogs || []) as ExerciseLog[];
    setProfileState(profile ?? null);
    setFoodLogs(foods);
    setSavedMeals(meals);
    setWeightLogs(weights);
    setWaterLogs(waters);
    setExerciseLogs(exercises);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(foods));
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(meals));
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(weights));
    await AsyncStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(waters));
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(exercises));
  };

  const value = useMemo(() => ({
    userProfile,
    foodLogs,
    savedMeals,
    weightLogs,
    waterLogs,
    exerciseLogs,
    setUserProfile,
    addFoodLog,
    updateFoodLog,
    deleteFoodLog,
    addSavedMeal,
    updateSavedMeal,
    deleteSavedMeal,
    addWeightLog,
    deleteWeightLog,
    addWaterLog,
    deleteWaterLog,
    addExerciseLog,
    deleteExerciseLog,
    resetAppData,
    reloadFromDatabase,
    applyRestoredData,
    isLoading,
  }), [userProfile, foodLogs, savedMeals, weightLogs, waterLogs, exerciseLogs, isLoading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
