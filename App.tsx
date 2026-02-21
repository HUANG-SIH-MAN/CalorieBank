import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
