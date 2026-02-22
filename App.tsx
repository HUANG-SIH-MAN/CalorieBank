import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import TabNavigator from './src/navigation/TabNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { useAppContext } from './src/context/AppContext';
import { StatusBar } from 'expo-status-bar';

function RootNavigator() {
  const { userProfile, isLoading } = useAppContext();

  if (isLoading) return null;

  return userProfile ? <TabNavigator /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
