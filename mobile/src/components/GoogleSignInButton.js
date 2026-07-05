import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';
import useAuthStore from '../context/authStore';

// Configure Google Sign In
GoogleSignin.configure({
  webClientId: '130574480266-4qeuib68n1ok96g822u5q8dkotuah1jf.apps.googleusercontent.com',
  // offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
});

const GoogleSignInButton = ({ title = 'Continue with Google', style }) => {
  const colors = useThemeStore((state) => state.colors);
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo.idToken;
      
      if (idToken) {
        await loginWithGoogle(idToken);
      }
    } catch (error) {
      console.warn('Google Sign-In Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color={colors.text} style={styles.icon} />
            <Text style={[styles.text, { color: colors.text }]}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
