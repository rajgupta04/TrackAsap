import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import useThemeStore from '../context/themeStore';
import useAuthStore from '../context/authStore';

const MoreScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();

  const s = styles(colors);

  const items = [
    {
      label: 'Profile & Settings',
      icon: 'person-circle-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('Profile'),
    },
    ...(user?.enablePhysique ? [{
      label: 'Physique Tracker',
      icon: 'barbell-outline',
      color: '#A855F7',
      onPress: () => navigation.navigate('Physique'),
    }] : []),
  ];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>More</Text>

        {/* User card */}
        <View style={s.userCard}>
          <View style={[s.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={s.avatarText}>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.userInfo}>
            <Text style={s.userName}>{user?.name || 'Challenger'}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {/* Nav items */}
        <View style={s.section}>
          {items.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuRow} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[s.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme toggle */}
        <View style={s.section}>
          <TouchableOpacity style={s.menuRow} onPress={toggleTheme} activeOpacity={0.7}>
            <View style={[s.menuIcon, { backgroundColor: isDarkMode ? '#818CF820' : '#F59E0B20' }]}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={isDarkMode ? '#818CF8' : '#F59E0B'} />
            </View>
            <Text style={s.menuLabel}>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <TouchableOpacity style={s.menuRow} onPress={() => logout()} activeOpacity={0.7}>
            <View style={[s.menuIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={[s.menuLabel, { color: '#EF4444' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 16 },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  section: { backgroundColor: colors.surface, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});

export default MoreScreen;
