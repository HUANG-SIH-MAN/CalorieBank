import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { UserProfile } from '../types';

import { ACTIVITY_LEVELS, WEIGHT_SPEEDS } from '../constants/fitness';
import { calculateDailyCalorieGoal } from '../utils/fitness';

export default function OnboardingScreen() {
  const { setUserProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('SEDENTARY');
  const [goalWeight, setGoalWeight] = useState('');
  const [speed, setSpeed] = useState('STEADY');

  const calculateGoal = () => {
    return calculateDailyCalorieGoal({
      gender,
      weight: parseFloat(weight) || 0,
      height: parseFloat(height) || 0,
      age: parseFloat(age) || 0,
      activityLevel,
      goalWeight: parseFloat(goalWeight) || 0,
      speedId: speed,
    });
  };

  const handleFinish = () => {
    const dailyCalorieGoal = calculateGoal();
    const profile: UserProfile = {
      name: 'User',
      age: parseInt(age) || 25,
      gender: gender as any,
      height: parseFloat(height) || 175,
      weight: parseFloat(weight) || 70,
      goalWeight: parseFloat(goalWeight) || 70,
      activityLevel: activityLevel as any,
      weightChangeSpeed: speed as any,
      dailyCalorieGoal,
    };
    setUserProfile(profile);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>告訴我們你是誰</Text>
            <Text style={styles.subtitle}>這能幫助我們計算更精準的數值</Text>

            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBox, gender === 'MALE' && styles.activeBox]}
                onPress={() => setGender('MALE')}
              >
                <Ionicons name="male" size={40} color={gender === 'MALE' ? '#007AFF' : '#CCC'} />
                <Text style={[styles.genderLabel, gender === 'MALE' && styles.activeLabel]}>男</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBox, gender === 'FEMALE' && styles.activeBox]}
                onPress={() => setGender('FEMALE')}
              >
                <Ionicons name="female" size={40} color={gender === 'FEMALE' ? '#FF2D55' : '#CCC'} />
                <Text style={[styles.genderLabel, gender === 'FEMALE' && styles.activeLabel]}>女</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>年齡 (歲)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                  placeholder="25"
                  placeholderTextColor="#AAA"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>身高 (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={height}
                  onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
                  placeholder="175"
                  placeholderTextColor="#AAA"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>目前體重 (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={weight}
                onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
                placeholder="70.5"
                placeholderTextColor="#AAA"
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>日常生活活動量</Text>
            <Text style={styles.subtitle}>選擇最符合你目前生活形態的描述</Text>
            {ACTIVITY_LEVELS.map(level => (
              <TouchableOpacity
                key={level.id}
                style={[styles.optionCard, activityLevel === level.id && styles.activeCard]}
                onPress={() => setActivityLevel(level.id)}
              >
                <Text style={styles.optionLabel}>{level.label}</Text>
                <Text style={styles.optionDesc}>{level.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>設定你的目標</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>目標體重 (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={goalWeight}
                onChangeText={(t) => setGoalWeight(t.replace(/[^0-9.]/g, ''))}
                placeholder="65"
                placeholderTextColor="#AAA"
              />
            </View>
            <Text style={styles.inputLabel}>期望增減速度</Text>
            {WEIGHT_SPEEDS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.optionCard, speed === s.id && styles.activeCard]}
                onPress={() => setSpeed(s.id)}
              >
                <Text style={styles.optionLabel}>{s.label}</Text>
                <Text style={styles.optionDesc}>{s.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 4:
        const goal = calculateGoal();
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>這是你的卡路里預算</Text>
            <View style={styles.resultCircle}>
              <Text style={styles.resultValue}>{goal}</Text>
              <Text style={styles.resultLabel}>每日目標 (kcal)</Text>
            </View>
            <Text style={styles.summaryText}>
              根據你的資料，每天攝取 {goal} kcal 將能幫助你達成計畫。
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.progressHeader}>
          <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backBtnText}>上一步</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => step < totalSteps ? setStep(step + 1) : handleFinish()}
          >
            <Text style={styles.nextBtnText}>{step === totalSteps ? '開始管理' : '下一步'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  progressHeader: { height: 6, backgroundColor: '#EEE', width: '100%' },
  progressBar: { height: '100%', backgroundColor: '#007AFF' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 30, paddingBottom: 50 },
  stepContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  genderBox: {
    width: '48%',
    padding: 20,
    borderWidth: 2,
    borderColor: '#EEE',
    borderRadius: 20,
    alignItems: 'center'
  },
  activeBox: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  genderLabel: { marginTop: 10, fontSize: 18, color: '#666' },
  activeLabel: { color: '#007AFF', fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', marginBottom: 0 },
  inputGroup: { marginBottom: 25 },
  inputLabel: { fontSize: 16, color: '#1A1A1A', fontWeight: '600', marginBottom: 10 },
  input: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 15,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#EEE',
    color: '#000'
  },
  optionCard: {
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EEE',
    borderRadius: 15,
    marginBottom: 12
  },
  activeCard: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  optionLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  optionDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  footer: { padding: 30, flexDirection: 'row', gap: 15 },
  nextBtn: { flex: 1, backgroundColor: '#007AFF', padding: 18, borderRadius: 15, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 18, alignItems: 'center' },
  backBtnText: { color: '#666', fontSize: 18 },
  resultCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0F7FF',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    borderWidth: 5,
    borderColor: '#007AFF'
  },
  resultValue: { fontSize: 48, fontWeight: 'bold', color: '#007AFF' },
  resultLabel: { fontSize: 16, color: '#007AFF', marginTop: 5 },
  summaryText: { textAlign: 'center', fontSize: 16, color: '#666', lineHeight: 24 }
});
