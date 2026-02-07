import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GardenProvider } from './src/context/GardenContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GardenProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </GardenProvider>
  );
}
