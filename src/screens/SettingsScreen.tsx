import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { ACTIVITY_LEVELS, WEIGHT_SPEEDS } from '../constants/fitness';
import { calculateDailyCalorieGoal } from '../utils/fitness';
import { UserProfile } from '../types';
import { validateGeminiKey } from '../services/geminiService';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY = 'gemini_api_key';

const getStoredKey = async () => {
  if (Platform.OS === 'web') return (global as any).__geminiKey || '';
  return (await SecureStore.getItemAsync(SECURE_KEY)) || '';
};
const saveStoredKey = async (key: string) => {
  if (Platform.OS === 'web') { (global as any).__geminiKey = key; return; }
  await SecureStore.setItemAsync(SECURE_KEY, key);
};
const deleteStoredKey = async () => {
  if (Platform.OS === 'web') { (global as any).__geminiKey = ''; return; }
  await SecureStore.deleteItemAsync(SECURE_KEY);
};

export default function SettingsScreen() {
  const { userProfile, setUserProfile } = useAppContext();

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);

  // API Key
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyEditMode, setKeyEditMode] = useState(false);

  useEffect(() => {
    getStoredKey().then(k => {
      setApiKey(k);
      setApiKeyInput(k);
    });
  }, []);

  const handleSaveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      Alert.alert('提示', '請輸入 API Key');
      return;
    }
    await saveStoredKey(trimmed);
    setApiKey(trimmed);
    setKeyEditMode(false);
    Alert.alert('已儲存', 'Gemini API Key 已安全儲存在裝置上');
  };

  const handleTestKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) { Alert.alert('提示', '請先輸入 API Key'); return; }
    setKeyTesting(true);
    try {
      await validateGeminiKey(trimmed);
      Alert.alert('✅ 連線成功', 'API Key 有效，可以開始使用 AI 辨識功能！');
    } catch (e: any) {
      Alert.alert('❌ 連線失敗', e.message || 'API Key 無效，請確認後重試');
    } finally {
      setKeyTesting(false);
    }
  };

  const handleDeleteKey = () => {
    Alert.alert('刪除 API Key', '確定要刪除已儲存的 API Key 嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive', onPress: async () => {
          await deleteStoredKey();
          setApiKey('');
          setApiKeyInput('');
          setKeyEditMode(false);
        }
      },
    ]);
  };

  const startEditing = () => {
    setEditProfile(userProfile);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editProfile) {
      // Recalculate calorie goal
      const newGoal = calculateDailyCalorieGoal({
        gender: editProfile.gender,
        weight: editProfile.weight,
        height: editProfile.height,
        age: editProfile.age,
        activityLevel: editProfile.activityLevel,
        goalWeight: editProfile.goalWeight,
        speedId: editProfile.weightChangeSpeed || 'STEADY',
      });

      const updatedProfile = { ...editProfile, dailyCalorieGoal: newGoal };
      setUserProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('成功', '您的個人資訊已更新，卡路里目標也已同步調整。');
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    if (editProfile) {
      setEditProfile({ ...editProfile, [field]: value });
    }
  };

  if (!userProfile) return null;

  const currentGender = isEditing ? editProfile?.gender : userProfile.gender;
  const currentActivity = isEditing ? editProfile?.activityLevel : userProfile.activityLevel;
  const currentSpeed = isEditing ? (editProfile?.weightChangeSpeed || 'STEADY') : (userProfile.weightChangeSpeed || 'STEADY');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtnText}>儲存</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startEditing}>
            <Text style={styles.editBtnText}>編輯</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileSummary}>
          <View style={[styles.avatar, { backgroundColor: userProfile.gender === 'MALE' ? '#007AFF' : '#FF2D55' }]}>
            <Ionicons
              name={userProfile.gender === 'MALE' ? 'male' : 'female'}
              size={40}
              color="#FFF"
            />
          </View>
          <Text style={styles.profileName}>我的健康檔案</Text>
          <Text style={styles.profileSub}>更新於今日</Text>
        </View>

        {/* Section: Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資料</Text>
          <View style={styles.card}>
            {/* Gender Selection */}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>性別</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  disabled={!isEditing}
                  style={[
                    styles.genderOption,
                    currentGender === 'MALE' && styles.maleActive,
                    !isEditing && currentGender !== 'MALE' && { opacity: 0.3 }
                  ]}
                  onPress={() => updateField('gender', 'MALE')}
                >
                  <Ionicons name="male" size={18} color={currentGender === 'MALE' ? '#FFF' : '#007AFF'} />
                  <Text style={[styles.genderText, currentGender === 'MALE' && { color: '#FFF' }]}>男</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!isEditing}
                  style={[
                    styles.genderOption,
                    currentGender === 'FEMALE' && styles.femaleActive,
                    !isEditing && currentGender !== 'FEMALE' && { opacity: 0.3 }
                  ]}
                  onPress={() => updateField('gender', 'FEMALE')}
                >
                  <Ionicons name="female" size={18} color={currentGender === 'FEMALE' ? '#FFF' : '#FF2D55'} />
                  <Text style={[styles.genderText, currentGender === 'FEMALE' && { color: '#FFF' }]}>女</Text>
                </TouchableOpacity>
              </View>
            </View>

            <SettingInput
              label="年齡"
              value={isEditing ? editProfile?.age.toString() : userProfile.age.toString()}
              unit="歲"
              isEditing={isEditing}
              onChangeText={(v: string) => updateField('age', parseInt(v) || 0)}
            />
            <SettingInput
              label="身高"
              value={isEditing ? editProfile?.height.toString() : userProfile.height.toString()}
              unit="cm"
              isEditing={isEditing}
              onChangeText={(v: string) => updateField('height', parseFloat(v) || 0)}
            />
            <SettingInput
              label="目前體重"
              value={isEditing ? editProfile?.weight.toString() : userProfile.weight.toString()}
              unit="kg"
              isEditing={isEditing}
              onChangeText={(v: string) => updateField('weight', parseFloat(v) || 0)}
            />
          </View>
        </View>

        {/* Section: Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日常生活活動量</Text>
          <View style={isEditing ? styles.optionsList : styles.card}>
            {isEditing ? (
              ACTIVITY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.optionCard, currentActivity === level.id && styles.activeCard]}
                  onPress={() => updateField('activityLevel', level.id)}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionLabel}>{level.label}</Text>
                    {currentActivity === level.id && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                  </View>
                  <Text style={styles.optionDesc}>{level.desc}</Text>
                  <Text style={styles.optionDetail}>{level.detail}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>活動等級</Text>
                <Text style={styles.itemValue}>
                  {ACTIVITY_LEVELS.find(l => l.id === userProfile.activityLevel)?.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section: Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>目標計畫</Text>
          <View style={styles.card}>
            <SettingInput
              label="目標體重"
              value={isEditing ? editProfile?.goalWeight.toString() : userProfile.goalWeight.toString()}
              unit="kg"
              isEditing={isEditing}
              onChangeText={(v: string) => updateField('goalWeight', parseFloat(v) || 0)}
            />
            <SettingInput
              label="每日步數目標"
              value={isEditing ? (editProfile?.stepGoal || 10000).toString() : (userProfile.stepGoal || 10000).toString()}
              unit="步"
              isEditing={isEditing}
              onChangeText={(v: string) => updateField('stepGoal', parseInt(v) || 0)}
            />

            {isEditing ? (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedTitle}>增減速度</Text>
                {WEIGHT_SPEEDS.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.optionCard, currentSpeed === s.id && styles.activeCard]}
                    onPress={() => updateField('weightChangeSpeed', s.id)}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionLabel}>{s.label}</Text>
                      {currentSpeed === s.id && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                    </View>
                    <Text style={styles.optionDesc}>{s.desc}</Text>
                    <Text style={styles.optionDetail}>{s.detail}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>增減速度</Text>
                <Text style={styles.itemValue}>
                  {WEIGHT_SPEEDS.find(s => s.id === (userProfile.weightChangeSpeed || 'STEADY'))?.label}
                </Text>
              </View>
            )}

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>每日卡路里目標</Text>
              <Text style={[styles.itemValue, { color: '#007AFF', fontWeight: 'bold' }]}>
                {isEditing ? '儲存後重新計算' : `${userProfile.dailyCalorieGoal} kcal`}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: AI Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 辨識設定</Text>
          <View style={styles.card}>
            <View style={styles.apiKeyHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="robot-outline" size={24} color="#4CAF50" />
                <View>
                  <Text style={styles.apiKeyTitle}>Gemini API Key</Text>
                  <Text style={styles.apiKeySubtitle}>
                    {apiKey ? '✅ 已設定' : '⚠️ 尚未設定'}
                  </Text>
                </View>
              </View>
              {apiKey && !keyEditMode && (
                <TouchableOpacity onPress={() => setKeyEditMode(true)}>
                  <Text style={styles.apiKeyEditBtn}>修改</Text>
                </TouchableOpacity>
              )}
            </View>

            {(!apiKey || keyEditMode) && (
              <View style={styles.apiKeyInputArea}>
                <View style={styles.apiKeyInputRow}>
                  <TextInput
                    style={styles.apiKeyInput}
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    placeholder="貼上您的 Gemini API Key"
                    placeholderTextColor="#BBB"
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowKey(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.apiKeyHint}>
                  前往 aistudio.google.com 免費申請，每天 1,500 次請求
                </Text>
                <View style={styles.apiKeyBtnRow}>
                  <TouchableOpacity style={styles.testBtn} onPress={handleTestKey} disabled={keyTesting}>
                    {keyTesting
                      ? <ActivityIndicator size="small" color="#4CAF50" />
                      : <><Ionicons name="wifi-outline" size={16} color="#4CAF50" /><Text style={styles.testBtnText}>測試連線</Text></>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveKey}>
                    <Text style={styles.saveKeyBtnText}>儲存</Text>
                  </TouchableOpacity>
                </View>
                {apiKey && keyEditMode && (
                  <TouchableOpacity style={styles.deleteKeyBtn} onPress={handleDeleteKey}>
                    <Ionicons name="trash-outline" size={16} color="#F44336" />
                    <Text style={styles.deleteKeyBtnText}>刪除現有 Key</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
            <Text style={styles.cancelBtnText}>取消編輯</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingInput({ label, value, unit, isEditing, onChangeText }: any) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.itemRight}>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            autoFocus={false}
          />
        ) : (
          <Text style={styles.itemValue}>{value}</Text>
        )}
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  editBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  saveBtnText: { color: '#66BB6A', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  profileSummary: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
  },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  profileSub: { fontSize: 14, color: '#999', marginTop: 5 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 12, marginLeft: 5 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  itemLabel: { fontSize: 16, color: '#333' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  itemValue: { fontSize: 16, color: '#666' },
  genderContainer: { flexDirection: 'row', gap: 10 },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#F8F9FA'
  },
  maleActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  femaleActive: { backgroundColor: '#FF2D55', borderColor: '#FF2D55' },
  genderText: { marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: '#666' },
  optionsList: { gap: 10 },
  optionCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EEE',
    marginBottom: 8,
  },
  activeCard: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  optionLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  optionDesc: { fontSize: 14, color: '#333', fontWeight: '500' },
  optionDetail: { fontSize: 13, color: '#999', marginTop: 5, lineHeight: 18 },
  expandedSection: { padding: 15, borderTopWidth: 0.5, borderTopColor: '#EEE' },
  expandedTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginBottom: 12 },
  unitText: { fontSize: 14, color: '#999', marginLeft: 5 },
  textInput: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'right',
    fontWeight: 'bold',
    minWidth: 50,
  },
  cancelBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#FF3B30', fontSize: 16 },

  // AI Section
  apiKeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  apiKeyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  apiKeySubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  apiKeyEditBtn: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  apiKeyInputArea: { padding: 18, backgroundColor: '#FAFAFA' },
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
  },
  apiKeyInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#333',
  },
  eyeBtn: { padding: 8 },
  apiKeyHint: { fontSize: 12, color: '#999', marginTop: 10, lineHeight: 18 },
  apiKeyBtnRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    height: 44,
  },
  testBtnText: { color: '#4CAF50', fontWeight: 'bold' },
  saveKeyBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  saveKeyBtnText: { color: '#FFF', fontWeight: 'bold' },
  deleteKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 15,
    paddingVertical: 10,
  },
  deleteKeyBtnText: { color: '#F44336', fontSize: 14, fontWeight: '500' },
});
