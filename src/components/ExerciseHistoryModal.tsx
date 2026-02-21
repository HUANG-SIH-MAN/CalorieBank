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

  // Prepare data for the 90-day chart
  const prepareChartData = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const chartDates: string[] = [];
    const calorieValues: number[] = [];

    // Filter and sort for chart
    const filteredDates = Object.keys(dailyTotals)
      .filter(date => new Date(date) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (filteredDates.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0] }]
      };
    }

    // Limit points to avoid crowding (show max 7 bars if many days)
    const labels = filteredDates.map((date, index) => {
      if (index === 0 || index === filteredDates.length - 1 || index === Math.floor(filteredDates.length / 2)) {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [
        {
          data: filteredDates.map(date => dailyTotals[date].calories),
        }
      ],
    };
  };

  const chartData = prepareChartData();
  const screenWidth = Dimensions.get('window').width;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

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
              <Text style={styles.chartSubtitle}>(最近90天)</Text>
            </View>

            {sortedDates.length > 0 ? (
              <BarChart
                data={chartData}
                width={screenWidth - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green theme
                  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                verticalLabelRotation={0}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>尚無運動數據</Text>
              </View>
            )}
          </View>

          {/* Daily Logs Section */}
          <View style={styles.recordsSection}>
            <Text style={styles.recordsTitle}>每日統計</Text>
            {sortedDates.map((date) => (
              <View key={date} style={styles.recordItem}>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordDate}>{formatDate(date)}</Text>
                  <Text style={styles.recordSub}>{dailyTotals[date].duration} 分鐘 運動</Text>
                </View>
                <View style={styles.recordValueContainer}>
                  <Text style={styles.recordCalories}>{dailyTotals[date].calories}</Text>
                  <Text style={styles.unitText}>kcal</Text>
                </View>
              </View>
            ))}
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
    boxShadow: '0px 4px 15px rgba(0,0,0,0.05)',
  },
  chartHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  chartSubtitle: { fontSize: 12, color: '#999' },
  chart: { marginVertical: 8, borderRadius: 16 },
  noData: { height: 200, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: '#999' },
  recordsSection: { marginBottom: 30 },
  recordsTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  recordInfo: { flex: 1 },
  recordDate: { fontSize: 18, color: '#333', fontWeight: '500' },
  recordSub: { fontSize: 14, color: '#999', marginTop: 4 },
  recordValueContainer: { alignItems: 'flex-end' },
  recordCalories: { fontSize: 22, color: '#4CAF50', fontWeight: 'bold' },
  unitText: { fontSize: 12, color: '#999' },
});
