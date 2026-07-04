import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';

import DashboardScreen from '../screens/DashboardScreen';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SheetsScreen from '../screens/SheetsScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TabIcon = ({ route, isFocused, onPress, colors }) => {
  const scale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [isFocused]);

  const icons = {
    Dashboard: 'grid',
    Sheets: 'book',
    Problems: 'code-slash',
    Profile: 'person',
    'Daily Tracker': 'calendar',
  };
  const iconName = icons[route.name] || 'ellipse';

  const iconScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabButton}>
      <View style={styles.iconContainer}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={22}
            color={isFocused ? colors.primary : colors.textMuted}
            style={isFocused ? { 
              textShadowColor: colors.primary, 
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 } 
            } : undefined}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation, colors }) => {
  const slideAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      friction: 7,
      tension: 65,
    }).start();
  }, [state.index]);

  const tabWidth = 56; // 48 icon + 8 padding
  const translateX = slideAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth),
  });

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.pillContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabIcon
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
};

const MainTabNavigator = () => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
      screenOptions={{ headerShown: false }}
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
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 15, 20, 0.98)',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  tabButton: {
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainTabNavigator;
