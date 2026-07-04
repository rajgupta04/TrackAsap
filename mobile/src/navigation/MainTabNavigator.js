import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';

import DashboardScreen from '../screens/DashboardScreen';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SheetsScreen from '../screens/SheetsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          alignSelf: 'center',
          left: 20,
          right: 20,
          height: 70,
          backgroundColor: 'rgba(20,20,20,0.95)', // dark-900/95
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          paddingBottom: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: 'home',
            Sheets: 'book',
            Problems: 'code-slash',
            Profile: 'person',
            'Daily Tracker': 'calendar',
          };
          const iconName = icons[route.name] || 'ellipse';

          if (focused) {
            return (
              <View style={[styles.iconContainer, styles.iconActive, { backgroundColor: `${colors.primary}33`, borderColor: colors.primary }]}>
                <Ionicons name={iconName} size={24} color={colors.primary} />
              </View>
            );
          }

          return (
            <View style={[styles.iconContainer, styles.iconInactive]}>
              <Ionicons name={`${iconName}-outline`} size={24} color={colors.textMuted} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sheets" component={SheetsScreen} />
      <Tab.Screen name="Problems" component={ProblemsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Daily Tracker" component={DailyTasksScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    borderWidth: 2,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  iconInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});

export default MainTabNavigator;
