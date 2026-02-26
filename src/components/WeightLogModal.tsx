import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DatePickerModal from './DatePickerModal';

interface WeightLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, date: string, bodyFatPercent?: number) => void;
  currentWeight?: number;
  initialDate: string;
  /** 帶入最近一筆體脂率，沒有則不填（可手動填 0） */
  initialBodyFatPercent?: number;
}

export default function WeightLogModal({
  visible,
  onClose,
  onSave,
  currentWeight,
  initialDate,
  initialBodyFatPercent,
}: WeightLogModalProps) {
  const [weight, setWeight] = useState(currentWeight?.toString() || '');
  const [bodyFatPercent, setBodyFatPercent] = useState('');
  const [logDate, setLogDate] = useState(initialDate);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Sync date if initialDate changes from outside
  React.useEffect(() => {
    setLogDate(initialDate);
  }, [initialDate]);

  // 開啟時帶入最近體脂；沒有則留空（可手動填 0）
  React.useEffect(() => {
    if (visible) {
      setWeight(currentWeight != null && currentWeight > 0 ? String(currentWeight) : '');
      setBodyFatPercent(
        initialBodyFatPercent != null ? String(initialBodyFatPercent) : ''
      );
    }
  }, [visible, currentWeight, initialBodyFatPercent]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleSave = () => {
    const w = parseFloat(weight);
    if (!isNaN(w) && w > 0) {
      const parsedBodyFat =
        bodyFatPercent.trim() === ''
          ? undefined
          : parseFloat(bodyFatPercent);
      const bodyFatValue =
        parsedBodyFat != null && !Number.isNaN(parsedBodyFat) ? parsedBodyFat : undefined;
      onSave(w, logDate, bodyFatValue);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>記錄體重</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={[styles.saveText, weight ? { color: '#66BB6A' } : {}]}>保存</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>體重</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor="#CCC"
                autoFocus
              />
              <Text style={styles.unitText}>千克</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>體脂率（選填）</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={bodyFatPercent}
                onChangeText={(t) => setBodyFatPercent(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#CCC"
              />
              <Text style={styles.unitText}>%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.rowLabel}>日期</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.dateValue}>{formatDateLabel(logDate)}</Text>
              <Ionicons name="chevron-forward" size={18} color="#66BB6A" style={{ marginLeft: 5 }} />
            </View>
          </TouchableOpacity>
        </View>

        <DatePickerModal
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={setLogDate}
          selectedDate={logDate}
        />
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
  headerBtn: { minWidth: 60, padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  saveText: { fontSize: 18, color: '#999', textAlign: 'right', fontWeight: 'bold' },
  content: { marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  rowLabel: { fontSize: 18, color: '#333' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { fontSize: 18, color: '#333', textAlign: 'right', marginRight: 10, minWidth: 80 },
  unitText: { fontSize: 18, color: '#66BB6A' },
  dateValue: { fontSize: 18, color: '#66BB6A' },
});
