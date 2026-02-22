import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface WaterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WaterSettingsModal({ visible, onClose }: WaterSettingsModalProps) {
  const { userProfile, setUserProfile } = useAppContext();

  // Local state initialized with current profile values or defaults
  const [small, setSmall] = useState(userProfile?.waterContainers?.small?.toString() || '250');
  const [medium, setMedium] = useState(userProfile?.waterContainers?.medium?.toString() || '500');
  const [large, setLarge] = useState(userProfile?.waterContainers?.large?.toString() || '1000');
  const [customGoal, setCustomGoal] = useState(userProfile?.waterGoal?.toString() || '');

  const calculatedGoal = Math.round((userProfile?.weight || 70) * 35);

  const handleSave = () => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        waterGoal: customGoal ? parseInt(customGoal) : undefined,
        waterContainers: {
          small: parseInt(small) || 250,
          medium: parseInt(medium) || 500,
          large: parseInt(large) || 1000,
        }
      });
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>飲水設定</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Text style={styles.saveText}>儲存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>每日目標</Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>自定義目標 (ml)</Text>
                <TextInput
                  style={styles.input}
                  value={customGoal}
                  onChangeText={setCustomGoal}
                  placeholder={`${calculatedGoal} (自動計算)`}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.hint}>
                * 預設目標根據您的體重 ({userProfile?.weight}kg × 35ml) 計算為 {calculatedGoal}ml
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>快捷容器容量 (ml)</Text>

              <View style={styles.inputRow}>
                <View style={styles.iconLabel}>
                  <FontAwesome5 name="glass-whiskey" size={18} color="#2196F3" />
                  <Text style={styles.label}> 小玻璃杯</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={small}
                  onChangeText={setSmall}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.iconLabel}>
                  <FontAwesome5 name="prescription-bottle" size={18} color="#2196F3" />
                  <Text style={styles.label}> 環保瓶</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={medium}
                  onChangeText={setMedium}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.iconLabel}>
                  <FontAwesome5 name="bitbucket" size={18} color="#2196F3" />
                  <Text style={styles.label}> 健身大水壺</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={large}
                  onChangeText={setLarge}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '70%',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerBtn: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  cancelText: { color: '#666', fontSize: 16 },
  saveText: { color: '#2196F3', fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, color: '#495057' },
  input: { fontSize: 16, fontWeight: 'bold', color: '#2196F3', textAlign: 'right', flex: 1 },
  hint: { fontSize: 12, color: '#999', marginTop: 5, fontStyle: 'italic' },
});
