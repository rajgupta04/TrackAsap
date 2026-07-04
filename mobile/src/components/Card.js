import React from 'react';
import { View, StyleSheet } from 'react-native';
import useThemeStore from '../context/themeStore';

const Card = ({ children, style, noPadding = false }) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: noPadding ? 0 : 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default Card;
