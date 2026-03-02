import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { analyzeFoodImage, FoodAnalysisResult } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import { calculateMacroGoals } from '../utils/fitness';
import { getMealTypeByTime, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../utils/time';
import GeminiConfigModal from './GeminiConfigModal';
import FoodTagEditorModal from './FoodTagEditorModal';

const SECURE_KEY = 'gemini_api_key';
const DEFAULT_FOOD_TAGS = ['大碗', '小份', '半份', '加蛋', '少油'];

const PORTION_MULTIPLIER_MIN = 0.01;
const PORTION_MULTIPLIER_MAX = 10;
const NUTRITION_DECIMAL_FACTOR = 10;

function roundNutritionToOneDecimal(value: number): number {
  return Math.round(value * NUTRITION_DECIMAL_FACTOR) / NUTRITION_DECIMAL_FACTOR;
}

interface FoodScanModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: FoodAnalysisResult, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK') => void;
  date: string;
}

type Stage = 'idle' | 'analyzing' | 'result' | 'manual';

export default function FoodScanModal({ visible, onClose, onConfirm, date }: FoodScanModalProps) {
  const { userProfile } = useAppContext();
  const [stage, setStage] = useState<Stage>('idle');
  const [showConfig, setShowConfig] = useState(false);

  const calorieGoal = userProfile?.dailyCalorieGoal || 1833;
  const macroGoals = calculateMacroGoals(
    calorieGoal,
    userProfile?.weight || 70,
    userProfile?.goalWeight || 70
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hints, setHints] = useState('');
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageRatio, setImageRatio] = useState(1);

  // Editable result fields
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');

  // Manually input fields (no photo)
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>(getMealTypeByTime());
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState('1');

  const resetAll = () => {
    setStage('idle');
    setImageBase64(null);
    setImageUri(null);
    setHints('');
    setResult(null);
    setRetryCount(0);
    setErrorMsg('');
    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setSelectedMealType(getMealTypeByTime());
    setPortionMultiplier('1');
  };

  const pickImage = async (useCamera: boolean) => {
    let pickerResult;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要相機權限', '請在設定中允許相機存取');
        return;
      }
      pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: false,
      });
    } else {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: false,
      });
    }

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];

    if (asset.width && asset.height) {
      setImageRatio(asset.width / asset.height);
    }

    // Compress to ≤ 1024px wide for AI analysis
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    const b64 = manipulated.base64 || '';
    // Use base64 data URI for display (file URIs may not be accessible on some Android devices)
    setImageUri(`data:image/jpeg;base64,${b64}`);
    setImageBase64(b64 || null);
    setImageMime('image/jpeg');
    setRetryCount(0);
    setErrorMsg('');
    setResult(null);
    setStage('idle');
  };

  const doAnalyze = async () => {
    if (!imageBase64) return;

    // Check if key is configured
    let apiKey = '';
    if (Platform.OS === 'web') {
      apiKey = (global as any).__geminiKey || '';
    } else {
      apiKey = await SecureStore.getItemAsync(SECURE_KEY) || '';
    }

    if (!apiKey) {
      setShowConfig(true);
      return;
    }

    const modelName = userProfile?.geminiModel || 'gemini-1.5-flash';

    setStage('analyzing');
    setErrorMsg('');

    try {
      const res = await analyzeFoodImage(imageBase64, imageMime, apiKey, modelName, hints);
      setResult(res);
      setEditName(res.name);
      setEditCalories(res.calories.toString());
      setEditProtein(res.protein.toString());
      setEditCarbs(res.carbs.toString());
      setEditFat(res.fat.toString());
      setStage('result');
    } catch (e: any) {
      setErrorMsg(e.message || '辨識失敗');
      setRetryCount(c => c + 1);
      setStage('idle');
    }
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      Alert.alert(
        '辨識多次失敗',
        '建議補充關鍵字後重試，或切換為手動輸入',
        [
          { text: '手動輸入', onPress: () => setStage('manual') },
          { text: '繼續重試', style: 'cancel', onPress: doAnalyze },
        ]
      );
      return;
    }
    doAnalyze();
  };

  const handleConfirm = () => {
    const rawMultiplier = parseFloat(portionMultiplier);
    const multiplier = Number.isNaN(rawMultiplier)
      ? 1
      : Math.max(PORTION_MULTIPLIER_MIN, Math.min(PORTION_MULTIPLIER_MAX, rawMultiplier));

    const baseCalories = parseInt(editCalories, 10) || 0;
    const baseProtein = parseFloat(editProtein) || 0;
    const baseCarbs = parseFloat(editCarbs) || 0;
    const baseFat = parseFloat(editFat) || 0;

    const confirmed: FoodAnalysisResult = {
      name: editName,
      calories: Math.round(baseCalories * multiplier),
      protein: roundNutritionToOneDecimal(baseProtein * multiplier),
      carbs: roundNutritionToOneDecimal(baseCarbs * multiplier),
      fat: roundNutritionToOneDecimal(baseFat * multiplier),
    };
    onConfirm(confirmed, selectedMealType);
    resetAll();
    onClose();
  };

  const handleManualConfirm = () => {
    if (!manualName.trim() || !manualCalories.trim()) {
      Alert.alert('請填寫', '至少需要填寫食物名稱和卡路里');
      return;
    }
    const manualProteinNum = parseFloat(manualProtein);
    const manualCarbsNum = parseFloat(manualCarbs);
    const manualFatNum = parseFloat(manualFat);
    const manual: FoodAnalysisResult = {
      name: manualName.trim(),
      calories: parseInt(manualCalories) || 0,
      protein: roundNutritionToOneDecimal(Number.isNaN(manualProteinNum) ? 0 : manualProteinNum),
      carbs: roundNutritionToOneDecimal(Number.isNaN(manualCarbsNum) ? 0 : manualCarbsNum),
      fat: roundNutritionToOneDecimal(Number.isNaN(manualFatNum) ? 0 : manualFatNum),
    };
    onConfirm(manual, selectedMealType);
    resetAll();
    onClose();
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ─── RENDER ────────────────────────────────────────────────
  //
  // 圖片顯示對應位置（拍完照／選圖後 vs 辨識完成後）：
  // - 設定圖片來源：pickImage() 約第 92–136 行，setImageUri 第 130 行
  // - 辨識前顯示：renderIdle() 約第 238–250 行（有圖時的 <Image>）
  // - 辨識中顯示：renderAnalyzing() 約第 329–335 行
  // - 辨識後顯示：renderResult() 約第 347–354 行（同一張 imageUri）
  // - 樣式：photoSmall、photoWrapperWithRetake 見 StyleSheet

  const renderIdle = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Photo Area：與 renderResult 完全同一結構（無 photoContainer），見 337–345 行 */}
      {imageUri ? (
        <View style={styles.photoWrapperWithRetake}>
          <Image
            key={imageUri.substring(0, 50)}
            source={{ uri: imageUri }}
            style={[styles.photoSmall, { aspectRatio: imageRatio || 1 }]}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImageUri(null); setImageBase64(null); }}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retakeBtnText}>重新選圖</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons name="food-fork-drink" size={60} color="#CCC" />
          <Text style={styles.photoPlaceholderText}>選擇食物照片</Text>
          <View style={styles.pickBtnRow}>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={22} color="#FFF" />
              <Text style={styles.pickBtnText}>拍照</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, styles.pickBtnAlt]} onPress={() => pickImage(false)}>
              <Ionicons name="images" size={22} color="#4CAF50" />
              <Text style={[styles.pickBtnText, { color: '#4CAF50' }]}>從相簿選</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error message */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#F44336" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Hints Input */}
      {imageUri && (
        <View style={styles.hintsCard}>
          <View style={styles.hintsHeader}>
            <View>
              <Text style={styles.hintsLabel}>💡 補充說明</Text>
              <Text style={styles.hintsLabelSub}>（選填，可提升辨識準確度）</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTagEditor(true)} style={styles.settingsIconBtn}>
              <Ionicons name="settings-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.hintsInput}
            placeholder="例如：滷肉飯、大碗、加蛋..."
            placeholderTextColor="#BBB"
            value={hints}
            onChangeText={setHints}
            returnKeyType="done"
          />
          {/* Quick Tag Buttons */}
          <View style={styles.tagRow}>
            {(userProfile?.customFoodTags || DEFAULT_FOOD_TAGS).map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => setHints(h => h ? `${h}、${tag}` : tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {imageUri && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={doAnalyze}>
          <MaterialCommunityIcons name="robot" size={22} color="#FFF" />
          <Text style={styles.analyzeBtnText}>
            {retryCount > 0 ? `重新辨識（第 ${retryCount + 1} 次）` : 'AI 開始辨識'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.manualBtn} onPress={() => setStage('manual')}>
        <Ionicons name="create-outline" size={18} color="#999" />
        <Text style={styles.manualBtnText}>手動輸入</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAnalyzing = () => (
    <View style={styles.loadingContainer}>
      {imageUri && (
        <Image
          key={imageUri.substring(0, 50)}
          source={{ uri: imageUri }}
          style={[styles.photoSmall, { aspectRatio: imageRatio || 1 }]}
          resizeMode="contain"
        />
      )}
      <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 30 }} />
      <Text style={styles.loadingText}>AI 辨識中…</Text>
      <Text style={styles.loadingSubText}>
        {retryCount > 0 ? `第 ${retryCount + 1} 次嘗試` : '正在分析食物內容與營養成分'}
      </Text>
    </View>
  );

  const renderResult = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {imageUri && (
        <Image
          key={imageUri.substring(0, 50)}
          source={{ uri: imageUri }}
          style={[styles.photoSmall, { aspectRatio: imageRatio || 1 }]}
          resizeMode="contain"
        />
      )}

      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.resultHeaderText}>辨識完成！可點擊數值修改</Text>
        </View>

        <ResultField label="食物名稱" value={editName} onChangeText={setEditName} isText />
        <ResultField
          label="熱量"
          value={editCalories}
          onChangeText={setEditCalories}
          unit="kcal"
          proportion={parseInt(editCalories) / calorieGoal}
        />
        <ResultField
          label="蛋白質"
          value={editProtein}
          onChangeText={setEditProtein}
          unit="g"
          proportion={(parseFloat(editProtein) || 0) / macroGoals.protein}
        />
        <ResultField
          label="碳水化合物"
          value={editCarbs}
          onChangeText={setEditCarbs}
          unit="g"
          proportion={(parseFloat(editCarbs) || 0) / macroGoals.carbs}
        />
        <ResultField
          label="脂肪"
          value={editFat}
          onChangeText={setEditFat}
          unit="g"
          proportion={(parseFloat(editFat) || 0) / macroGoals.fat}
        />

        <View style={styles.portionMultiplierSection}>
          <Text style={styles.resultFieldLabel}>份量倍數</Text>
          <Text style={styles.portionMultiplierHint}>
            若實際份量較少可輸入小於 1，例如 0.5 表示半份
          </Text>
          <TextInput
            style={styles.portionMultiplierInput}
            placeholder="1"
            placeholderTextColor="#BBB"
            value={portionMultiplier}
            onChangeText={(text) => {
              const filtered = text.replace(/[^\d.]/g, '');
              const parts = filtered.split('.');
              if (parts.length <= 2) setPortionMultiplier(parts.join('.'));
            }}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.mealTypeSection}>
          <Text style={styles.resultFieldLabel}>用餐時段</Text>
          <View style={styles.mealTypeRow}>
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.mealTypeBtn, selectedMealType === type && styles.mealTypeBtnActive]}
                onPress={() => setSelectedMealType(type)}
              >
                <Text style={styles.mealTypeIcon}>{MEAL_TYPE_ICONS[type]}</Text>
                <Text style={[styles.mealTypeLabel, selectedMealType === type && styles.mealTypeLabelActive]}>
                  {MEAL_TYPE_LABELS[type].split('/')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Retry with hints */}
      <View style={styles.hintsCard}>
        <View style={styles.hintsHeader}>
          <View>
            <Text style={styles.hintsLabel}>💡 補充提示</Text>
            <Text style={styles.hintsLabelSub}>（重新辨識時使用）</Text>
          </View>
          <TouchableOpacity onPress={() => setShowTagEditor(true)} style={styles.settingsIconBtn}>
            <Ionicons name="settings-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.hintsInput}
          placeholder="例如：這是韓式石鍋拌飯、份量偏大..."
          placeholderTextColor="#BBB"
          value={hints}
          onChangeText={setHints}
          returnKeyType="done"
        />
        <View style={styles.tagRow}>
          {(userProfile?.customFoodTags || DEFAULT_FOOD_TAGS).map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => setHints(h => h ? `${h}、${tag}` : tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultActionsRow}>
        <TouchableOpacity style={styles.retryAnalyzeBtn} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#FF9800" />
          <Text style={styles.retryAnalyzeBtnText}>重新辨識</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={20} color="#FFF" />
          <Text style={styles.confirmBtnText}>確認加入</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.manualBtn} onPress={() => setStage('manual')}>
        <Ionicons name="create-outline" size={18} color="#999" />
        <Text style={styles.manualBtnText}>改為手動輸入</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderManual = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>手動輸入食物</Text>

        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>食物名稱 *</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="例如：雞腿便當"
            placeholderTextColor="#BBB"
            value={manualName}
            onChangeText={setManualName}
          />
        </View>
        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>熱量（大卡）*</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="0"
            placeholderTextColor="#BBB"
            value={manualCalories}
            onChangeText={setManualCalories}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>蛋白質（g）</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="0"
            placeholderTextColor="#BBB"
            value={manualProtein}
            onChangeText={setManualProtein}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>碳水化合物（g）</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="0"
            placeholderTextColor="#BBB"
            value={manualCarbs}
            onChangeText={setManualCarbs}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>脂肪（g）</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="0"
            placeholderTextColor="#BBB"
            onChangeText={setManualFat}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.manualField}>
          <Text style={styles.manualLabel}>用餐時段</Text>
          <View style={styles.mealTypeRow}>
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.mealTypeBtn, selectedMealType === type && styles.mealTypeBtnActive]}
                onPress={() => setSelectedMealType(type)}
              >
                <Text style={styles.mealTypeIcon}>{MEAL_TYPE_ICONS[type]}</Text>
                <Text style={[styles.mealTypeLabel, selectedMealType === type && styles.mealTypeLabelActive]}>
                  {MEAL_TYPE_LABELS[type].split('/')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleManualConfirm}>
        <Ionicons name="checkmark" size={20} color="#FFF" />
        <Text style={styles.confirmBtnText}>確認加入</Text>
      </TouchableOpacity>

      {imageUri && (
        <TouchableOpacity style={styles.manualBtn} onPress={() => setStage('idle')}>
          <Ionicons name="arrow-back-outline" size={18} color="#999" />
          <Text style={styles.manualBtnText}>回到 AI 辨識</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const handleRequestClose = () => {
    if (showConfig) {
      setShowConfig(false);
    } else if (showTagEditor) {
      setShowTagEditor(false);
    } else {
      handleClose();
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={handleRequestClose}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerBtn} onPress={handleClose}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {stage === 'manual' ? '手動輸入' : 'AI 辨識食物'}
              </Text>
              <View style={styles.headerBtn} />
            </View>

            {stage === 'idle' && renderIdle()}
            {stage === 'analyzing' && renderAnalyzing()}
            {stage === 'result' && renderResult()}
            {stage === 'manual' && renderManual()}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <GeminiConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        onSuccess={() => {
          setShowConfig(false);
          doAnalyze();
        }}
      />

      <FoodTagEditorModal
        visible={showTagEditor}
        onClose={() => setShowTagEditor(false)}
        tags={userProfile?.customFoodTags || DEFAULT_FOOD_TAGS}
      />
    </>
  );
}

// ─── Sub-component: editable result row ────────────────────
function ResultField({
  label, value, onChangeText, unit, isText, proportion
}: {
  label: string; value: string; onChangeText: (v: string) => void; unit?: string; isText?: boolean; proportion?: number;
}) {
  const percent = proportion ? Math.round(proportion * 100) : 0;

  return (
    <View style={styles.resultFieldRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultFieldLabel}>{label}</Text>
        {proportion !== undefined && percent > 0 && (
          <Text style={styles.proportionText}>佔全天預算 {percent}%</Text>
        )}
      </View>
      <View style={styles.resultFieldRight}>
        <TextInput
          style={styles.resultFieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={isText ? 'default' : 'numeric'}
        />
        {unit && <Text style={styles.resultFieldUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────
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
  headerBtn: { width: 44, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Photo
  photoContainer: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, backgroundColor: '#F0F0F0' },
  /** idle 用：只包一層、不設 overflow，與 result 的圖片結構一致 */
  photoWrapperWithRetake: { position: 'relative', marginBottom: 16 },
  photo: { width: '100%' },
  retakeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    gap: 5,
  },
  retakeBtnText: { color: '#FFF', fontSize: 13 },
  photoPlaceholder: {
    height: 220,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: { fontSize: 15, color: '#BBB', marginTop: 10, marginBottom: 20 },
  pickBtnRow: { flexDirection: 'row', gap: 12 },
  pickBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 25,
    alignItems: 'center',
    gap: 7,
  },
  pickBtnAlt: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  pickBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  photoSmall: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: '#C62828', fontSize: 14, flex: 1 },

  // Hints
  hintsCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  hintsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsIconBtn: {
    padding: 8,
    marginRight: -4,
  },
  hintsLabel: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  hintsLabelSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  hintsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tagText: { color: '#388E3C', fontSize: 13, fontWeight: '600' },

  // Buttons
  analyzeBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  analyzeBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  manualBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  manualBtnText: { color: '#999', fontSize: 14 },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
  loadingSubText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },

  // Result
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  resultHeaderText: { fontSize: 14, color: '#555' },
  resultFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  resultFieldLabel: { fontSize: 15, color: '#555', fontWeight: '500' },
  resultFieldRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultFieldInput: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 2,
  },
  resultFieldUnit: { fontSize: 13, color: '#999' },
  proportionText: { fontSize: 11, color: '#C7C7CC', marginTop: 2 },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  retryAnalyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#FF9800',
    borderRadius: 25,
    paddingVertical: 14,
  },
  retryAnalyzeBtnText: { color: '#FF9800', fontWeight: 'bold', fontSize: 15 },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Manual
  manualCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  manualTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 18 },
  manualField: { marginBottom: 14 },
  manualLabel: { fontSize: 14, color: '#777', marginBottom: 6, fontWeight: '500' },
  manualInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  portionMultiplierSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
  },
  portionMultiplierHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 8,
  },
  portionMultiplierInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
    maxWidth: 100,
  },
  mealTypeSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  mealTypeBtn: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mealTypeBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  mealTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  mealTypeLabelActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
