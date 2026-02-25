import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAppContext } from '../context/AppContext';
import { ACTIVITY_LEVELS, WEIGHT_SPEEDS } from '../constants/fitness';
import { calculateDailyCalorieGoal } from '../utils/fitness';
import { UserProfile } from '../types';
import * as googleDrive from '../services/googleDriveService';
import { validateGeminiKey } from '../services/geminiService';
import * as SecureStore from 'expo-secure-store';
import GeminiConfigModal from '../components/GeminiConfigModal';

const SECURE_KEY = 'gemini_api_key';

const getStoredKey = async () => {
  if (Platform.OS === 'web') return (global as any).__geminiKey || '';
  return (await SecureStore.getItemAsync(SECURE_KEY)) || '';
};

export default function SettingsScreen() {
  const { userProfile, setUserProfile, resetAppData } = useAppContext();

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);

  // AI Settings
  const [apiKey, setApiKey] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Google Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ name: string; token: string } | null>(null);

  useEffect(() => {
    refreshKeyState();
  }, []);

  const refreshKeyState = () => {
    getStoredKey().then(k => setApiKey(k));
  };

  const handleResetApp = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('重置所有數據\n\n這將會刪除您所有的飲食紀錄、體重資料以及 AI 設定，且無法復原。您確定要這麼做嗎？');
      if (confirmed) {
        resetAppData().then(() => {
          window.alert('已重置：所有數據已清除，App 將回到初始狀態。');
        });
      }
      return;
    }

    Alert.alert(
      '重置所有數據',
      '這將會刪除您所有的飲食紀錄、體重資料以及 AI 設定，且無法復原。您確定要這麼做嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定刪除',
          style: 'destructive',
          onPress: async () => {
            await resetAppData();
            Alert.alert('已重置', '所有數據已清除，App 將回到初始狀態。');
          }
        },
      ]
    );
  };

  // Google Sync Handlers
  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      const token = await googleDrive.googleLogin();
      if (token) {
        setGoogleUser({ name: '已連結的帳號', token });
        Alert.alert('成功', 'Google 帳號連結成功');
      }
    } catch (error: any) {
      Alert.alert('失敗', error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = () => {
    setGoogleUser(null);
  };

  const handleBackup = async () => {
    if (!googleUser) {
      Alert.alert('提示', '請先連結 Google 帳號');
      return;
    }
    setIsSyncing(true);
    try {
      const result = await googleDrive.backupToDrive(googleUser.token);
      Alert.alert(result.success ? '成功' : '失敗', result.message);
    } catch (error: any) {
      Alert.alert('錯誤', error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!googleUser) {
      Alert.alert('提示', '請先連結 Google 帳號');
      return;
    }
    Alert.alert(
      '確認還原',
      '還原數據將會覆蓋您目前手機上的所有資料，建議先進行備份。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定還原',
          style: 'destructive',
          onPress: async () => {
            setIsSyncing(true);
            try {
              const result = await googleDrive.restoreFromDrive(googleUser.token);
              if (result.success) {
                Alert.alert('還原成功', '資料已回復，請重新啟動 App。');
              } else {
                Alert.alert('失敗', result.message);
              }
            } catch (error: any) {
              Alert.alert('錯誤', error.message);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
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
          <Text style={styles.sectionTitle}>AI 辨識系統</Text>
          <TouchableOpacity
            style={[styles.card, styles.aiCard]}
            onPress={() => setShowConfigModal(true)}
          >
            <View style={styles.aiCardContent}>
              <View style={styles.aiIconWrapper}>
                <MaterialCommunityIcons name="robot" size={28} color="#FFF" />
              </View>
              <View style={styles.aiTextWrapper}>
                <Text style={styles.aiTitle}>Gemini AI 設定</Text>
                <Text style={styles.aiSubtitle}>
                  {apiKey ? `已連線: ${userProfile.geminiModel || 'Flash'}` : '尚未設定 API Key'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
          </TouchableOpacity>
          <Text style={styles.aiHint}>本 App 採去中心化設計，API Key 與模型預算由用戶自行管理。</Text>
        </View>

        {/* Section: Data Backup & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>數據備份與同步</Text>
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.syncDesc}>
                您可以將所有飲食與體重紀錄備份到您的 Google Drive (AppData 隱藏資料夾)。切換手機時可輕鬆還原。
              </Text>

              <View style={styles.syncButtonGroup}>
                <TouchableOpacity
                  style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
                  onPress={handleBackup}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
                  )}
                  <Text style={styles.syncBtnText}>立即備份</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
                  onPress={handleRestore}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color="#007AFF" />
                  )}
                  <Text style={styles.syncBtnText}>還原數據</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.itemRow, { borderTopWidth: 0.5, borderTopColor: '#F0F0F0', borderBottomWidth: 0 }]}>
              <Text style={styles.itemLabel}>Google 帳號</Text>
              {googleUser ? (
                <TouchableOpacity onPress={handleGoogleSignOut} style={styles.googleAccountBtn}>
                  <Text style={styles.googleAccountText}>{googleUser.name}</Text>
                  <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleGoogleSignIn} style={styles.googleAccountBtn}>
                  <Text style={styles.googleAccountText}>未連結</Text>
                  <Ionicons name="log-in-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Section: Danger Zone */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>危險區域</Text>
          <TouchableOpacity
            style={[styles.card, styles.dangerCard]}
            onPress={handleResetApp}
          >
            <View style={styles.itemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                <Text style={styles.dangerText}>刪除所有資料並登出</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
            <Text style={styles.cancelBtnText}>取消編輯</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <GeminiConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSuccess={() => {
          setShowConfigModal(false);
          refreshKeyState();
        }}
      />
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
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  editBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  saveBtnText: { color: '#66BB6A', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  profileSummary: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  profileSub: { fontSize: 14, color: '#999', marginTop: 5 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 12, marginLeft: 5 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // AI Card in Settings
  aiCard: { padding: 20 },
  aiCardContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  aiIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF', // You can change this to a gradient later
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiTextWrapper: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  aiSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  aiHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  cardBody: {
    padding: 20,
  },
  syncDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  syncButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  syncBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.1)',
  },
  syncBtnDisabled: {
    opacity: 0.5,
  },
  syncBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  googleAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleAccountText: {
    fontSize: 14,
    color: '#666',
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFEBEB',
  },
  dangerText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
});
