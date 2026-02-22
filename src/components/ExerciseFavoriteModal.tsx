import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { EXERCISE_TYPES } from '../constants/exercises';
import { ExerciseType } from '../types';

interface ExerciseFavoriteModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExerciseFavoriteModal({ visible, onClose }: ExerciseFavoriteModalProps) {
  const { userProfile, setUserProfile } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseType | null>(null);

  // Form states for adding/editing
  const [newName, setNewName] = useState('');
  const [newMet, setNewMet] = useState('');

  const allTypes = [
    ...EXERCISE_TYPES,
    ...(userProfile?.customExercises || [])
  ];

  useEffect(() => {
    if (visible && userProfile?.favoriteExerciseIds) {
      setSelectedIds(userProfile.favoriteExerciseIds);
    } else if (visible) {
      setSelectedIds(EXERCISE_TYPES.map(e => e.id));
    }
  }, [visible, userProfile]);

  const toggleExercise = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const startAddCustom = () => {
    setEditingExercise(null);
    setNewName('');
    setNewMet('');
    setIsAddingMode(true);
  };

  const startEdit = (exercise: ExerciseType) => {
    setEditingExercise(exercise);
    setNewName(exercise.name);
    setNewMet(exercise.met.toString());
    setIsAddingMode(true);
  };

  const handleSaveCustom = () => {
    if (!newName.trim() || !newMet.trim()) {
      Alert.alert('提示', '請輸入名稱與 MET 值');
      return;
    }

    const metVal = parseFloat(newMet);
    if (isNaN(metVal) || metVal <= 0) {
      Alert.alert('提示', '請輸入正確的 MET 值');
      return;
    }

    if (!userProfile) return;

    let updatedCustom = [...(userProfile.customExercises || [])];
    let newId = editingExercise?.id || `CUSTOM_${Date.now()}`;

    const newExercise: ExerciseType = {
      id: newId,
      name: newName,
      met: metVal,
      icon: editingExercise?.icon || 'running',
      isCustom: true,
    };

    if (editingExercise) {
      updatedCustom = updatedCustom.map(e => e.id === editingExercise.id ? newExercise : e);
    } else {
      updatedCustom.push(newExercise);
      // Auto toggle as favorite if adding new
      if (!selectedIds.includes(newId)) {
        toggleExercise(newId);
      }
    }

    setUserProfile({
      ...userProfile,
      customExercises: updatedCustom,
    });

    setIsAddingMode(false);
  };

  const handleDeleteCustom = (id: string) => {
    Alert.alert('確認', '確定要刪除這個自定義運動嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          if (!userProfile) return;
          const updatedCustom = (userProfile.customExercises || []).filter(e => e.id !== id);
          const updatedFavorites = selectedIds.filter(favId => favId !== id);

          setUserProfile({
            ...userProfile,
            customExercises: updatedCustom,
            favoriteExerciseIds: updatedFavorites,
          });
          setSelectedIds(updatedFavorites);
        }
      }
    ]);
  };

  const handleFinalSave = () => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        favoriteExerciseIds: selectedIds,
      });
    }
    onClose();
  };

  if (isAddingMode) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.formContent} edges={['bottom']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setIsAddingMode(false)} style={styles.closeBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{editingExercise ? '編輯運動' : '新增運動'}</Text>
              <TouchableOpacity onPress={handleSaveCustom} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>儲存</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.inputLabel}>運動名稱</Text>
              <TextInput
                style={styles.textInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="例如：馬拉松、攀岩"
              />

              <Text style={styles.inputLabel}>MET 值 (運動強度)</Text>
              <TextInput
                style={styles.textInput}
                value={newMet}
                onChangeText={setNewMet}
                keyboardType="numeric"
                placeholder="例如：7.5"
              />
              <Text style={styles.helperText}>MET 代表安靜代謝當量的倍數。數值越高，熱量消耗越快。</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent} edges={['bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>編輯運動選項</Text>
            <TouchableOpacity onPress={handleFinalSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>完成</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.addFeatureBtn} onPress={startAddCustom}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.addFeatureText}>新增自定義運動</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList}>
            <View style={styles.listContainer}>
              {allTypes.map((type) => {
                const isSelected = selectedIds.includes(type.id);
                return (
                  <View key={type.id} style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                    <TouchableOpacity
                      style={styles.itemMain}
                      onPress={() => toggleExercise(type.id)}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                          <FontAwesome5
                            name={type.icon}
                            size={18}
                            color={isSelected ? '#FFF' : '#555'}
                          />
                        </View>
                        <View>
                          <View style={styles.nameRow}>
                            <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                              {type.name}
                            </Text>
                            {type.isCustom && (
                              <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>自定義</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemMet}>MET: {type.met}</Text>
                        </View>
                      </View>
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={24}
                        color={isSelected ? "#007AFF" : "#CCC"}
                      />
                    </TouchableOpacity>

                    {type.isCustom && (
                      <View style={styles.itemActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(type)}>
                          <Ionicons name="create-outline" size={18} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCustom(type.id)}>
                          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
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
  modalContent: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
  },
  formContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 5,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  actionRow: {
    padding: 15,
    alignItems: 'center',
  },
  addFeatureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  addFeatureText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollList: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerSelected: {
    backgroundColor: '#007AFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemNameSelected: {
    color: '#007AFF',
  },
  itemMet: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  customBadge: {
    marginLeft: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
    justifyContent: 'flex-end',
    padding: 8,
  },
  actionBtn: {
    padding: 8,
    marginLeft: 15,
  },
  formBody: {
    padding: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});
