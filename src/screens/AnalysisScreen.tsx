import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { BarChart, PieChart } from 'react-native-gifted-charts'; // Still great for these
import { LineChart as KitLineChart } from 'react-native-chart-kit'; // Better for the specific weight curve
import { useAppContext } from '../context/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  const chartWidth = width - 40 - 32; // Screen - ScrollPadding - CardPadding

  // --- 1. Calorie Intake (7 Days) ---
  const calorieData = useMemo(() => {
    const dates = generateDateData(7);
    const goal = userProfile?.dailyCalorieGoal || 1833;

    return dates.map((date) => {
      const dayLogs = foodLogs.filter(log => log.date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.calories, 0);
      const d = new Date(date);

      return {
        value: total,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        frontColor: total > goal ? '#FFAB91' : '#81C784',
        topLabelComponent: () => (
          <Text style={{ fontSize: 9, color: '#999', marginBottom: 4 }}>{total > 0 ? total : ''}</Text>
        ),
      };
    });
  }, [foodLogs, userProfile]);

  // --- 2. Exercise Burn (7 Days) ---
  const exerciseData = useMemo(() => {
    const dates = generateDateData(7);
    return dates.map((date) => {
      const dayLogs = exerciseLogs.filter(log => log.date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
      const d = new Date(date);
      return {
        value: total,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        frontColor: '#64B5F6',
        topLabelComponent: () => (
          <Text style={{ fontSize: 9, color: '#999', marginBottom: 4 }}>{total > 0 ? total : ''}</Text>
        ),
      };
    });
  }, [exerciseLogs]);

  // --- 3. Weight Change (90 Days) - Optimized for Chart Kit ---
  const weightChartKitData = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const recentLogs = weightLogs
      .filter(log => new Date(log.date) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentLogs.length === 0) {
      const currentW = userProfile?.weight || 0;
      return {
        labels: ['今日'],
        datasets: [{ data: [currentW] }]
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
          data: recentLogs.map(log => log.weight),
          color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  }, [weightLogs, userProfile]);

  // --- 4. Average Macro (7 Days) ---
  const macroSummary = useMemo(() => {
    const dates = generateDateData(7);
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
    const dates30 = generateDateData(30);
    const dates7 = generateDateData(7);

    let totalIntake30 = 0, totalBurn30 = 0, totalIntake7 = 0, totalBurn7 = 0;
    const goal = userProfile?.dailyCalorieGoal || 1833;

    dates30.forEach(date => {
      totalIntake30 += foodLogs.filter(log => log.date === date).reduce((s, l) => s + l.calories, 0);
      totalBurn30 += exerciseLogs.filter(log => log.date === date).reduce((s, l) => s + l.caloriesBurned, 0);
    });

    dates7.forEach(date => {
      totalIntake7 += foodLogs.filter(log => log.date === date).reduce((s, l) => s + l.calories, 0);
      totalBurn7 += exerciseLogs.filter(log => log.date === date).reduce((s, l) => s + l.caloriesBurned, 0);
    });

    const totalDeficit30 = (goal * 30) - totalIntake30 + totalBurn30;
    return {
      avgIntake7: Math.round(totalIntake7 / 7),
      avgBurn7: Math.round(totalBurn7 / 7),
      projectedWeightLoss: (totalDeficit30 / 7700).toFixed(1)
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

        {/* Main Stats Card */}
        <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.mainStatsCard}>
          <View style={styles.statsTopRow}>
            <View style={styles.mainScoreWrapper}>
              <Text style={styles.mainScoreLabel}>預計減重 (30天)</Text>
              <Text style={styles.mainScoreValue}>{stats.projectedWeightLoss}<Text style={styles.mainScoreUnit}>kg</Text></Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.subStatsColumn}>
              <View style={styles.subStatItem}>
                <View style={[styles.statIconSmall, { backgroundColor: '#FF704320' }]}>
                  <Ionicons name="restaurant" size={14} color="#FF7043" />
                </View>
                <View>
                  <Text style={styles.subStatLabel}>平均攝入</Text>
                  <Text style={styles.subStatValue}>{stats.avgIntake7}<Text style={styles.subStatUnit}>kcal</Text></Text>
                </View>
              </View>
              <View style={styles.subStatItem}>
                <View style={[styles.statIconSmall, { backgroundColor: '#4CAF5020' }]}>
                  <MaterialCommunityIcons name="fire" size={16} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.subStatLabel}>平均運動</Text>
                  <Text style={styles.subStatValue}>{stats.avgBurn7}<Text style={styles.subStatUnit}>kcal</Text></Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>近 7 日趨勢</Text>
          <View style={styles.tag}><Text style={styles.tagText}>WEEKLY</Text></View>
        </View>

        {/* 7-Day Calorie Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconBox, { backgroundColor: '#81C78420' }]}>
              <Ionicons name="flash" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.chartTitle}>攝入卡路里趨勢</Text>
          </View>
          <View style={styles.giftedChartWrapper}>
            <BarChart
              data={calorieData}
              width={width - 100}
              height={160}
              barWidth={24}
              spacing={14}
              noOfSections={3}
              maxValue={Math.max(...calorieData.map(d => d.value), userProfile?.dailyCalorieGoal || 1833) * 1.2}
              xAxisLabelTextStyle={{ fontSize: 9, color: '#999' }}
              yAxisTextStyle={{ fontSize: 9, color: '#999' }}
              yAxisLabelWidth={30}
              roundedTop={true}
              hideRules={false}
              rulesColor="#F0F0F0"
              yAxisThickness={0}
              xAxisThickness={0}
            />
          </View>
        </View>

        {/* 7-Day Exercise Burn */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconBox, { backgroundColor: '#64B5F620' }]}>
              <MaterialCommunityIcons name="run" size={18} color="#2196F3" />
            </View>
            <Text style={styles.chartTitle}>運動消耗趨勢</Text>
          </View>
          <View style={styles.giftedChartWrapper}>
            <BarChart
              data={exerciseData}
              width={width - 100}
              height={160}
              barWidth={24}
              spacing={14}
              noOfSections={3}
              maxValue={Math.max(...exerciseData.map(d => d.value), 500) * 1.2}
              xAxisLabelTextStyle={{ fontSize: 9, color: '#999' }}
              yAxisTextStyle={{ fontSize: 9, color: '#999' }}
              yAxisLabelWidth={30}
              roundedTop={true}
              hideRules={false}
              rulesColor="#F0F0F0"
              yAxisThickness={0}
              xAxisThickness={0}
            />
          </View>
        </View>

        {/* Nutrition Distribution Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconBox, { backgroundColor: '#FFD54F20' }]}>
              <Ionicons name="pie-chart" size={18} color="#FBC02D" />
            </View>
            <Text style={styles.chartTitle}>7 日平均營養分佈</Text>
          </View>
          {macroSummary.every(i => i.value === 0) ? (
            <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>暫無飲食數據</Text>
            </View>
          ) : (
            <View style={styles.pieRow}>
              <PieChart
                data={macroSummary}
                radius={60}
                donut={true}
                innerRadius={42}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>營養</Text>
                    <Text style={{ fontSize: 9, color: '#999' }}>比例</Text>
                  </View>
                )}
              />
              <View style={styles.pieLegend}>
                {macroSummary.map(item => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                    <Text style={styles.legendPercent}>{item.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={[styles.sectionTitleRow, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>體重趨勢</Text>
          <View style={styles.tag}><Text style={styles.tagText}>90 DAYS</Text></View>
        </View>

        {/* 90-Day Weight Chart - Now using Chart Kit for the smooth curve */}
        <View style={[styles.chartCard, { marginBottom: 40 }]}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartIconBox, { backgroundColor: '#F0F0F0' }]}>
              <MaterialCommunityIcons name="weight-kilogram" size={18} color="#666" />
            </View>
            <Text style={styles.chartTitle}>體重變化趨勢 (kg)</Text>
          </View>
          <View style={styles.chartKitWrapper}>
            <KitLineChart
              data={weightChartKitData}
              width={chartWidth}
              height={180}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                propsForLabels: { fontSize: 9 },
                propsForDots: { r: '4', strokeWidth: '1.5', stroke: '#66BB6A' },
                propsForBackgroundLines: { strokeDasharray: '', stroke: '#F4F4F4', strokeWidth: 1 },
              }}
              bezier={true}
              withInnerLines={true}
              withOuterLines={false}
              withShadow={false}
              style={{ marginLeft: -16 }}
              fromZero={false}
              segments={4}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerRow: { height: 56, justifyContent: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  scrollContent: { padding: 16, paddingBottom: 100 },

  mainStatsCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 24,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  statsTopRow: { flexDirection: 'row', alignItems: 'center' },
  mainScoreWrapper: { flex: 1.2 },
  mainScoreLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 6 },
  mainScoreValue: { fontSize: 36, fontWeight: 'bold', color: '#4CAF50' },
  mainScoreUnit: { fontSize: 16, color: '#8E8E93', marginLeft: 4 },
  scoreDivider: { width: 1, height: 60, backgroundColor: '#F0F0F0', marginHorizontal: 20 },
  subStatsColumn: { flex: 1, gap: 16 },
  subStatItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconSmall: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  subStatLabel: { fontSize: 11, color: '#8E8E93' },
  subStatValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subStatUnit: { fontSize: 10, color: '#999', marginLeft: 2 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  tag: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },

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
    overflow: 'hidden',
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  chartIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },

  giftedChartWrapper: { marginLeft: -10 },
  chartKitWrapper: { overflow: 'hidden', marginHorizontal: -4 },

  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 5 },
  pieLegend: { gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, color: '#666' },
  legendPercent: { fontSize: 13, fontWeight: 'bold', color: '#333', marginLeft: 'auto' },
});
