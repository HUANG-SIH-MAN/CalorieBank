import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
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
