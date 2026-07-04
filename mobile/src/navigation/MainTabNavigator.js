import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';
import useAuthStore from '../context/authStore';

import DashboardScreen from '../screens/DashboardScreen';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SheetsScreen from '../screens/SheetsScreen';
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            'Daily Tracker': focused ? 'calendar' : 'calendar-outline',
            Problems: focused ? 'code-slash' : 'code-slash-outline',
            Analytics: focused ? 'stats-chart' : 'stats-chart-outline',
            Sheets: focused ? 'book' : 'book-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Daily Tracker" component={DailyTasksScreen} />
      <Tab.Screen name="Problems" component={ProblemsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Sheets" component={SheetsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
