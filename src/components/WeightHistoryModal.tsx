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
import { LineChart } from 'react-native-chart-kit';
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

  // Prepare data for the 90-day chart
  const prepareChartData = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    // Filter logs for the last 90 days
    const recentLogs = weightLogs
      .filter(log => new Date(log.date) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentLogs.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0] }]
      };
    }

    // Since we might have many days, we pick a few labels to show
    const labels = recentLogs.map((log, index) => {
      if (index === 0 || index === recentLogs.length - 1 || index === Math.floor(recentLogs.length / 2)) {
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
          color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`, // Green theme
          strokeWidth: 2
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
          <Text style={styles.headerTitle}>體重</Text>
          <TouchableOpacity onPress={onAddRecord} style={styles.headerBtn}>
            <Ionicons name="add" size={32} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>體重</Text>
              <Text style={styles.chartSubtitle}>(最近90天)</Text>
            </View>

            {weightLogs.length > 0 ? (
              <LineChart
                data={chartData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#66BB6A'
                  }
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>尚無體重數據</Text>
              </View>
            )}
          </View>

          {/* Records List */}
          <View style={styles.recordsSection}>
            <Text style={styles.recordsTitle}>記錄</Text>
            {sortedLogs.map((log) => (
              <View key={log.id} style={styles.recordItem}>
                <Text style={styles.recordDate}>{formatDate(log.date)}</Text>
                <Text style={styles.recordWeight}>{log.weight.toFixed(1)}千克</Text>
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
  recordDate: { fontSize: 18, color: '#333' },
  recordWeight: { fontSize: 18, color: '#333', fontWeight: '500' },
});
