import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import useThemeStore from '../context/themeStore';

const Loader = ({ message = 'Loading...', fullScreen = true }) => {
  const colors = useThemeStore((state) => state.colors);

  if (!fullScreen) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Loader;
