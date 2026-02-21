import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import WeightLogModal from '../components/WeightLogModal';
import DatePickerModal from '../components/DatePickerModal';
import WeightHistoryModal from '../components/WeightHistoryModal';

export default function HomeScreen() {
  const { userProfile, foodLogs, weightLogs, addWeightLog } = useAppContext();
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightHistoryVisible, setWeightHistoryVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
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

  const currentFoodLogs = foodLogs.filter(log => log.date === selectedDate);
  const todayCalories = currentFoodLogs.reduce((sum, log) => sum + log.calories, 0);

  const dayWeightLog = weightLogs.find(log => log.date === selectedDate);
  const displayWeight = dayWeightLog ? dayWeightLog.weight : (userProfile?.weight || 0);

  const calorieGoal = userProfile?.dailyCalorieGoal || 1833;
  const remaining = calorieGoal - todayCalories;

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
                <Text style={styles.statSmallLabel}>🔥 運動: 0</Text>
              </View>
            </View>
          </View>
        </View>

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

        {/* Weight Tracking Card - Clickable for History */}
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
                <Text style={styles.infoTitle}>體重紀錄</Text>
                <Text style={styles.infoSub}>{displayWeight} kg</Text>
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
    boxShadow: '0px 2px 10px rgba(0,0,0,0.05)',
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
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
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
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTitle: { fontSize: 18, fontWeight: 'bold' },
  infoSub: { fontSize: 14, color: '#6C757D' },
  recordBtn: {
    borderWidth: 1.5,
    borderColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 22
  },
  recordText: { fontSize: 16, fontWeight: 'bold' },
});
