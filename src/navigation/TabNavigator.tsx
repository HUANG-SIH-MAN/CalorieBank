import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_BAR_BASE_PADDING_BOTTOM = 8;
const TAB_BAR_PADDING_TOP = 10;
/** When the OS reports 0 bottom inset (common on Android 15+ / edge-to-edge), tab bar still sits under system nav — reserve at least this (3-button bar + common OEM padding). */
const ANDROID_MIN_BOTTOM_INSET_WHEN_UNREPORTED = 56;
/** Extra gap between tab labels and system home/back/recents so taps do not feel cramped. */
const TAB_BAR_EXTRA_CLEARANCE_ABOVE_SYSTEM_NAV = 14;
const TAB_BAR_HEIGHT_ANDROID = 100;
const TAB_BAR_HEIGHT_IOS = 95;

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  const rawBottomInset = insets.bottom;
  const baseBottomInset =
    Platform.OS === 'android'
      ? Math.max(rawBottomInset, ANDROID_MIN_BOTTOM_INSET_WHEN_UNREPORTED)
      : rawBottomInset;
  const bottomInset = baseBottomInset + TAB_BAR_EXTRA_CLEARANCE_ABOVE_SYSTEM_NAV;
  const extraTabBarHeightForInset =
    Math.max(0, baseBottomInset - rawBottomInset) + TAB_BAR_EXTRA_CLEARANCE_ABOVE_SYSTEM_NAV;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: any;

          if (route.name === '首頁') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '紀錄') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === '分析') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === '設定') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          height:
            (Platform.OS === 'android' ? TAB_BAR_HEIGHT_ANDROID : TAB_BAR_HEIGHT_IOS) +
            extraTabBarHeightForInset,
          paddingBottom: TAB_BAR_BASE_PADDING_BOTTOM + bottomInset,
          paddingTop: TAB_BAR_PADDING_TOP,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
      })}
    >
      <Tab.Screen name="首頁" component={HomeScreen} />
      <Tab.Screen name="紀錄" component={LogScreen} />
      <Tab.Screen name="分析" component={AnalysisScreen} />
      <Tab.Screen name="設定" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
