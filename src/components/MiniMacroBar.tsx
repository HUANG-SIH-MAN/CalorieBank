import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface MiniMacroBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
}

/**
 * 與紀錄頁飲食項目相同：標籤、克數、對照 goal 的比例條。
 */
export default function MiniMacroBar({ label, value, goal, color }: MiniMacroBarProps) {
  const safeGoal = goal > 0 ? goal : 1;
  const progress = Math.min(Math.max(0, isFinite(value / safeGoal) ? value / safeGoal : 0), 1);

  return (
    <View style={styles.miniMacroItem}>
      <View style={styles.miniMacroHeader}>
        <Text style={styles.miniMacroLabel}>{label}</Text>
        <Text style={styles.miniMacroPercent}>{Math.round(value)}g</Text>
      </View>
      <View style={styles.miniBarBg}>
        <View style={[styles.miniBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  miniMacroItem: { flex: 1 },
  miniMacroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  miniMacroLabel: { fontSize: 11, color: '#333', fontWeight: 'bold' },
  miniMacroPercent: { fontSize: 10, color: '#AEAEB2' },
  miniBarBg: { height: 3, backgroundColor: '#F2F2F7', borderRadius: 1.5, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 1.5 },
});
