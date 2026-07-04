import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../context/authStore';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import PhysiqueScreen from '../screens/PhysiqueScreen';
import SheetDetailScreen from '../screens/SheetDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Root = createNativeStackNavigator();

const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // Wrap tabs in a root stack so screens like Profile and Physique
        // can be pushed over the tab bar from MoreScreen
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Tabs" component={MainTabNavigator} />
          <Root.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Root.Screen
            name="Physique"
            component={PhysiqueScreen}
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Root.Screen
            name="SheetDetail"
            component={SheetDetailScreen}
            options={{ presentation: 'card', animation: 'slide_from_right', headerShown: true }}
          />
          <Root.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ presentation: 'card', animation: 'slide_from_right', headerShown: true }}
          />
        </Root.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
