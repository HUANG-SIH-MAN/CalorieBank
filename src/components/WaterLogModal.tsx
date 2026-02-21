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

interface WaterLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
}

export default function WaterLogModal({ visible, onClose, onSave }: WaterLogModalProps) {
  const [amount, setAmount] = useState('');

  const handleSave = () => {
    const a = parseInt(amount);
    if (!isNaN(a) && a > 0) {
      onSave(a);
      setAmount('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>填寫飲水量</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={[styles.saveText, amount ? { color: '#66BB6A' } : {}]}>確認</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="0"
              autoFocus
            />
            <Text style={styles.unit}>ml</Text>
          </View>

          <Text style={styles.hint}>輸入您剛才攝取的飲水量</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerBtn: { width: 60, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveText: { fontSize: 18, color: '#999', fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', paddingTop: 60 },
  inputContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  input: { fontSize: 60, fontWeight: 'bold', color: '#007AFF', textAlign: 'center' },
  unit: { fontSize: 24, color: '#333', marginLeft: 10 },
  hint: { fontSize: 16, color: '#999' },
});
