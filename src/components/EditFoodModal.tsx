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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FoodLog } from '../types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../utils/time';
import DatePickerModal from './DatePickerModal';

interface EditFoodModalProps {
  visible: boolean;
  log: FoodLog | null;
  onClose: () => void;
  onSave: (updated: FoodLog) => void;
}

export default function EditFoodModal({ visible, log, onClose, onSave }: EditFoodModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<FoodLog['mealType']>('LUNCH');
  const [date, setDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    if (log) {
      setName(log.name);
      setCalories(log.calories.toString());
      setProtein((log.protein ?? 0).toString());
      setCarbs((log.carbs ?? 0).toString());
      setFat((log.fat ?? 0).toString());
      setMealType(log.mealType);
      setDate(log.date);
    }
  }, [log]);

  const handleSave = () => {
    if (!log) return;
    const caloriesNum = parseInt(calories, 10);
    const proteinNum = parseInt(protein, 10) || 0;
    const carbsNum = parseInt(carbs, 10) || 0;
    const fatNum = parseInt(fat, 10) || 0;
    if (!name.trim()) {
      Alert.alert('請填寫', '請輸入食物名稱');
      return;
    }
    if (Number.isNaN(caloriesNum) || caloriesNum < 0) {
      Alert.alert('請填寫', '請輸入有效的熱量');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('請填寫', '請輸入有效日期（YYYY-MM-DD）');
      return;
    }
    onSave({
      ...log,
      name: name.trim(),
      calories: caloriesNum,
      protein: proteinNum,
      carbs: carbsNum,
      fat: fatNum,
      mealType,
      date,
    });
    onClose();
  };

  if (!log) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>編輯飲食紀錄</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>食物名稱</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：雞腿便當"
                placeholderTextColor="#BBB"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>熱量（kcal）</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#BBB"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>蛋白質（g）</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#BBB"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>碳水化合物（g）</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#BBB"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>脂肪（g）</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#BBB"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>日期</Text>
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setDatePickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateTouchableText, !date && styles.datePlaceholder]}>
                  {date || '點擊選擇日期'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>用餐時段</Text>
              <View style={styles.mealTypeRow}>
                {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.mealTypeBtn, mealType === type && styles.mealTypeBtnActive]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={styles.mealTypeIcon}>{MEAL_TYPE_ICONS[type]}</Text>
                    <Text style={[styles.mealTypeLabel, mealType === type && styles.mealTypeLabelActive]}>
                      {MEAL_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>儲存</Text>
          </TouchableOpacity>
        </ScrollView>

        <DatePickerModal
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={(selectedDate) => {
            setDate(selectedDate);
            setDatePickerVisible(false);
          }}
          selectedDate={date || new Date().toISOString().split('T')[0]}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  dateTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  dateTouchableText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    color: '#BBB',
  },
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  mealTypeBtnActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  mealTypeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  mealTypeLabel: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeLabelActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
