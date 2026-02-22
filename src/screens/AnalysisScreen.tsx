import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useAppContext } from '../context/AppContext';
import { calculateMacroGoals } from '../utils/fitness';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const { foodLogs, exerciseLogs, weightLogs, userProfile } = useAppContext();

  // --- Helper: Generate Date Range ---
  const generateDateData = (days: number) => {
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      data.push(d.toISOString().split('T')[0]);
    }
    return data;
  };

  // --- 1. Calorie Intake (30 Days) ---
  const calorieData = useMemo(() => {
    const dates = generateDateData(30);
    const goal = userProfile?.dailyCalorieGoal || 1833;

    return dates.map((date, index) => {
      const dayLogs = foodLogs.filter(log => log.date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.calories, 0);

      return {
        value: total,
        label: (index % 7 === 0 || index === dates.length - 1) ? date.split('-')[2] : '',
        frontColor: total > goal ? '#FF7043' : '#4CAF50',
      };
    });
  }, [foodLogs, userProfile]);

  // --- 2. Exercise Burn (30 Days) ---
  const exerciseData = useMemo(() => {
    const dates = generateDateData(30);
    return dates.map((date, index) => {
      const dayLogs = exerciseLogs.filter(log => log.date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
      return {
        value: total,
        label: (index % 7 === 0 || index === dates.length - 1) ? date.split('-')[2] : '',
        frontColor: '#2196F3',
      };
    });
  }, [exerciseLogs]);

  // --- 3. Weight Change (90 Days) ---
  const weightData = useMemo(() => {
    const dates = generateDateData(90);
    let lastWeight = userProfile?.weight || 0;

    return dates.map((date, index) => {
      const dayLog = weightLogs.find(log => log.date === date);
      if (dayLog) lastWeight = dayLog.weight;
      return {
        value: lastWeight,
        label: (index % 14 === 0 || index === dates.length - 1) ? `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}` : '',
      };
    });
  }, [weightLogs, userProfile]);

  // --- 4. Average Macro (30 Days) ---
  const macroSummary = useMemo(() => {
    const dates = generateDateData(30);
    let p = 0, c = 0, f = 0;

    dates.forEach(date => {
      const dayLogs = foodLogs.filter(log => log.date === date);
      dayLogs.forEach(log => {
        p += (log.protein || 0);
        c += (log.carbs || 0);
        f += (log.fat || 0);
      });
    });

    const total = p + c + f || 1;
    return [
      { value: Math.round((p / total) * 100), color: '#FF7043', text: 'P', label: '蛋白質' },
      { value: Math.round((c / total) * 100), color: '#4CAF50', text: 'C', label: '碳水' },
      { value: Math.round((f / total) * 100), color: '#FBC02D', text: 'F', label: '脂肪' },
    ];
  }, [foodLogs]);

  // --- 5. Statistics ---
  const stats = useMemo(() => {
    const dates = generateDateData(30);
    let totalIntake = 0;
    let totalBurn = 0;
    const goal = userProfile?.dailyCalorieGoal || 1833;

    dates.forEach(date => {
      totalIntake += foodLogs.filter(log => log.date === date).reduce((s, l) => s + l.calories, 0);
      totalBurn += exerciseLogs.filter(log => log.date === date).reduce((s, l) => s + l.caloriesBurned, 0);
    });

    const totalDeficit = (goal * 30) - totalIntake + totalBurn;
    return {
      avgIntake: Math.round(totalIntake / 30),
      avgBurn: Math.round(totalBurn / 30),
      totalDeficit: Math.round(totalDeficit),
      projectedWeightLoss: (totalDeficit / 7700).toFixed(1)
    };
  }, [foodLogs, exerciseLogs, userProfile]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>數據分析</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Quick Summary Section */}
        <View style={styles.summaryRow}>
          <SummaryCard
            title="預計減重"
            value={`${stats.projectedWeightLoss}kg`}
            subText="近 30 天熱量缺口推算"
            icon="trending-down"
            color="#4CAF50"
          />
          <SummaryCard
            title="平均攝入"
            value={`${stats.avgIntake}`}
            subText="kcal / 日"
            icon="restaurant"
            color="#FF7043"
          />
        </View>

        {/* 30-Day Calorie Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>30 天攝入卡路里趨勢</Text>
          <BarChart
            data={calorieData}
            width={width - 90}
            height={180}
            barWidth={width < 380 ? 6 : 8}
            spacing={width < 380 ? 2 : 4}
            noOfSections={3}
            maxValue={Math.max(...calorieData.map(d => d.value), 3000)}
            xAxisLabelTextStyle={{ fontSize: 10, color: '#999' }}
            roundedTop={true}
            hideRules={true}
          />
          <Text style={styles.chartNote}>* 紅色代表超過目標，綠色代表達標</Text>
        </View>

        {/* Nutrition Distribution Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>30 天平均營養分佈</Text>
          {macroSummary.every(i => i.value === 0) ? (
            <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>暫無飲食數據</Text>
            </View>
          ) : (
            <View style={styles.pieRow}>
              <PieChart
                data={macroSummary}
                radius={70}
                donut={true}
                innerRadius={50}
              />
              <View style={styles.pieLegend}>
                {macroSummary.map(item => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}: {item.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 30-Day Exercise Burn */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>30 天運動消耗 (kcal)</Text>
          <BarChart
            data={exerciseData}
            width={width - 90}
            height={150}
            barWidth={width < 380 ? 6 : 8}
            spacing={width < 380 ? 2 : 4}
            noOfSections={2}
            xAxisLabelTextStyle={{ fontSize: 10, color: '#999' }}
            roundedTop={true}
            hideRules={true}
          />
        </View>

        {/* 90-Day Weight Chart */}
        <View style={[styles.chartCard, { marginBottom: 40 }]}>
          <Text style={styles.chartTitle}>90 天體重變化趨勢 (kg)</Text>
          <LineChart
            data={weightData}
            width={width - 90}
            height={180}
            spacing={width < 380 ? 2.5 : 3}
            color="#4CAF50"
            thickness={3}
            noOfSections={4}
            xAxisLabelTextStyle={{ fontSize: 10, color: '#999' }}
            hideDataPoints={false}
            dataPointsColor="#4CAF50"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ title, value, subText, icon, color }: any) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.sumTitle}>{title}</Text>
        <Text style={[styles.sumValue, { color }]}>{value}</Text>
        <Text style={styles.sumSub}>{subText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerRow: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sumTitle: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  sumValue: { fontSize: 20, fontWeight: 'bold', marginVertical: 2 },
  sumSub: { fontSize: 10, color: '#C7C7CC' },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 20 },
  chartNote: { fontSize: 10, color: '#AEAEB2', marginTop: 15, textAlign: 'center' },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10 },
  pieLegend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, color: '#666' },
  tooltip: {
    height: 30,
    width: 60,
    backgroundColor: '#333',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});
