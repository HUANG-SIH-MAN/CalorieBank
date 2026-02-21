import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePickerModal from './DatePickerModal';

interface WeightLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, date: string) => void;
  currentWeight?: number;
  initialDate: string;
}

export default function WeightLogModal({ visible, onClose, onSave, currentWeight, initialDate }: WeightLogModalProps) {
  const [weight, setWeight] = useState(currentWeight?.toString() || '');
  const [logDate, setLogDate] = useState(initialDate);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Sync date if initialDate changes from outside
  React.useEffect(() => {
    setLogDate(initialDate);
  }, [initialDate]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleSave = () => {
    const w = parseFloat(weight);
    if (!isNaN(w) && w > 0) {
      onSave(w, logDate);
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
