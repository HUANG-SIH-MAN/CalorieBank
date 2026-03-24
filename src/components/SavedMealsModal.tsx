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
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SavedMeal } from '../types';
import { useAppContext } from '../context/AppContext';
import { getMealTypeByTime } from '../utils/time';
import { calculateMacroGoals } from '../utils/fitness';
import MiniMacroBar from './MiniMacroBar';

const NUTRITION_DECIMAL_FACTOR = 10;

/** Compact action icons; hitSlop keeps taps easy without wide layout boxes. */
const SAVED_MEAL_ACTION_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 } as const;
const SAVED_MEAL_ACTION_ICON_PADDING_H = 1;
const SAVED_MEAL_ACTION_ICON_PADDING_V = 6;
/** Space between + / edit / delete; compact but not touching. */
const SAVED_MEAL_ACTION_ROW_GAP = 9;
const SAVED_MEAL_ACTION_ICON_SIZE_ADD = 22;
const SAVED_MEAL_ACTION_ICON_SIZE_EDIT = 20;
const SAVED_MEAL_ACTION_ICON_SIZE_DELETE = 20;

const MODAL_SCROLL_BASE_PADDING_BOTTOM = 24;

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userProfile, savedMeals, addSavedMeal, updateSavedMeal, deleteSavedMeal, addFoodLog } = useAppContext();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [formName, setFormName] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');
  const [mealPendingDelete, setMealPendingDelete] = useState<SavedMeal | null>(null);

  const calorieGoal = userProfile?.dailyCalorieGoal ?? 1833;
  const macroGoals = calculateMacroGoals(
    calorieGoal,
    userProfile?.weight ?? 70,
    userProfile?.goalWeight ?? 70
  );

  useEffect(() => {
    if (!visible) {
      setEditingId(null);
      setFormName('');
      setFormCalories('');
      setFormProtein('');
      setFormCarbs('');
      setFormFat('');
      setMealPendingDelete(null);
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

  const applyMealToLog = (meal: SavedMeal) => {
    addFoodLog({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      mealType: getMealTypeByTime(),
      date: targetDate,
    });
    onClose();
    (navigation as { navigate: (name: string, params?: object) => void }).navigate('紀錄', {
      openDietTab: true,
    });
  };

  const confirmDelete = () => {
    if (!mealPendingDelete) return;
    deleteSavedMeal(mealPendingDelete.id);
    setMealPendingDelete(null);
  };

  return (
    <>
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
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: MODAL_SCROLL_BASE_PADDING_BOTTOM + insets.bottom },
              ]}
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
                  <View key={meal.id} style={styles.dietLogItem}>
                    <View style={styles.dietLogContent}>
                      <View style={styles.logItemTitleBlock}>
                        <Text style={styles.logItemName} numberOfLines={2}>
                          {meal.name}
                        </Text>
                        <Text style={styles.logItemCalories}>{meal.calories} kcal</Text>
                      </View>
                      <View style={styles.miniMacroContainer}>
                        <MiniMacroBar
                          label="蛋白質"
                          value={meal.protein || 0}
                          goal={macroGoals.protein}
                          color="#FF7043"
                        />
                        <MiniMacroBar
                          label="碳水"
                          value={meal.carbs || 0}
                          goal={macroGoals.carbs}
                          color="#4CAF50"
                        />
                        <MiniMacroBar
                          label="脂肪"
                          value={meal.fat || 0}
                          goal={macroGoals.fat}
                          color="#FBC02D"
                        />
                      </View>
                    </View>
                    <View style={styles.dietLogActions}>
                      <TouchableOpacity
                        onPress={() => applyMealToLog(meal)}
                        style={styles.iconBtn}
                        hitSlop={SAVED_MEAL_ACTION_HIT_SLOP}
                      >
                        <Ionicons name="add-circle" size={SAVED_MEAL_ACTION_ICON_SIZE_ADD} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => startEdit(meal)}
                        style={styles.iconBtn}
                        hitSlop={SAVED_MEAL_ACTION_HIT_SLOP}
                      >
                        <Ionicons name="pencil" size={SAVED_MEAL_ACTION_ICON_SIZE_EDIT} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setMealPendingDelete(meal)}
                        style={styles.iconBtn}
                        hitSlop={SAVED_MEAL_ACTION_HIT_SLOP}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={SAVED_MEAL_ACTION_ICON_SIZE_DELETE}
                          color="#999"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={mealPendingDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMealPendingDelete(null)}
      >
        <View style={styles.deleteOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMealPendingDelete(null)} />
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>刪除常用餐？</Text>
            <Text style={styles.deleteBody} numberOfLines={2}>
              {mealPendingDelete?.name ?? ''}
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setMealPendingDelete(null)}>
                <Text style={styles.deleteCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Text style={styles.deleteConfirmText}>刪除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  scrollContent: { padding: 16 },
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
  dietLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  dietLogContent: { flex: 1, marginRight: 4, minWidth: 0 },
  logItemTitleBlock: {
    marginBottom: 12,
  },
  logItemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  logItemCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  miniMacroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  dietLogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: SAVED_MEAL_ACTION_ROW_GAP,
  },
  iconBtn: {
    paddingHorizontal: SAVED_MEAL_ACTION_ICON_PADDING_H,
    paddingVertical: SAVED_MEAL_ACTION_ICON_PADDING_V,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  deleteTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  deleteBody: { fontSize: 15, color: '#666', marginBottom: 20 },
  deleteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  deleteCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  deleteCancelText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  deleteConfirmBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  deleteConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
