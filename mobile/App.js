import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CopilotProvider } from 'react-native-copilot';
import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/context/authStore';
import useThemeStore from './src/context/themeStore';

// ─── OFFLINE FONT FIX ────────────────────────────────────────────────────────
// Problem: @expo/vector-icons checks Font.isLoaded('ionicons') before rendering.
// In native builds it returns false → icons show as blank Text forever.
//
// Fix: Pre-mark 'ionicons' as loaded in expo-font's JS cache SYNCHRONOUSLY,
// before any component renders. The actual typeface is read automatically by
// React Native's ReactFontManager from android/app/src/main/assets/fonts/ionicons.ttf
// which is physically embedded in the APK — no network, no download, no async.
//
// In Expo Go: fonts are already pre-loaded in the Go runtime. markLoaded is a no-op.
// ─────────────────────────────────────────────────────────────────────────────
import { markLoaded } from 'expo-font/build/memory';
markLoaded('ionicons');

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
        <CopilotProvider
          stopOnOutsideClick
          androidStatusBarVisible
          tooltipStyle={{
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: 16,
            paddingTop: 16,
          }}
          stepNumberComponent={() => null}
          labels={{
            skip: 'Skip Tour',
            previous: 'Back',
            next: 'Next',
            finish: 'Got It!'
          }}
        >
          <AppNavigator />
        </CopilotProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
