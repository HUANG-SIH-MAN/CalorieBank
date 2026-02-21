import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { ExerciseLog } from '../types';

interface ExerciseHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseLogs: ExerciseLog[];
}

export default function ExerciseHistoryModal({
  visible,
  onClose,
  exerciseLogs,
}: ExerciseHistoryModalProps) {

  // Group logs by date to get daily totals
  const dailyTotals = exerciseLogs.reduce((acc: { [key: string]: { calories: number; duration: number } }, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { calories: 0, duration: 0 };
    }
    acc[log.date].calories += log.caloriesBurned;
    acc[log.date].duration += log.durationMinutes;
    return acc;
  }, {});

  const sortedDates = Object.keys(dailyTotals).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Prepare 30-day chart data — all 30 days including zeros
  const prepareChartData = () => {
    const now = new Date();
    const days30: { date: string; calories: number; hasData: boolean }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days30.push({
        date: dateStr,
        calories: dailyTotals[dateStr]?.calories ?? 0,
        hasData: !!dailyTotals[dateStr],
      });
    }

    // Show label every 5 days to avoid crowding (indices 0, 4, 9, 14, 19, 24, 29)
    const labels = days30.map((item, index) => {
      if (index % 5 === 0 || index === 29) {
        const d = new Date(item.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [
        {
          data: days30.map(item => item.calories),
          colors: days30.map(item =>
            item.hasData
              ? (opacity = 1) => `rgba(76, 175, 80, ${opacity})`   // green if exercised
              : (opacity = 1) => `rgba(244, 67, 54, ${opacity})`   // red if no exercise
          ),
        }
      ],
      days30,
    };
  };

  const { labels, datasets, days30 } = prepareChartData();
  const chartData = { labels, datasets };
  const screenWidth = Dimensions.get('window').width;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>運動歷史</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>消耗卡路里</Text>
              <Text style={styles.chartSubtitle}>(最近30天)</Text>
            </View>

            <BarChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              withCustomBarColorFromData
              flatColor
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                style: { borderRadius: 16 },
                barPercentage: 0.6,
              }}
              verticalLabelRotation={0}
              style={styles.chart}
              showValuesOnTopOfBars={false}
            />
          </View>

          {/* Daily Logs Section */}
          <View style={styles.recordsSection}>
            <Text style={styles.recordsTitle}>每日統計</Text>
            {sortedDates.length === 0 ? (
              <Text style={styles.noDataText}>尚無運動紀錄</Text>
            ) : (
              sortedDates.map((date) => {
                const isToday = date === today;
                return (
                  <View key={date} style={styles.recordItem}>
                    <View style={styles.recordInfo}>
                      <View style={styles.recordDateRow}>
                        <Text style={styles.recordDate}>{formatDate(date)}</Text>
                        {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>今天</Text></View>}
                      </View>
                      <Text style={styles.recordSub}>{dailyTotals[date].duration} 分鐘</Text>
                    </View>
                    <View style={styles.recordValueContainer}>
                      <Text style={styles.recordCalories}>{dailyTotals[date].calories}</Text>
                      <Text style={styles.unitText}>kcal</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerBtn: { width: 44, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20 },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  chartSubtitle: { fontSize: 12, color: '#999' },
  chart: { marginVertical: 8, borderRadius: 16 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },
  recordsSection: { marginBottom: 30 },
  recordsTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  recordInfo: { flex: 1 },
  recordDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordDate: { fontSize: 16, color: '#333', fontWeight: '500' },
  todayBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: { fontSize: 11, color: '#2196F3', fontWeight: 'bold' },
  recordSub: { fontSize: 13, color: '#999', marginTop: 3 },
  recordValueContainer: { alignItems: 'flex-end' },
  recordCalories: { fontSize: 22, color: '#4CAF50', fontWeight: 'bold' },
  recordCaloriesZero: { color: '#F44336' },
  unitText: { fontSize: 12, color: '#999' },
  noDataText: { fontSize: 15, color: '#999', textAlign: 'center', paddingVertical: 30 },
});
