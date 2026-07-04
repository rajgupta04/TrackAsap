import { StyleSheet } from 'react-native';

export const createGlobalStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    contentPadding: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headingLg: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 8,
    },
    headingMd: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
    },
    textBody: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
    },
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
  });

export default createGlobalStyles;
