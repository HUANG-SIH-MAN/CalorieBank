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
import { LineChart } from 'react-native-chart-kit';
import Constants from 'expo-constants';
import { WeightLog } from '../types';

interface WeightHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  weightLogs: WeightLog[];
  onAddRecord: () => void;
}

export default function WeightHistoryModal({
  visible,
  onClose,
  weightLogs,
  onAddRecord,
}: WeightHistoryModalProps) {

  // Sort logs by date descending for the list
  const sortedLogs = [...weightLogs].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const screenWidth = Dimensions.get('window').width;
  // chart width = screen - scrollPadding(20*2) - cardPadding(16*2) - extraSafety(10)
  const chartWidth = screenWidth - 40 - 32 - 10;

  // Prepare data for the chart
  const prepareChartData = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const recentLogs = weightLogs
      .filter(log => new Date(log.date) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentLogs.length === 0) {
      return {
        labels: [''],
        datasets: [{ data: [0] }]
      };
    }

    // For small datasets (< 8 points), show all labels
    // For larger datasets, show max 5 labels evenly spaced
    const maxLabels = 5;
    const labels = recentLogs.map((log, index) => {
      if (recentLogs.length <= maxLabels) {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      // Show first, last, and evenly spaced middle labels
      const step = Math.floor(recentLogs.length / (maxLabels - 1));
      if (index === 0 || index === recentLogs.length - 1 || (index % step === 0 && index + step < recentLogs.length)) {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [
        {
          data: recentLogs.map(log => log.weight),
          color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  };

  const chartData = prepareChartData();

  const prepareBodyFatChartData = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const recentLogs = weightLogs
      .filter(log => log.bodyFatPercent != null && new Date(log.date) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentLogs.length === 0) {
      return {
        labels: [''] as string[],
        datasets: [{ data: [0] as number[] }]
      };
    }

    const maxLabels = 5;
    const labels = recentLogs.map((log, index) => {
      if (recentLogs.length <= maxLabels) {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      const step = Math.floor(recentLogs.length / (maxLabels - 1));
      if (index === 0 || index === recentLogs.length - 1 || (index % step === 0 && index + step < recentLogs.length)) {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [
        {
          data: recentLogs.map(log => log.bodyFatPercent as number),
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  };

  const bodyFatChartData = prepareBodyFatChartData();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>體重</Text>
            <TouchableOpacity onPress={onAddRecord} style={styles.headerBtn}>
              <Ionicons name="add" size={32} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>體重</Text>
              <Text style={styles.chartSubtitle}>(最近90天)</Text>
            </View>

            {weightLogs.length > 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={180}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                    propsForLabels: {
                      fontSize: 10,
                    },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: '#66BB6A'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#F0F0F0',
                      strokeWidth: 1,
                    },
                  }}
                  bezier={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withShadow={false}
                  style={{ marginLeft: -16 }}
                  segments={4}
                  fromZero={false}
                />
              </View>
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>尚無體重數據</Text>
              </View>
            )}
          </View>

          {/* Body Fat Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>體脂率</Text>
              <Text style={styles.chartSubtitle}>(最近90天)</Text>
            </View>

            {bodyFatChartData.datasets[0].data.length > 0 && bodyFatChartData.datasets[0].data[0] !== 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={bodyFatChartData}
                  width={chartWidth}
                  height={180}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                    propsForLabels: { fontSize: 10 },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: '#2196F3'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#F0F0F0',
                      strokeWidth: 1,
                    },
                  }}
                  bezier={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withShadow={false}
                  style={{ marginLeft: -16 }}
                  segments={4}
                  fromZero={false}
                />
              </View>
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>尚無體脂率數據</Text>
              </View>
            )}
          </View>

          {/* Records List */}
          <View style={styles.recordsSection}>
            <Text style={styles.recordsTitle}>記錄</Text>
            {sortedLogs.map((log) => (
              <View key={log.id} style={styles.recordItem}>
                <Text style={styles.recordDate}>{formatDate(log.date)}</Text>
                <Text style={styles.recordWeight}>
                  {log.weight.toFixed(1)} kg
                  {log.bodyFatPercent != null ? ` | 體脂 ${log.bodyFatPercent}%` : ''}
                </Text>
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
  noData: { height: 180, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: '#999' },
  recordsSection: { marginBottom: 30 },
  recordsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  recordDate: { fontSize: 16, color: '#333' },
  recordWeight: { fontSize: 16, color: '#333', fontWeight: '600' },
});
