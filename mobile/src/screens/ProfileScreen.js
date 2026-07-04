import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import useAuthStore from '../context/authStore';
import useThemeStore from '../context/themeStore';
import useAnalyticsStore from '../context/analyticsStore';
import userService from '../services/userService';
import platformStatsService from '../services/platformStatsService';
import LeetCodeHeatmap from '../components/LeetCodeHeatmap';

const ProfileScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, token, logout, updateUser } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [leetcodeCalendar, setLeetcodeCalendar] = useState(null);

  useEffect(() => {
    if (user?.leetcodeHandle) {
      platformStatsService.getLeetCodeStats(user.leetcodeHandle)
        .then(stats => {
          if (stats?.data?.submissionCalendar) {
            setLeetcodeCalendar(stats.data.submissionCalendar);
          }
        })
        .catch(err => console.log('Failed to fetch LeetCode stats', err));
    }
  }, [user?.leetcodeHandle]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    codeforcesHandle: user?.codeforcesHandle || '',
    codechefHandle: user?.codechefHandle || '',
    leetcodeHandle: user?.leetcodeHandle || '',
    targetWeight: user?.targetWeight ? String(user.targetWeight) : '',
    enablePhysique: Boolean(user?.enablePhysique),
    startDate: user?.startDate
      ? format(new Date(user.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  });

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const payload = {
        name: formData.name,
        codeforcesHandle: formData.codeforcesHandle,
        codechefHandle: formData.codechefHandle,
        leetcodeHandle: formData.leetcodeHandle,
        enablePhysique: formData.enablePhysique,
        startDate: formData.startDate,
        ...(formData.enablePhysique && formData.targetWeight
          ? { targetWeight: parseFloat(formData.targetWeight) }
          : {}),
      };
      const res = await userService.updateProfile(payload);
      const updated = res.data || res;
      await updateUser(updated);
      useAnalyticsStore.getState().fetchAll();
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const s = styles(colors);
  const avatarUrl = user?.avatarUrl || null;
  const initials = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  // Days since challenge start
  const daysSince = (() => {
    if (!user?.startDate) return 0;
    const start = new Date(user.startDate);
    const today = new Date();
    return Math.max(0, Math.floor((today - start) / 86400000));
  })();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Hero Avatar ── */}
        <View style={s.heroCard}>
          <View style={s.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            ) : (
              <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={s.heroName}>{user?.name || 'Challenger'}</Text>
          <Text style={s.heroEmail}>{user?.email}</Text>
          <View style={s.heroBadgeRow}>
            <View style={[s.heroBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="flame" size={14} color={colors.primary} />
              <Text style={[s.heroBadgeText, { color: colors.primary }]}>Day {Math.min(daysSince + 1, 75)} of 75</Text>
            </View>
          </View>
        </View>

        {/* ── Edit Profile Form ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Edit Profile</Text>

          <FormField label="Full Name" icon="person-outline" value={formData.name}
            onChangeText={(v) => set('name', v)} placeholder="Your name" colors={colors} />

          <FormField label="Start Date" icon="calendar-outline" value={formData.startDate}
            onChangeText={(v) => set('startDate', v)} placeholder="YYYY-MM-DD" colors={colors} />
        </View>

        {/* ── Platform Handles ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Platform Handles</Text>

          <FormField label="LeetCode Handle" icon="code-slash-outline" value={formData.leetcodeHandle}
            onChangeText={(v) => set('leetcodeHandle', v)} placeholder="username" colors={colors}
            accentColor="#FFA116" />

          <FormField label="CodeChef Handle" icon="code-slash-outline" value={formData.codechefHandle}
            onChangeText={(v) => set('codechefHandle', v)} placeholder="username" colors={colors}
            accentColor="#a07a5a" />

          <FormField label="Codeforces Handle" icon="code-slash-outline" value={formData.codeforcesHandle}
            onChangeText={(v) => set('codeforcesHandle', v)} placeholder="handle" colors={colors}
            accentColor="#1F8ACB" />
            
          {/* LeetCode Heatmap */}
          {user?.leetcodeHandle && leetcodeCalendar && (
            <View style={{ marginTop: 16 }}>
              <LeetCodeHeatmap submissionCalendar={leetcodeCalendar} colors={colors} />
            </View>
          )}
        </View>

        {/* ── Physique Settings ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Physique Tracking</Text>

          <View style={s.switchRow}>
            <View style={s.switchInfo}>
              <Ionicons name="barbell-outline" size={18} color="#A855F7" />
              <View>
                <Text style={s.switchLabel}>Enable Physique Tracking</Text>
                <Text style={s.switchSub}>Show Gym & Diet in Daily Tracker</Text>
              </View>
            </View>
            <Switch
              value={formData.enablePhysique}
              onValueChange={(v) => set('enablePhysique', v)}
              trackColor={{ false: colors.border, true: '#A855F7' }}
              thumbColor={formData.enablePhysique ? '#fff' : '#94A3B8'}
            />
          </View>

          {formData.enablePhysique && (
            <FormField label="Target Weight (kg)" icon="scale-outline" value={formData.targetWeight}
              onChangeText={(v) => set('targetWeight', v)} placeholder="e.g. 70" colors={colors}
              keyboardType="decimal-pad" />
          )}
        </View>

        {/* ── Appearance ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Appearance</Text>
          <View style={s.switchRow}>
            <View style={s.switchInfo}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={18} color={isDarkMode ? '#818CF8' : '#F59E0B'} />
              <Text style={s.switchLabel}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#F59E0B', true: '#818CF8' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Save Button ── */}
        {saveMsg && (
          <View style={[s.successBanner, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[s.successText, { color: colors.success }]}>{saveMsg}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Account Section ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>{user?.email}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>JWT Authentication</Text>
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: '#EF4444' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Field Component ────────────────────────────────
const FormField = ({ label, icon, value, onChangeText, placeholder, colors, accentColor, keyboardType = 'default' }) => {
  const s = styles(colors);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldInput, { borderColor: accentColor || colors.border }]}>
        <Ionicons name={icon} size={16} color={accentColor || colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[s.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  heroCard: {
    alignItems: 'center', padding: 28, margin: 16,
    backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  heroEmail: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },

  section: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginBottom: 6 },
  fieldInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.background },
  input: { flex: 1, fontSize: 14 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  switchSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  infoText: { fontSize: 13, color: colors.textMuted },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  successText: { fontSize: 13, fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 15, borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});

export default ProfileScreen;
