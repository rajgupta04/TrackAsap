import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/context/authStore';
import useThemeStore from './src/context/themeStore';

export default function App() {
  const restoreAuth = useAuthStore((state) => state.restoreAuth);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    restoreAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
