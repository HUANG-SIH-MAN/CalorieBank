import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function HomeScreen() {
  const { userProfile, foodLogs, weightLogs } = useAppContext();

  const todayCalories = foodLogs
    .filter(log => log.date === new Date().toISOString().split('T')[0])
    .reduce((sum, log) => sum + log.calories, 0);

  const calorieGoal = userProfile?.dailyCalorieGoal || 2000;
  const remaining = calorieGoal - todayCalories;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>你好!</Text>
          <Text style={styles.subtext}>這就是你今天的卡路里銀行</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>剩餘卡路里</Text>
          <Text style={styles.calorieValue}>{remaining}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(100, (todayCalories / calorieGoal) * 100)}%` }]} />
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>攝取: {todayCalories}</Text>
            <Text style={styles.statLabel}>目標: {calorieGoal}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近紀錄</Text>
          {foodLogs.slice(0, 5).map(log => (
            <View key={log.id} style={styles.logItem}>
              <Text style={styles.logName}>{log.name}</Text>
              <Text style={styles.logCalories}>{log.calories} kcal</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20 },
  header: { marginBottom: 30 },
  greeting: { fontSize: 32, fontWeight: 'bold' },
  subtext: { fontSize: 16, color: '#6C757D' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardTitle: { fontSize: 18, color: '#6C757D', marginBottom: 10 },
  calorieValue: { fontSize: 48, fontWeight: 'bold', color: '#007AFF', marginBottom: 20 },
  progressContainer: { height: 10, backgroundColor: '#E9ECEF', borderRadius: 5, overflow: 'hidden', marginBottom: 15 },
  progressBar: { height: '100%', backgroundColor: '#007AFF' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 14, color: '#6C757D' },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  logItem: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  logName: { fontSize: 16, fontWeight: '500' },
  logCalories: { fontSize: 16, color: '#6C757D' },
});
