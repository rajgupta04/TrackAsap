import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import useAuthStore from '../context/authStore';
import useThemeStore from '../context/themeStore';
import useAnalyticsStore from '../context/analyticsStore';
import useDailyLogStore from '../context/dailyLogStore';
import usePhysiqueStore from '../context/physiqueStore';
import useOnboardingStore from '../context/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

const DashboardScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const colors = useThemeStore((state) => state.colors);
  
  const { dashboard, problemsTrend, isLoading, fetchAll } = useAnalyticsStore();
  const { streak, fetchStreak } = useDailyLogStore();
  const { logs: physiqueLogs, fetchAll: fetchPhysique } = usePhysiqueStore();
  const { hasUserSeenSheetsTour } = useOnboardingStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAll(),
      fetchStreak(),
      fetchPhysique(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    // Force redirect to Sheets tab if user hasn't seen the mandatory onboarding tour yet
    if (user && user._id && !hasUserSeenSheetsTour(user._id)) {
      navigation.navigate('Sheets');
      return;
    }
    loadData();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading && !dashboard && !refreshing) {
    return (
      <View style={[styles(colors).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totals = dashboard?.totals || {};
  const weeklyCompletion = dashboard?.weeklyCompletion || 0;
  const dietCompliance = dashboard?.dietCompliance || 0;
  const gymCompliance = dashboard?.gymCompliance || 0;

  // Build problems trend (Area Chart)
  const trendData = (problemsTrend || []).slice(-15).map((d) => ({
    value: d.cumulative || d.count || 0,
    label: `D${d.dayNumber || ''}`,
  }));

  // Build weight progress (Line Chart)
  const weightData = [...physiqueLogs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-15) // last 15 entries
    .map((l) => ({ value: l.weight, label: format(new Date(l.date), 'M/d') }));

  const hasPlatformHistory = totals.totalProblems > 0 || totals.leetcodeProblems > 0 || totals.codechefProblems > 0 || totals.codeforcesProblems > 0;
  const hasComplianceHistory = totals.daysLogged > 0 || weeklyCompletion > 0 || dietCompliance > 0 || gymCompliance > 0;

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()},</Text>
          <Text style={s.userName}>{user?.name?.split(' ')[0] || 'Challenger'}</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={s.iconBtn}>
            <Ionicons name="stats-chart" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Discussion')} style={[s.iconBtn, s.discussionBtn]}>
            <Ionicons name="chatbubbles" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        {/* ── Top stat cards ── */}
        <View style={s.statsGrid}>
          <StatCard title="Total Problems" value={totals.totalProblems || 0} subtitle="Across all platforms" icon="code-slash" color="#39FF14" colors={colors} />
          <StatCard title="Contests" value={totals.contestsParticipated || 0} subtitle="Participated" icon="trophy" color="#EAB308" colors={colors} />
          <StatCard title="Current Streak" value={`${streak.currentStreak || 0}d`} subtitle={`Best: ${streak.longestStreak || 0}d`} icon="flame" color="#F97316" colors={colors} />
          <StatCard title="Weekly Score" value={`${weeklyCompletion}%`} subtitle="Last 7 days" icon="flash" color="#06B6D4" colors={colors} />
        </View>

        {/* ── Problems Solved Chart ── */}
        {trendData.length > 1 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Problems Solved</Text>
              <Ionicons name="trending-up" size={18} color="#39FF14" />
            </View>
            <View style={{ marginTop: 10 }}>
              <LineChart
                areaChart
                data={trendData}
                width={CHART_WIDTH}
                height={180}
                color="#39FF14"
                thickness={2}
                startFillColor="#39FF14"
                endFillColor="#39FF14"
                startOpacity={0.3}
                endOpacity={0}
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                hideRules
                isAnimated
                curved
                linearGradientComponent={LinearGradient}
              />
            </View>
          </View>
        )}

        {/* ── Weight Progress Chart ── */}
        {weightData.length > 1 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Weight Progress</Text>
              <Ionicons name="locate" size={18} color="#06B6D4" />
            </View>
            <View style={{ marginTop: 10 }}>
              <LineChart
                data={weightData}
                width={CHART_WIDTH}
                height={160}
                color="#06B6D4"
                thickness={2.5}
                dataPointsColor="#06B6D4"
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                hideRules
                isAnimated
                curved
                adjustToWidth
                linearGradientComponent={LinearGradient}
              />
            </View>
          </View>
        )}

        {/* ── Platform Breakdown ── */}
        {hasPlatformHistory && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { marginBottom: 16 }]}>Platform Breakdown</Text>
            <View style={s.platformGrid}>
              <PlatformTile icon="code-slash" label="LeetCode" value={totals.leetcodeProblems || 0} color="#FFA116" colors={colors} />
              <PlatformTile icon="code-slash" label="CodeChef" value={totals.codechefProblems || 0} color="#a07a5a" colors={colors} />
              <PlatformTile icon="code-slash" label="Codeforces" value={totals.codeforcesProblems || 0} color="#1F8ACB" colors={colors} />
            </View>
          </View>
        )}

        {/* ── Compliance ── */}
        {hasComplianceHistory && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { marginBottom: 16 }]}>Compliance</Text>
            <ComplianceRow icon="barbell" label="Gym" value={gymCompliance} color="#A855F7" colors={colors} />
            <ComplianceRow icon="nutrition" label="Diet" value={dietCompliance} color="#22C55E" colors={colors} />
            <ComplianceRow icon="flash" label="Weekly" value={weeklyCompletion} color="#06B6D4" colors={colors} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Subcomponents ─────────────────────────
const StatCard = ({ title, subtitle, value, icon, color, colors }) => {
  const s = styles(colors);
  return (
    <View style={s.statCardWrap}>
      <View style={[s.statIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={s.statContent}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statTitle}>{title}</Text>
        <Text style={s.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const PlatformTile = ({ icon, label, value, color, colors }) => {
  const s = styles(colors);
  return (
    <View style={s.platformTile}>
      <View style={[s.platformIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={s.platformValue}>{value}</Text>
      <Text style={s.platformLabel}>{label}</Text>
    </View>
  );
};

const ComplianceRow = ({ icon, label, value, color, colors }) => {
  const s = styles(colors);
  return (
    <View style={s.complianceRow}>
      <View style={s.compLeft}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={s.compLabel}>{label}</Text>
      </View>
      <View style={s.compRight}>
        <View style={s.compBarBg}>
          <View style={[s.compBarFill, { backgroundColor: color, width: `${Math.min(value, 100)}%` }]} />
        </View>
        <Text style={s.compPct}>{value}%</Text>
      </View>
    </View>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  greeting: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  userName: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  discussionBtn: { backgroundColor: 'rgba(57, 255, 20, 0.1)', borderColor: 'rgba(57, 255, 20, 0.3)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCardWrap: {
    width: (SCREEN_WIDTH - 44) / 2, backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
  statTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  statSubtitle: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  platformGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  platformTile: { alignItems: 'center', backgroundColor: colors.background, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, width: '31%' },
  platformIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  platformValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  platformLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  complianceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  compLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  compLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  compRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  compBarBg: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  compBarFill: { height: '100%', borderRadius: 4 },
  compPct: { width: 36, textAlign: 'right', fontSize: 13, fontWeight: '600', color: colors.text },
});

export default DashboardScreen;
