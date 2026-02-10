import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AreaScreen from '../screens/AreaScreen';
import CategoryScreen from '../screens/CategoryScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import HomeNotificationsScreen from '../screens/HomeNotificationsScreen';
import { COLORS, SIZES } from '../theme';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: SIZES.fontLg,
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Area"
        component={AreaScreen}
        options={({ route }) => ({
          title: route.params?.areaName || 'Garden Area',
        })}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={({ route }) => ({
          title: route.params?.categoryName || 'Plants',
        })}
      />
      <Stack.Screen
        name="PlantDetail"
        component={PlantDetailScreen}
        options={({ route }) => ({
          title: route.params?.plantName || 'Plant',
        })}
      />
      <Stack.Screen
        name="Notifications"
        component={HomeNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
