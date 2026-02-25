import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { UserProfile, FoodLog, WeightLog, WaterLog, ExerciseLog } from '../types';

const DB_NAME = 'caloriebank.db';

export const initDatabase = async () => {
  if (Platform.OS === 'web') return null;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Initialize tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      age INTEGER,
      gender TEXT,
      height REAL,
      weight REAL,
      goalWeight REAL,
      activityLevel TEXT,
      weightChangeSpeed TEXT,
      dailyCalorieGoal INTEGER,
      waterGoal REAL,
      waterContainers TEXT, -- JSON string
      favoriteExerciseIds TEXT, -- JSON string
      customExercises TEXT, -- JSON string
      stepGoal INTEGER,
      geminiModel TEXT
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      name TEXT,
      calories INTEGER,
      protein REAL,
      carbs REAL,
      fat REAL,
      mealType TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      weight REAL,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id TEXT PRIMARY KEY,
      amount REAL,
      date TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id TEXT PRIMARY KEY,
      name TEXT,
      caloriesBurned INTEGER,
      durationMinutes INTEGER,
      date TEXT,
      timestamp TEXT
    );
  `);

  return db;
};

// CRUD for User Profile
export const saveUserProfile = async (db: SQLite.SQLiteDatabase, profile: UserProfile) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile (
      id, name, age, gender, height, weight, goalWeight, activityLevel, 
      weightChangeSpeed, dailyCalorieGoal, waterGoal, waterContainers, 
      favoriteExerciseIds, customExercises, stepGoal, geminiModel
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.name, profile.age, profile.gender, profile.height, profile.weight, 
      profile.goalWeight, profile.activityLevel, profile.weightChangeSpeed || null, 
      profile.dailyCalorieGoal, profile.waterGoal || null, 
      JSON.stringify(profile.waterContainers || {}),
      JSON.stringify(profile.favoriteExerciseIds || []),
      JSON.stringify(profile.customExercises || []),
      profile.stepGoal || null,
      profile.geminiModel || null
    ]
  );
};

export const getUserProfile = async (db: SQLite.SQLiteDatabase): Promise<UserProfile | null> => {
  const row = await db.getFirstAsync<{
    name: string, age: number, gender: any, height: number, weight: number, 
    goalWeight: number, activityLevel: any, weightChangeSpeed: any, 
    dailyCalorieGoal: number, waterGoal: number, waterContainers: string, 
    favoriteExerciseIds: string, customExercises: string, stepGoal: number, geminiModel: string
  }>('SELECT * FROM user_profile WHERE id = 1');

  if (!row) return null;

  return {
    name: row.name,
    age: row.age,
    gender: row.gender,
    height: row.height,
    weight: row.weight,
    goalWeight: row.goalWeight,
    activityLevel: row.activityLevel,
    weightChangeSpeed: row.weightChangeSpeed,
    dailyCalorieGoal: row.dailyCalorieGoal,
    waterGoal: row.waterGoal,
    waterContainers: JSON.parse(row.waterContainers),
    favoriteExerciseIds: JSON.parse(row.favoriteExerciseIds),
    customExercises: JSON.parse(row.customExercises),
    stepGoal: row.stepGoal,
    geminiModel: row.geminiModel
  };
};

// CRUD for Food Logs
export const saveFoodLog = async (db: SQLite.SQLiteDatabase, log: FoodLog) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO food_logs (id, name, calories, protein, carbs, fat, mealType, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [log.id, log.name, log.calories, log.protein, log.carbs, log.fat, log.mealType, log.date]
  );
};

export const deleteFoodLogFromDb = async (db: SQLite.SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM food_logs WHERE id = ?', [id]);
};

export const getAllFoodLogs = async (db: SQLite.SQLiteDatabase): Promise<FoodLog[]> => {
  return await db.getAllAsync<FoodLog>('SELECT * FROM food_logs ORDER BY date DESC');
};

// CRUD for Weight Logs
export const saveWeightLog = async (db: SQLite.SQLiteDatabase, log: WeightLog) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO weight_logs (id, weight, date) VALUES (?, ?, ?)',
    [log.id, log.weight, log.date]
  );
};

export const deleteWeightLogFromDb = async (db: SQLite.SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM weight_logs WHERE id = ?', [id]);
};

export const getAllWeightLogs = async (db: SQLite.SQLiteDatabase): Promise<WeightLog[]> => {
  return await db.getAllAsync<WeightLog>('SELECT * FROM weight_logs ORDER BY date DESC');
};

// CRUD for Water Logs
export const saveWaterLog = async (db: SQLite.SQLiteDatabase, log: WaterLog) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO water_logs (id, amount, date, timestamp) VALUES (?, ?, ?, ?)',
    [log.id, log.amount, log.date, log.timestamp]
  );
};

export const deleteWaterLogFromDb = async (db: SQLite.SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM water_logs WHERE id = ?', [id]);
};

export const getAllWaterLogs = async (db: SQLite.SQLiteDatabase): Promise<WaterLog[]> => {
  return await db.getAllAsync<WaterLog>('SELECT * FROM water_logs ORDER BY date DESC');
};

// CRUD for Exercise Logs
export const saveExerciseLog = async (db: SQLite.SQLiteDatabase, log: ExerciseLog) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO exercise_logs (id, name, caloriesBurned, durationMinutes, date, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [log.id, log.name, log.caloriesBurned, log.durationMinutes, log.date, log.timestamp]
  );
};

export const deleteExerciseLogFromDb = async (db: SQLite.SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM exercise_logs WHERE id = ?', [id]);
};

export const getAllExerciseLogs = async (db: SQLite.SQLiteDatabase): Promise<ExerciseLog[]> => {
  return await db.getAllAsync<ExerciseLog>('SELECT * FROM exercise_logs ORDER BY date DESC');
};

// Reset Database
export const clearAllData = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    DELETE FROM user_profile;
    DELETE FROM food_logs;
    DELETE FROM weight_logs;
    DELETE FROM water_logs;
    DELETE FROM exercise_logs;
  `);
};
