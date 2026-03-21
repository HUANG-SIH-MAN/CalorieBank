import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLog } from '../types';

export interface FoodLogActionSheetProps {
  visible: boolean;
  log: FoodLog | null;
  onClose: () => void;
  onCopyToToday: (log: FoodLog) => void;
  onPickOtherDate: (log: FoodLog) => void;
  onAddToSavedMeals: (log: FoodLog) => void;
}

export default function FoodLogActionSheet({
  visible,
  log,
  onClose,
  onCopyToToday,
  onPickOtherDate,
  onAddToSavedMeals,
}: FoodLogActionSheetProps) {
  const open = visible && log != null;

  const run = (fn: (l: FoodLog) => void) => {
    if (!log) return;
    fn(log);
    onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="關閉選單" />

        {log ? (
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.title} numberOfLines={2}>
              {log.name}
            </Text>
            <Text style={styles.subtitle}>餐點操作</Text>

            <TouchableOpacity
              style={styles.row}
              onPress={() => run(onCopyToToday)}
              activeOpacity={0.65}
            >
              <Ionicons name="today-outline" size={22} color="#333" />
              <Text style={styles.rowText}>複製到今天</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => run(onPickOtherDate)}
              activeOpacity={0.65}
            >
              <Ionicons name="calendar-outline" size={22} color="#333" />
              <Text style={styles.rowText}>複製到其他日期…</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => run(onAddToSavedMeals)}
              activeOpacity={0.65}
            >
              <Ionicons name="restaurant-outline" size={22} color="#4CAF50" />
              <Text style={[styles.rowText, styles.rowTextAccent]}>加入常用餐</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.65}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '55%',
    zIndex: 1,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
    gap: 12,
  },
  rowText: { flex: 1, fontSize: 16, color: '#333' },
  rowTextAccent: { color: '#2E7D32', fontWeight: '600' },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
});
