import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { validateGeminiKey } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

const SECURE_KEY = 'gemini_api_key';

interface GeminiConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (推薦：速度快、免費額度高)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp (最新測試版)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (辨識力最強、但較慢)' },
];

export default function GeminiConfigModal({ visible, onClose, onSuccess }: GeminiConfigModalProps) {
  const { userProfile, setUserProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(userProfile?.geminiModel || 'gemini-1.5-flash');
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSavedKey();
      setStep(1);
    }
  }, [visible]);

  const loadSavedKey = async () => {
    if (Platform.OS !== 'web') {
      const saved = await SecureStore.getItemAsync(SECURE_KEY);
      if (saved) setApiKey(saved);
    }
  };

  const handleValidateAndSave = async () => {
    const finalModel = isCustomModel ? customModel : selectedModel;
    if (!apiKey.trim()) {
      Alert.alert('提示', '請輸入 API Key');
      return;
    }
    if (isCustomModel && !customModel.trim()) {
      Alert.alert('提示', '請輸入自定義型號名稱');
      return;
    }

    setIsValidating(true);
    try {
      await validateGeminiKey(apiKey.trim(), finalModel);

      // Save key securely
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(SECURE_KEY, apiKey.trim());
      } else {
        (global as any).__geminiKey = apiKey.trim();
      }

      // Save model in profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          geminiModel: finalModel,
        });
      }

      Alert.alert('成功', 'AI 設定已儲存成功！現在可以開始辨識食物了。');
      onSuccess();
    } catch (error: any) {
      Alert.alert('驗證失敗', error.message || '請檢查 API Key 或型號是否正確');
    } finally {
      setIsValidating(false);
    }
  };

  const openAIStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="robot-confused" size={60} color="#007AFF" />
      </View>
      <Text style={styles.stepTitle}>歡迎使用 AI 營養辨識</Text>
      <Text style={styles.stepDesc}>
        為了提供精準的食物分析，本 App 採用了 Google Gemini 技術。
        我們不預設 API Key，而是讓您「自備金鑰」，確保資料儲存在您自己的帳號中，安全且隱私。
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          Google 提供個人開發者「免費額度」，通常足夠日常飲食紀錄使用。
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
        <Text style={styles.primaryBtnText}>開始設定</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>步驟 1：取得 API Key</Text>
      <Text style={styles.stepDesc}>
        點擊下方按鈕前往 Google AI Studio，點擊 「Create API key」 即可免費生成。
      </Text>

      <TouchableOpacity style={styles.linkBtn} onPress={openAIStudio}>
        <Ionicons name="open-outline" size={20} color="#007AFF" />
        <Text style={styles.linkBtnText}>前往 Google AI Studio</Text>
      </TouchableOpacity>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>貼上您的 API Key</Text>
        <TextInput
          style={styles.textInput}
          placeholder="例如：AIzaSy..."
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !apiKey && styles.disabledBtn]}
        onPress={() => setStep(3)}
        disabled={!apiKey}
      >
        <Text style={styles.primaryBtnText}>下一步</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
        <Text style={styles.backBtnText}>回上一步</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>步驟 2：選擇 AI 型號</Text>
      <Text style={styles.stepDesc}>
        選擇您想使用的 Gemini 模型版本。通常 Flash 版本速度最快。
      </Text>

      <View style={styles.modelList}>
        {PRESET_MODELS.map(model => (
          <TouchableOpacity
            key={model.id}
            style={[styles.modelItem, selectedModel === model.id && !isCustomModel && styles.modelItemSelected]}
            onPress={() => {
              setSelectedModel(model.id);
              setIsCustomModel(false);
            }}
          >
            <Ionicons
              name={selectedModel === model.id && !isCustomModel ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={selectedModel === model.id && !isCustomModel ? "#007AFF" : "#999"}
            />
            <Text style={[styles.modelName, selectedModel === model.id && !isCustomModel && styles.modelNameSelected]}>
              {model.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.modelItem, isCustomModel && styles.modelItemSelected]}
          onPress={() => setIsCustomModel(true)}
        >
          <Ionicons
            name={isCustomModel ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={isCustomModel ? "#007AFF" : "#999"}
          />
          <Text style={[styles.modelName, isCustomModel && styles.modelNameSelected]}>自定義型號名稱</Text>
        </TouchableOpacity>

        {isCustomModel && (
          <TextInput
            style={styles.textInputSmall}
            placeholder="例如: gemini-2.0-flash-exp"
            value={customModel}
            onChangeText={setCustomModel}
            autoCapitalize="none"
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleValidateAndSave}
        disabled={isValidating}
      >
        {isValidating ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryBtnText}>驗證並儲存</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
        <Text style={styles.backBtnText}>回上一步</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.header}>
            <View style={styles.dragBar} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#DDD" />
            </TouchableOpacity>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: '#EEE',
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 10,
  },
  stepContainer: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#CCC',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
  },
  linkBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  inputSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  textInputSmall: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#EEE',
    marginTop: 10,
    marginLeft: 30,
  },
  backBtn: {
    padding: 15,
    marginTop: 10,
  },
  backBtnText: {
    color: '#999',
    fontSize: 14,
  },
  modelList: {
    width: '100%',
    marginBottom: 30,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  modelName: {
    fontSize: 14,
    color: '#555',
  },
  modelNameSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
