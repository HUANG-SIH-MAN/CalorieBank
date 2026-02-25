import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface FoodTagEditorModalProps {
  visible: boolean;
  onClose: () => void;
  tags: string[];
}

export default function FoodTagEditorModal({ visible, onClose, tags }: FoodTagEditorModalProps) {
  const { userProfile, setUserProfile } = useAppContext();
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (visible) {
      setLocalTags(userProfile?.customFoodTags || ['大碗', '小份', '半份', '加蛋', '少油']);
    }
  }, [visible, userProfile]);

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (localTags.includes(trimmed)) {
      Alert.alert('提示', '此標籤已存在');
      return;
    }
    setLocalTags([...localTags, trimmed]);
    setNewTag('');
  };

  const handleRemove = (tag: string) => {
    setLocalTags(localTags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      customFoodTags: localTags,
    });
    onClose();
  };

  const swapTags = (index1: number, index2: number) => {
    if (index2 < 0 || index2 >= localTags.length) return;
    const newTags = [...localTags];
    [newTags[index1], newTags[index2]] = [newTags[index2], newTags[index1]];
    setLocalTags(newTags);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>常用標籤</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={styles.saveText}>儲存</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="新增標籤 (ex: 少鹽...)"
            value={newTag}
            onChangeText={setNewTag}
            maxLength={10}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>按住左側圖示並上下拖曳來調整順序</Text>

        <ScrollView style={styles.tagList} scrollEnabled={true}>
          {localTags.map((tag, index) => (
            <DraggableRow
              key={tag}
              tag={tag}
              index={index}
              onRemove={() => handleRemove(tag)}
              onSwap={swapTags}
              totalItems={localTags.length}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DraggableRow({ tag, index, onRemove, onSwap, totalItems }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const rowTranslateY = useRef(new Animated.Value(0)).current;
  const rowHeight = 70; // This should match styles.tagItem.height

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        rowTranslateY.setValue(gestureState.dy);

        // Threshold for swapping
        const moveDist = gestureState.dy;
        if (Math.abs(moveDist) > rowHeight * 0.8) {
          const swapDir = moveDist > 0 ? 1 : -1;
          const targetIndex = index + swapDir;
          if (targetIndex >= 0 && targetIndex < totalItems) {
            onSwap(index, targetIndex);
            // After swap, we should theoretically reset the position 
            // but since the component re-renders with the new index, 
            // it can be tricky without a controlled animated list.
          }
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        Animated.spring(rowTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        rowTranslateY.setValue(0);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.tagItem,
        isDragging && styles.draggingRow,
        { transform: [{ translateY: rowTranslateY }] }
      ]}
    >
      <View style={styles.tagMain}>
        <View {...panResponder.panHandlers} style={styles.menuIconContainer}>
          <Ionicons name="menu" size={22} color={isDragging ? "#007AFF" : "#CCC"} />
        </View>
        <Text style={styles.tagText}>{tag}</Text>
      </View>

      <TouchableOpacity onPress={onRemove} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: { padding: 5 },
  cancelText: { color: '#666', fontSize: 16 },
  saveText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold' },
  inputSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagList: { flex: 1, paddingHorizontal: 20 },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    height: 70,
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  draggingRow: {
    backgroundColor: '#F0F7FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  tagMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    padding: 15,
    marginLeft: -15,
    cursor: 'grab',
  } as any,
  tagText: { fontSize: 16, color: '#333', fontWeight: '500' },
  deleteBtn: {
    padding: 10,
  },
});
