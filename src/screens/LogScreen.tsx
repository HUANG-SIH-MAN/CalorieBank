import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { EXERCISE_TYPES } from '../constants/exercises';
import DatePickerModal from '../components/DatePickerModal';
import ExerciseFavoriteModal from '../components/ExerciseFavoriteModal';

type TabType = 'DIET' | 'EXERCISE';

export default function LogScreen() {
  const { userProfile, exerciseLogs, addExerciseLog, deleteExerciseLog, foodLogs, deleteFoodLog } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('DIET');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);

  // Exercise states
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISE_TYPES[0].id);
  const [duration, setDuration] = useState('30');

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return '今天';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const allExerciseTypes = [
    ...EXERCISE_TYPES,
    ...(userProfile?.customExercises || [])
  ];

  const exerciseOptions = userProfile?.favoriteExerciseIds && userProfile.favoriteExerciseIds.length > 0
    ? allExerciseTypes.filter(type => userProfile.favoriteExerciseIds?.includes(type.id))
    : allExerciseTypes;

  const handleAddExercise = () => {
    const exercise = allExerciseTypes.find(e => e.id === selectedExerciseId);
    if (!exercise || !userProfile) return;

    const mins = parseFloat(duration);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('提示', '請輸入有效的運動時間');
      return;
    }

    const caloriesBurned = Math.round(exercise.met * userProfile.weight * (mins / 60));

    addExerciseLog({
      name: exercise.name,
      caloriesBurned,
      durationMinutes: mins,
      date: selectedDate,
      timestamp: new Date().toISOString(),
    });

    Alert.alert('成功', `已紀錄 ${exercise.name} ${mins} 分鐘，消耗 ${caloriesBurned} kcal`);
  };

  const renderDietTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.aiCard}>
        <View style={styles.aiIconWrapper}>
          <MaterialCommunityIcons name="camera-iris" size={40} color="#FFF" />
        </View>
        <View style={styles.aiTextContent}>
          <Text style={styles.aiTitle}>AI 拍照辨識食物</Text>
          <Text style={styles.aiDesc}>拍下你的餐點，讓 AI 為你分析內容與熱量</Text>
        </View>
        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="camera" size={24} color="#FFF" />
          <Text style={styles.cameraBtnText}>開始拍照</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{formatDateDisplay(selectedDate)} 飲食紀錄</Text>
      </View>

      {foodLogs.filter(log => log.date === selectedDate).map(log => (
        <View key={log.id} style={styles.logItem}>
          <View>
            <Text style={styles.logItemName}>{log.name}</Text>
            <Text style={styles.logItemSub}>{log.calories} kcal | 蛋白質 {log.protein}g</Text>
          </View>
          <TouchableOpacity onPress={() => deleteFoodLog(log.id)}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderExerciseTab = () => {
    const dayExercises = exerciseLogs.filter(log => log.date === selectedDate);
    const totalBurned = dayExercises.reduce((sum, log) => sum + log.caloriesBurned, 0);

    return (
      <View style={styles.tabContent}>
        <View style={styles.exerciseCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>新增運動項目</Text>
            <TouchableOpacity onPress={() => setFavoriteModalVisible(true)}>
              <Text style={styles.editBtnText}>編輯選單</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseList}>
            {exerciseOptions.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeIconBtn, selectedExerciseId === type.id && styles.activeTypeBtn]}
                onPress={() => setSelectedExerciseId(type.id)}
              >
                <FontAwesome5
                  name={type.icon}
                  size={24}
                  color={selectedExerciseId === type.id ? '#FFF' : '#555'}
                />
                <Text style={[styles.typeLabel, selectedExerciseId === type.id && styles.activeTypeLabel]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>運動時長 (分鐘)</Text>
            <View style={styles.durationInputWrapper}>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.unitText}>min</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise}>
            <Text style={styles.addBtnText}>加入紀錄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{formatDateDisplay(selectedDate)} 累計消耗: {totalBurned} kcal</Text>
        </View>

        {dayExercises.length > 0 ? (
          dayExercises.map(log => (
            <View key={log.id} style={styles.logItem}>
              <View>
                <Text style={styles.logItemName}>{log.name}</Text>
                <Text style={styles.logItemSub}>{log.durationMinutes} 分鐘 | {log.caloriesBurned} kcal</Text>
              </View>
              <TouchableOpacity onPress={() => deleteExerciseLog(log.id)}>
                <Ionicons name="trash-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>今天還沒記錄運動喔！</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.headerIconBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setDatePickerVisible(true)}
          style={styles.headerCenter}
        >
          <Text style={styles.headerTitle}>{formatDateDisplay(selectedDate)}</Text>
          <Ionicons name="calendar-outline" size={18} color="#007AFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeDate(1)} style={styles.headerIconBtn}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DIET' && styles.activeTab]}
          onPress={() => setActiveTab('DIET')}
        >
          <Text style={[styles.tabText, activeTab === 'DIET' && styles.activeTabText]}>飲食紀錄</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'EXERCISE' && styles.activeTab]}
          onPress={() => setActiveTab('EXERCISE')}
        >
          <Text style={[styles.tabText, activeTab === 'EXERCISE' && styles.activeTabText]}>運動紀錄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'DIET' ? renderDietTab() : renderExerciseTab()}
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
      />

      <ExerciseFavoriteModal
        visible={favoriteModalVisible}
        onClose={() => setFavoriteModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 5,
    margin: 15,
    borderRadius: 15,
    boxShadow: '0px 2px 5px rgba(0,0,0,0.05)',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  activeTabText: { color: '#FFF' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },
  tabContent: { flex: 1 },
  dateHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
    paddingHorizontal: 10,
  },
  headerIconBtn: { padding: 10 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  aiCard: {
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 8px 20px rgba(102, 187, 106, 0.3)',
  },
  aiIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  aiTextContent: { alignItems: 'center', marginBottom: 20 },
  aiTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  aiDesc: { fontSize: 14, color: '#E8F5E9', marginTop: 5, textAlign: 'center' },
  cameraBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cameraBtnText: { color: '#66BB6A', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editBtnText: { color: '#007AFF', fontWeight: 'bold' },
  exerciseList: { marginBottom: 20 },
  typeIconBtn: {
    width: 80,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  activeTypeBtn: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeLabel: { marginTop: 8, fontSize: 12, color: '#333' },
  activeTypeLabel: { color: '#FFF', fontWeight: 'bold' },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20
  },
  durationLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
  durationInputWrapper: { flexDirection: 'row', alignItems: 'center' },
  durationInput: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', textAlign: 'right', minWidth: 40 },
  unitText: { fontSize: 14, color: '#999', marginLeft: 5 },
  addBtn: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center'
  },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  logItemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logItemSub: { fontSize: 14, color: '#999', marginTop: 2 },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});
