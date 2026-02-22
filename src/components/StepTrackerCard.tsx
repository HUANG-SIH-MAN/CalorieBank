import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface StepTrackerCardProps {
  date: string; // YYYY-MM-DD
}

export default function StepTrackerCard({ date }: StepTrackerCardProps) {
  const { userProfile } = useAppContext();
  const [stepCount, setStepCount] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const stepGoal = userProfile?.stepGoal || 10000;

  useEffect(() => {
    let subscription: any = null;

    const checkAvailability = async () => {
      try {
        const result = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(String(result));
        if (result) {
          fetchStepsForDate();
        }
      } catch (error) {
        setIsPedometerAvailable('false');
      }
    };

    const fetchStepsForDate = async () => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        if (result) {
          setStepCount(result.steps);
        }
      } catch (error) {
        console.error('Could not get step count', error);
      }
    };

    checkAvailability();

    // If it's today, we should also watch for new steps
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      subscription = Pedometer.watchStepCount(result => {
        // Pedometer.watchStepCount returns steps since subscription started
        // We need to re-fetch totals to be accurate, or just increment
        fetchStepsForDate();
      });
    } else {
      setStepCount(0); // Reset for other days before fetch
      fetchStepsForDate();
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, [date]);

  const progress = Math.min(stepCount / stepGoal, 1);
  const caloriesBurned = Math.round(stepCount * 0.04); // Rough estimate: 0.04 kcal per step

  if (isPedometerAvailable === 'false' && Platform.OS === 'web') {
    // Show a mock or placeholder for web
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="footsteps" size={24} color="#FF9800" />
            </View>
            <View>
              <Text style={styles.infoTitle}>今日步數 (網頁預覽)</Text>
              <Text style={styles.infoSub}>{stepCount} / {stepGoal} 步</Text>
              <Text style={styles.bmiTip}>手機端將自動同步步數</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="footsteps" size={24} color="#FF9800" />
            </View>
            <View>
              <Text style={styles.infoTitle}>步行步數</Text>
              <Text style={styles.infoSub}>{stepCount.toLocaleString()} / {stepGoal.toLocaleString()} 步</Text>
            </View>
          </View>
          <View style={styles.statsRight}>
            <Text style={styles.kcalText}>{caloriesBurned} kcal</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>

        {progress >= 1 && (
          <View style={styles.congratsRow}>
            <FontAwesome5 name="award" size={14} color="#FFD700" />
            <Text style={styles.congratsText}>恭喜！已達成今日步數目標</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  infoSub: { fontSize: 14, color: '#6C757D', marginTop: 2 },
  statsRight: { alignItems: 'flex-end' },
  kcalText: { fontSize: 16, fontWeight: 'bold', color: '#FF9800' },
  bmiTip: { fontSize: 12, color: '#999', marginTop: 2, fontStyle: 'italic' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#FFF3E0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF9800', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#999', fontWeight: 'bold', width: 35 },
  congratsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  congratsText: { fontSize: 12, color: '#FBC02D', fontWeight: 'bold' },
});
