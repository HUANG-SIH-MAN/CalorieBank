import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SavedMeal } from '../types';
import { useAppContext } from '../context/AppContext';
import { getMealTypeByTime } from '../utils/time';

const NUTRITION_DECIMAL_FACTOR = 10;

function roundNutritionToOneDecimal(value: number): number {
  return Math.round(value * NUTRITION_DECIMAL_FACTOR) / NUTRITION_DECIMAL_FACTOR;
}

interface SavedMealsModalProps {
  visible: boolean;
  onClose: () => void;
  /** ISO date (YYYY-MM-DD) for new log entries from templates */
  targetDate: string;
}

export default function SavedMealsModal({ visible, onClose, targetDate }: SavedMealsModalProps) {
  const { savedMeals, addSavedMeal, updateSavedMeal, deleteSavedMeal, addFoodLog } = useAppContext();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [formName, setFormName] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');

  useEffect(() => {
    if (!visible) {
      setEditingId(null);
      setFormName('');
      setFormCalories('');
      setFormProtein('');
      setFormCarbs('');
      setFormFat('');
    }
  }, [visible]);

  const startNew = () => {
    setEditingId('new');
    setFormName('');
    setFormCalories('');
    setFormProtein('');
    setFormCarbs('');
    setFormFat('');
  };

  const startEdit = (meal: SavedMeal) => {
    setEditingId(meal.id);
    setFormName(meal.name);
    setFormCalories(meal.calories.toString());
    setFormProtein((meal.protein ?? 0).toString());
    setFormCarbs((meal.carbs ?? 0).toString());
    setFormFat((meal.fat ?? 0).toString());
  };

  const saveForm = () => {
    const name = formName.trim();
    const cal = parseInt(formCalories, 10);
    const p = roundNutritionToOneDecimal(parseFloat(formProtein) || 0);
    const c = roundNutritionToOneDecimal(parseFloat(formCarbs) || 0);
    const f = roundNutritionToOneDecimal(parseFloat(formFat) || 0);
    if (!name) {
      Alert.alert('請填寫', '請輸入名稱');
      return;
    }
    if (Number.isNaN(cal) || cal < 0) {
      Alert.alert('請填寫', '請輸入有效的熱量');
      return;
    }
    if (editingId === 'new') {
      addSavedMeal({ name, calories: cal, protein: p, carbs: c, fat: f });
      Alert.alert('成功', '已新增常用餐');
    } else if (editingId) {
      updateSavedMeal(editingId, { name, calories: cal, protein: p, carbs: c, fat: f });
      Alert.alert('成功', '已更新');
    }
    setEditingId(null);
  };

  const applyMeal = (meal: SavedMeal) => {
    addFoodLog({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      mealType: getMealTypeByTime(),
      date: targetDate,
    });
    Alert.alert('成功', `已加入 ${targetDate} 的飲食紀錄`);
  };

  const confirmDelete = (meal: SavedMeal) => {
    Alert.alert('刪除常用餐', `確定刪除「${meal.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => deleteSavedMeal(meal.id) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>常用餐／我的套餐</Text>
            <TouchableOpacity onPress={startNew} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="add-circle-outline" size={26} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {editingId !== null && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{editingId === 'new' ? '新增常用餐' : '編輯常用餐'}</Text>
                <Field label="名稱 *" value={formName} onChangeText={setFormName} />
                <Field label="熱量（kcal）*" value={formCalories} onChangeText={setFormCalories} numeric />
                <Field label="蛋白質（g）" value={formProtein} onChangeText={setFormProtein} numeric />
                <Field label="碳水（g）" value={formCarbs} onChangeText={setFormCarbs} numeric />
                <Field label="脂肪（g）" value={formFat} onChangeText={setFormFat} numeric />
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingId(null)}>
                    <Text style={styles.secondaryBtnText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={saveForm}>
                    <Text style={styles.primaryBtnText}>儲存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {savedMeals.length === 0 && editingId === null ? (
              <Text style={styles.empty}>尚無常用餐，點右上角 + 新增</Text>
            ) : (
              editingId === null &&
              savedMeals.map(meal => (
                <View key={meal.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowName} numberOfLines={2}>{meal.name}</Text>
                    <Text style={styles.rowSub}>
                      {meal.calories} kcal · P {meal.protein} / C {meal.carbs} / F {meal.fat}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => applyMeal(meal)} style={styles.iconBtn}>
                      <Ionicons name="add-circle" size={22} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startEdit(meal)} style={styles.iconBtn}>
                      <Ionicons name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(meal)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholderTextColor="#BBB"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#777', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  secondaryBtnText: { color: '#999', fontSize: 16 },
  primaryBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  rowMain: { flex: 1, marginRight: 8 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#333' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },
});
