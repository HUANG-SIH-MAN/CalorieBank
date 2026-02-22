import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
// Deep imports to avoid buggy index.ts on Web
import Calendar from 'react-native-calendars/src/calendar';
// LocaleConfig is just xdate in this library, importing directly to avoid bundle error
import LocaleConfig from 'xdate';
import { Ionicons } from '@expo/vector-icons';

// Configure traditional Chinese locale
LocaleConfig.locales['zh'] = {
  monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
  today: '今天'
};
LocaleConfig.defaultLocale = 'zh';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export default function DatePickerModal({ visible, onClose, onSelectDate, selectedDate }: DatePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.calendarContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>選擇日期</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Calendar
                current={selectedDate}
                onDayPress={(day: any) => {
                  onSelectDate(day.dateString);
                  onClose();
                }}
                markedDates={{
                  [selectedDate]: { selected: true, selectedColor: '#66BB6A' }
                }}
                theme={{
                  todayTextColor: '#66BB6A',
                  arrowColor: '#66BB6A',
                  selectedDayBackgroundColor: '#66BB6A',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontSize: 14,
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 25,
    paddingBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
      },
      default: {
        elevation: 5,
      }
    })
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
