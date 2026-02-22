import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import Constants from 'expo-constants';
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

  const screenWidth = Dimensions.get('window').width;
  // chart width = screen - scrollPadding(20*2) - cardPadding(16*2) - extraSafety(10)
  const chartWidth = screenWidth - 40 - 32 - 10;

  // Prepare chart data — show only last 7 days for maximum clarity on mobile
  const prepareChartData = () => {
    const now = new Date();
    const daysToShow = 7; // Show 1 week
    const daysData: { date: string; calories: number; hasData: boolean }[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      daysData.push({
        date: dateStr,
        calories: dailyTotals[dateStr]?.calories ?? 0,
        hasData: !!dailyTotals[dateStr],
      });
    }

    // Show labels for every day since it's only 7 days
    const labels = daysData.map((item) => {
      const d = new Date(item.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    return {
      labels,
      datasets: [
        {
          data: daysData.map(item => item.calories),
          colors: daysData.map(item =>
            item.hasData
              ? (opacity = 1) => `rgba(76, 175, 80, ${opacity})`
              : (opacity = 1) => `rgba(224, 224, 224, ${opacity})`
          ),
        }
      ],
      daysData,
    };
  };

  const { labels, datasets, daysData } = prepareChartData();
  const chartData = { labels, datasets };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const today = new Date().toISOString().split('T')[0];

  // Calculate max value for chart (with some padding above)
  const maxCalories = Math.max(...daysData.map(d => d.calories), 100);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>運動歷史</Text>
            <View style={styles.headerBtn} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>消耗卡路里</Text>
              <Text style={styles.chartSubtitle}>(最近7天)</Text>
            </View>

            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                width={chartWidth}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                withCustomBarColorFromData={true}
                flatColor={true}
                fromZero={true}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                  propsForLabels: {
                    fontSize: 10,
                  },
                  barPercentage: 0.6,
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#F0F0F0',
                    strokeWidth: 1,
                  },
                }}
                verticalLabelRotation={0}
                style={{ marginLeft: -16 }}
                showValuesOnTopOfBars={false}
                segments={3}
              />
            </View>
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
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20 },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  chartContainer: {
    overflow: 'hidden',
    marginHorizontal: -4,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  chartTitle: { fontSize: 17, fontWeight: 'bold', marginRight: 6 },
  chartSubtitle: { fontSize: 12, color: '#999' },
  recordsSection: { marginBottom: 30 },
  recordsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  recordInfo: { flex: 1 },
  recordDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordDate: { fontSize: 15, color: '#333', fontWeight: '500' },
  todayBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: { fontSize: 11, color: '#2196F3', fontWeight: 'bold' },
  recordSub: { fontSize: 13, color: '#999', marginTop: 3 },
  recordValueContainer: { alignItems: 'flex-end' },
  recordCalories: { fontSize: 20, color: '#4CAF50', fontWeight: 'bold' },
  unitText: { fontSize: 12, color: '#999' },
  noDataText: { fontSize: 15, color: '#999', textAlign: 'center', paddingVertical: 30 },
});
