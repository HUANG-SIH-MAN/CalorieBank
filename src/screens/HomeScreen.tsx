import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import WeightLogModal from '../components/WeightLogModal';
import DatePickerModal from '../components/DatePickerModal';
import WeightHistoryModal from '../components/WeightHistoryModal';
import WaterLogModal from '../components/WaterLogModal';
import WaterSettingsModal from '../components/WaterSettingsModal';
import ExerciseHistoryModal from '../components/ExerciseHistoryModal';
import StepTrackerCard from '../components/StepTrackerCard';

export default function HomeScreen() {
  const { userProfile, foodLogs, weightLogs, waterLogs, exerciseLogs, addWeightLog, addWaterLog } = useAppContext();
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightHistoryVisible, setWeightHistoryVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [waterSettingsVisible, setWaterSettingsVisible] = useState(false);
  const [exerciseHistoryVisible, setExerciseHistoryVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return '今天';

    const d = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';

    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // Data Calculations
  const currentFoodLogs = foodLogs.filter(log => log.date === selectedDate);
  const todayCalories = currentFoodLogs.reduce((sum, log) => sum + log.calories, 0);

  const dayWeightLog = weightLogs.find((log: any) => log.date === selectedDate);
  const displayWeight = dayWeightLog ? dayWeightLog.weight : (userProfile?.weight || 0);

  const currentWaterLogs = waterLogs.filter(log => log.date === selectedDate);
  const todayWater = currentWaterLogs.reduce((sum, log) => sum + log.amount, 0);

  // Calculate Water Goal: Profile custom goal OR weight * 35
  const waterGoal = userProfile?.waterGoal || Math.round((userProfile?.weight || 70) * 35);
  const waterProgress = Math.min(todayWater / waterGoal, 1);

  // Container sizes from profile or defaults
  const containers = userProfile?.waterContainers || { small: 250, medium: 500, large: 1000 };

  const calorieGoal = userProfile?.dailyCalorieGoal || 1833;
  const currentExerciseLogs = exerciseLogs.filter(log => log.date === selectedDate);
  const todayExerciseCalories = currentExerciseLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const todayExerciseDuration = currentExerciseLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

  const remaining = calorieGoal - todayCalories + todayExerciseCalories;

  // BMI Calculation
  const heightM = (userProfile?.height || 170) / 100;
  const bmi = displayWeight / (heightM * heightM);

  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: '過輕', color: '#64B5F6', tip: '增加營養攝取吧！' };
    if (val < 24) return { label: '正常', color: '#66BB6A', tip: '很棒，保持喔！' };
    if (val < 27) return { label: '過重', color: '#FFB74D', tip: '要注意飲食囉！' };
    if (val < 30) return { label: '輕度肥胖', color: '#FF8A65', tip: '多運動增加代謝！' };
    if (val < 35) return { label: '中度肥胖', color: '#E57373', tip: '減重刻不容緩。' };
    return { label: '重度肥胖', color: '#D32F2F', tip: '建議諮詢醫療建議。' };
  };

  const bmiStatus = getBMICategory(bmi);

  return (
    <SafeAreaView style={styles.container}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <View style={styles.headerColumn}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setDatePickerVisible(true)}
          style={styles.headerCenter}
        >
          <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={16} color="#333" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.headerColumn}>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.headerIconBtn}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Calorie Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>卡路里</Text>
          <View style={styles.mainInfo}>
            <View style={styles.circleContainer}>
              <Text style={styles.remainingValue}>{remaining}</Text>
              <Text style={styles.remainingLabel}>還能吃</Text>
            </View>
            <View style={styles.statsColumn}>
              <View style={styles.statItem}>
                <Text style={styles.statSmallLabel}>🏆 推薦攝入量: {calorieGoal}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statSmallLabel}>🍴 飲食: {todayCalories}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statSmallLabel}>🔥 運動: {todayExerciseCalories}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meal Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🍔 我的日常飲食報告</Text>
          </View>

          {[
            { name: '早餐', icon: '🍳' },
            { name: '午餐', icon: '🍗' },
            { name: '晚餐', icon: '🍔' },
            { name: '點心', icon: '☕' }
          ].map((meal) => (
            <TouchableOpacity key={meal.name} style={styles.mealCard}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealIcon}>{meal.icon}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
              </View>
              <Ionicons name="add-circle" size={30} color="#66BB6A" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Tracking Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setWeightHistoryVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#FFF9C4' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={24} color="#FBC02D" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.infoTitle}>體重紀錄</Text>
                  <View style={[styles.bmiBadge, { backgroundColor: bmiStatus.color }]}>
                    <Text style={styles.bmiBadgeText}>{bmiStatus.label}</Text>
                  </View>
                </View>
                <Text style={styles.infoSub}>
                  {displayWeight} kg <Text style={styles.bmiText}>| BMI: {bmi.toFixed(1)}</Text>
                </Text>
                <Text style={styles.bmiTip}>{bmiStatus.tip}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.recordBtn}
              onPress={() => setWeightModalVisible(true)}
            >
              <Text style={styles.recordText}>記錄</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Exercise Summary Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setExerciseHistoryVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="fitness" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.infoTitle}>運動消耗</Text>
                <Text style={styles.infoSub}>
                  {todayExerciseCalories} kcal <Text style={styles.bmiText}>| {todayExerciseDuration} 分鐘</Text>
                </Text>
                <Text style={styles.bmiTip}>
                  {todayExerciseDuration > 0 ? '今天運動量很充實喔！' : '還沒運動嗎？動一動更有活力！'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        {/* <StepTrackerCard date={selectedDate} /> */}

        {/* Water Tracking Card */}
        <View style={styles.section}>
          <View style={styles.infoCardVertical}>
            <View style={styles.waterHeader}>
              <View style={styles.infoLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#E3F2FD' }]}>
                  <FontAwesome5 name="tint" size={20} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.infoTitle}>飲水紀錄</Text>
                  <Text style={styles.infoSub}>{todayWater} / {waterGoal} ml</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setWaterSettingsVisible(true)} style={{ marginRight: 15 }}>
                  <Ionicons name="settings-outline" size={24} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setWaterModalVisible(true)}>
                  <Ionicons name="add-circle-outline" size={28} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${waterProgress * 100}%` }]} />
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.quickAddRow}>
              {[
                { label: '小玻璃杯', amount: containers.small, icon: 'glass-whiskey' },
                { label: '環保瓶', amount: containers.medium, icon: 'prescription-bottle' },
                { label: '大水壺', amount: containers.large, icon: 'bitbucket' }
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickAddBtn}
                  onPress={() => addWaterLog(item.amount, selectedDate)}
                >
                  <FontAwesome5 name={item.icon} size={18} color="#2196F3" />
                  <Text style={styles.quickAddLabel}>{item.amount}ml</Text>
                  <Text style={styles.quickAddSub}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
      />

      <WeightHistoryModal
        visible={weightHistoryVisible}
        onClose={() => setWeightHistoryVisible(false)}
        weightLogs={weightLogs}
        onAddRecord={() => {
          setWeightHistoryVisible(false);
          setWeightModalVisible(true);
        }}
      />

      <WeightLogModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
        onSave={(w, d) => addWeightLog({ weight: w, date: d })}
        currentWeight={displayWeight}
        initialDate={selectedDate}
      />

      <WaterLogModal
        visible={waterModalVisible}
        onClose={() => setWaterModalVisible(false)}
        onSave={(amount) => addWaterLog(amount, selectedDate)}
      />

      <WaterSettingsModal
        visible={waterSettingsVisible}
        onClose={() => setWaterSettingsVisible(false)}
      />

      <ExerciseHistoryModal
        visible={exerciseHistoryVisible}
        onClose={() => setExerciseHistoryVisible(false)}
        exerciseLogs={exerciseLogs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  dateHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
    paddingHorizontal: 10,
  },
  headerColumn: { width: 50, alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerIconBtn: { padding: 10 },
  dateText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 15 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  mainInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  circleContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  remainingValue: { fontSize: 32, fontWeight: 'bold' },
  remainingLabel: { fontSize: 14, color: '#6C757D' },
  statsColumn: { flex: 1, marginLeft: 20 },
  statItem: { marginBottom: 8 },
  statSmallLabel: { fontSize: 14, color: '#495057' },
  section: { marginBottom: 20 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  mealCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mealInfo: { flexDirection: 'row', alignItems: 'center' },
  mealIcon: { fontSize: 24, marginRight: 15 },
  mealName: { fontSize: 18, fontWeight: '500' },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoCardVertical: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTitle: { fontSize: 18, fontWeight: 'bold' },
  infoSub: { fontSize: 14, color: '#6C757D', marginTop: 2 },
  bmiBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  bmiBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold'
  },
  bmiText: {
    color: '#ADB5BD',
    fontWeight: 'normal'
  },
  bmiTip: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic'
  },
  recordBtn: {
    borderWidth: 1.5,
    borderColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 22
  },
  recordText: { fontSize: 16, fontWeight: 'bold' },
  exerciseListStats: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
  },
  exerciseCountText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  progressBarBg: { height: 8, backgroundColor: '#E3F2FD', borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2196F3', borderRadius: 4 },
  quickAddRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAddBtn: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#F1F3F5'
  },
  quickAddLabel: { fontSize: 14, fontWeight: 'bold', color: '#2196F3', marginTop: 5 },
  quickAddSub: { fontSize: 10, color: '#999', marginTop: 2 },
});
