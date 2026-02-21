import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAppContext } from '../context/AppContext';
import WeightLogModal from '../components/WeightLogModal';
import DatePickerModal from '../components/DatePickerModal';
import WeightHistoryModal from '../components/WeightHistoryModal';
import WaterLogModal from '../components/WaterLogModal';
import WaterSettingsModal from '../components/WaterSettingsModal';
import ExerciseHistoryModal from '../components/ExerciseHistoryModal';
import { calculateMacroGoals } from '../utils/fitness';

export default function HomeScreen() {
  const { userProfile, foodLogs, weightLogs, waterLogs, exerciseLogs, addWeightLog, addWaterLog } = useAppContext();
  // ... existing states ...
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

  const calorieGoal = userProfile?.dailyCalorieGoal || 1833;
  const macroGoals = calculateMacroGoals(
    calorieGoal,
    userProfile?.weight || 70,
    userProfile?.goalWeight || 70
  );

  const todayProtein = currentFoodLogs.reduce((s, l) => s + (l.protein || 0), 0);
  const todayCarbs = currentFoodLogs.reduce((s, l) => s + (l.carbs || 0), 0);
  const todayFat = currentFoodLogs.reduce((s, l) => s + (l.fat || 0), 0);

  const currentExerciseLogs = exerciseLogs.filter(log => log.date === selectedDate);
  const todayExerciseCalories = currentExerciseLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const todayExerciseDuration = currentExerciseLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

  // Calculate Water Goal: Profile custom goal OR weight * 35
  const baseWaterGoal = userProfile?.waterGoal || Math.round((userProfile?.weight || 70) * 35);
  // Exercise bonus water: every 30 min of exercise = +200ml
  const exerciseBonusWater = Math.round((todayExerciseDuration / 30) * 200);
  const waterGoal = baseWaterGoal + exerciseBonusWater;
  const waterProgress = Math.min(todayWater / waterGoal, 1);

  // Container sizes from profile or defaults
  const containers = userProfile?.waterContainers || { small: 250, medium: 500, large: 1000 };

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
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>卡路里</Text>
            <TouchableOpacity style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                {userProfile?.goalWeight && userProfile?.weight
                  ? (userProfile.goalWeight < userProfile.weight ? '減重' : '增肌')
                  : '維持'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.formulaText}>還能吃 = 推薦攝入量 - 飲食 + 運動</Text>

          <View style={styles.mainInfo}>
            <View style={styles.circleWrapper}>
              <CalorieCircle
                goal={calorieGoal}
                consumed={todayCalories}
                exercise={todayExerciseCalories}
                remaining={remaining}
              />
            </View>

            <View style={styles.statsColumn}>
              <View style={styles.statLine}>
                <Ionicons name="trophy-outline" size={18} color="#FFD700" style={styles.statIcon} />
                <View>
                  <Text style={styles.statLabel}>推薦攝入量</Text>
                  <Text style={styles.statValue}>{calorieGoal}</Text>
                </View>
              </View>
              <View style={styles.statLine}>
                <Ionicons name="fast-food-outline" size={18} color="#2196F3" style={styles.statIcon} />
                <View>
                  <Text style={styles.statLabel}>飲食</Text>
                  <Text style={styles.statValue}>{todayCalories}</Text>
                </View>
              </View>
              <View style={styles.statLine}>
                <Ionicons name="flame-outline" size={18} color="#FF5722" style={styles.statIcon} />
                <View>
                  <Text style={styles.statLabel}>運動</Text>
                  <Text style={styles.statValue}>{todayExerciseCalories}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Diet Log Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🥗 飲食紀錄</Text>
          </View>
          <View style={styles.dietCard}>
            {/* Macro Progress Bars */}
            <View style={styles.macroProgressContainer}>
              <MacroProgress
                label="蛋白質"
                current={todayProtein}
                target={macroGoals.protein}
                color="#FF7043"
              />
              <MacroProgress
                label="碳水"
                current={todayCarbs}
                target={macroGoals.carbs}
                color="#4CAF50"
              />
              <MacroProgress
                label="脂肪"
                current={todayFat}
                target={macroGoals.fat}
                color="#FBC02D"
              />
            </View>

            {currentFoodLogs.length === 0 ? (
              <View style={styles.emptyDiet}>
                <Text style={styles.emptyDietIcon}>🍽️</Text>
                <Text style={styles.emptyDietText}>今天還沒有飲食紀錄</Text>
                <Text style={styles.emptyDietSub}>前往「紀錄」頁面新增飲食</Text>
              </View>
            ) : (
              currentFoodLogs.map((log, idx) => (
                <View key={idx} style={styles.foodLogItem}>
                  <View style={styles.foodLogLeft}>
                    <Text style={styles.foodLogName} numberOfLines={1}>{log.name}</Text>
                    <Text style={styles.foodLogMacro}>
                      {log.protein ? `蛋白 ${log.protein.toFixed(0)}g` : ''}
                      {log.carbs ? `  碳水 ${log.carbs.toFixed(0)}g` : ''}
                      {log.fat ? `  脂肪 ${log.fat.toFixed(0)}g` : ''}
                    </Text>
                  </View>
                  <Text style={styles.foodLogCalories}>{log.calories} kcal</Text>
                </View>
              ))
            )}
          </View>
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
                  {exerciseBonusWater > 0 && (
                    <Text style={styles.exerciseBonusNote}>
                      🏃 運動 {todayExerciseDuration} 分鐘，加碼 +{exerciseBonusWater} ml
                    </Text>
                  )}
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

            {/* Progress Bar + Status */}
            {(() => {
              const remaining = Math.max(0, waterGoal - todayWater);
              return (
                <View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${waterProgress * 100}%` }]} />
                  </View>
                  <View style={styles.waterStatusRow}>
                    {waterProgress >= 1 ? (
                      <Text style={styles.waterCompleteText}>🎉 今日飲水達標！</Text>
                    ) : (
                      <Text style={styles.waterRemainingText}>
                        還差 <Text style={styles.waterRemainingBold}>{remaining} ml</Text> 達標
                      </Text>
                    )}
                    <Text style={styles.waterPercentText}>{Math.round(waterProgress * 100)}%</Text>
                  </View>
                </View>
              );
            })()}

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
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalBadgeText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginRight: 2,
  },
  formulaText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsColumn: {
    gap: 15,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  statIcon: {
    marginRight: 10,
    width: 24,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
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
  dietCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  nutritionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
    marginBottom: 12,
  },
  nutritionSummaryItem: { alignItems: 'center', flex: 1 },
  nutritionSummaryValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  nutritionSummaryLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  nutritionDivider: { width: 0.5, height: 32, backgroundColor: '#EEE' },
  emptyDiet: { alignItems: 'center', paddingVertical: 24 },
  emptyDietIcon: { fontSize: 36, marginBottom: 8 },
  emptyDietText: { fontSize: 15, color: '#555', fontWeight: '500' },
  emptyDietSub: { fontSize: 12, color: '#999', marginTop: 4 },
  foodLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  foodLogLeft: { flex: 1, marginRight: 10 },
  foodLogName: { fontSize: 15, color: '#333', fontWeight: '500' },
  foodLogMacro: { fontSize: 11, color: '#999', marginTop: 3 },
  foodLogCalories: { fontSize: 15, fontWeight: 'bold', color: '#FF7043' },
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
  segmentRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  segmentFilled: { backgroundColor: '#2196F3' },
  segmentEmpty: { backgroundColor: '#E0E0E0' },
  waterStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  waterRemainingText: { fontSize: 13, color: '#999' },
  waterRemainingBold: { fontSize: 13, color: '#2196F3', fontWeight: 'bold' },
  waterCompleteText: { fontSize: 13, color: '#4CAF50', fontWeight: 'bold' },
  waterPercentText: { fontSize: 13, color: '#2196F3', fontWeight: 'bold' },
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
  exerciseBonusNote: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 3,
    fontStyle: 'italic',
  },
  // Macro Progress
  macroProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
    marginBottom: 12,
    gap: 15,
  },
  macroItem: { flex: 1 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  macroLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  macroValue: { fontSize: 11, color: '#999' },
  macroBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
});

function MacroProgress({ label, current, target, color }: { label: string, current: number, target: number, color: string }) {
  const progress = Math.min(current / target, 1);
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{Math.round(current)} / {target}g</Text>
      </View>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CalorieCircle({ goal, consumed, exercise, remaining }: { goal: number, consumed: number, exercise: number, remaining: number }) {
  const radius = 85;
  const stroke = 12;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;

  const total = goal + exercise;
  const remainingRatio = Math.max(remaining / total, 0);

  // Colors per user request
  const blueColor = "#2196F3";
  const greyColor = "#E5E5EA";

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={radius * 2} width={radius * 2} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Step 1: Base Circle - Grey (The consumed/empty part as background) */}
        <Circle
          stroke={greyColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Step 2: Overlay Circle - Blue (The "Remaining" part) starting from 12 o'clock */}
        <Circle
          stroke={blueColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${remainingRatio * circumference} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: 'bold', color: '#1C1C1E' }}>{remaining}</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>還能吃</Text>
      </View>
    </View>
  );
}
