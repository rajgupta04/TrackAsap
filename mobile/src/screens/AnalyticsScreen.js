import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
  Dimensions, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import useAnalyticsStore from '../context/analyticsStore';
import useThemeStore from '../context/themeStore';
import useAuthStore from '../context/authStore';
import LeetCodeHeatmap from '../components/LeetCodeHeatmap';
import platformStatsService from '../services/platformStatsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

const DIFFICULTY_COLORS = ['#00B8A3', '#FFC01E', '#FF375F'];

const AnalyticsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const colors = useThemeStore((state) => state.colors);
  const {
    difficultyBreakdown, heatmapData, codeforcesRating, isLoading, fetchAll,
    leetcodeCalendar, leetcodeRatingHistory, fetchPlatformProfiles,
    platformDistribution,
  } = useAnalyticsStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    await fetchAll();
    
    if (user) {
      await fetchPlatformProfiles(user);
    }
    
    if (isManualRefresh) setRefreshing(false);
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const s = styles(colors);

  if (isLoading && heatmapData.length === 0 && !refreshing) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pieData = (difficultyBreakdown || []).length > 0
    ? difficultyBreakdown.map((d, i) => ({
        value: d.count || 0,
        color: DIFFICULTY_COLORS[i] || '#888',
        gradientCenterColor: '#ffffff30',
      }))
    : [{ value: 1, color: colors.border }];

  const totalDifficultySolved = (difficultyBreakdown || []).reduce((acc, curr) => acc + (curr.count || 0), 0);

  // Line chart data for codeforces rating
  const cfLineData = (codeforcesRating || []).map((d, i, arr) => {
    const rating = d.rating || 0;
    const prevRating = i > 0 ? arr[i - 1].rating || 0 : rating;
    const diff = rating - prevRating;
    let iconName = 'remove';
    let iconColor = '#94A3B8';
    if (diff > 0) { iconName = 'trending-up'; iconColor = '#39FF14'; }
    else if (diff < 0) { iconName = 'trending-down'; iconColor = '#FF375F'; }

    return {
      value: rating,
      label: `D${d.dayNumber || ''}`,
      customDataPoint: () => (
        <View style={s.cfDataPoint}>
          <View style={s.ratingLabelBox}>
            {i > 0 && <Ionicons name={iconName} size={8} color={iconColor} />}
            <Text style={s.cfDataPointText}>{rating}</Text>
          </View>
        </View>
      ),
    };
  });
  
  const cfRatings = cfLineData.map(d => d.value);
  const minCf = cfRatings.length > 0 ? Math.min(...cfRatings) : 0;
  const maxCf = cfRatings.length > 0 ? Math.max(...cfRatings) : 0;
  const offsetCf = minCf > 20 ? minCf - 20 : 0;
  const rangeCf = maxCf > 0 ? (maxCf - offsetCf) + 30 : undefined;

  // Line chart data for leetcode rating
  const lcLineData = (leetcodeRatingHistory || []).map((d, i, arr) => {
    const rating = Math.round(d.rating) || 0;
    const prevRating = i > 0 ? Math.round(arr[i - 1].rating) || 0 : rating;
    const diff = rating - prevRating;
    let iconName = 'remove';
    let iconColor = '#94A3B8';
    if (diff > 0) { iconName = 'trending-up'; iconColor = '#39FF14'; }
    else if (diff < 0) { iconName = 'trending-down'; iconColor = '#FF375F'; }

    return {
      value: rating,
      label: `C${i + 1}`,
      customDataPoint: () => (
        <View style={s.lcDataPoint}>
          <View style={s.ratingLabelBox}>
            {i > 0 && <Ionicons name={iconName} size={8} color={iconColor} />}
            <Text style={s.lcDataPointText}>{rating}</Text>
          </View>
        </View>
      ),
    };
  });

  const lcRatings = lcLineData.map(d => d.value);
  const minLc = lcRatings.length > 0 ? Math.min(...lcRatings) : 0;
  const maxLc = lcRatings.length > 0 ? Math.max(...lcRatings) : 0;
  const offsetLc = minLc > 20 ? minLc - 20 : 0;
  const rangeLc = maxLc > 0 ? (maxLc - offsetLc) + 30 : undefined;

  const heatmap = heatmapData || [];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <Text style={s.pageTitle}>Analytics</Text>
        </View>

        {/* ── Platform Distribution ── */}
        {(platformDistribution || []).filter(p => p.problems > 0).length > 0 && (
          <View style={s.platformsRow}>
            {platformDistribution.filter(p => p.problems > 0).map(p => (
              <View key={p.platform} style={[s.platformCard, { borderBottomColor: p.color }]}>
                <Text style={s.platformName}>{p.platform}</Text>
                <Text style={s.platformCount}>{p.problems}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Difficulty Donut ── */}
        {(difficultyBreakdown || []).length > 0 && (
          <View style={s.card}>
            <View style={[s.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pie-chart" size={18} color="#EC4899" />
                <Text style={s.cardTitle}>Difficulty</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted }}>
                TOTAL: <Text style={{ color: colors.text }}>{totalDifficultySolved}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <PieChart
                data={pieData}
                radius={85}
                isAnimated
                strokeWidth={3}
                strokeColor={colors.surface}
                focusOnPress
              />
            </View>
            
            {/* Premium Horizontal Pills */}
            <View style={s.diffPillsContainer}>
              {difficultyBreakdown.map((d, i) => (
                <View key={d.difficulty} style={[s.diffPill, { borderColor: DIFFICULTY_COLORS[i] || '#888' }]}>
                  <Text style={[s.diffPillLabel, { color: DIFFICULTY_COLORS[i] || '#888' }]}>
                    {d.difficulty}
                  </Text>
                  <Text style={s.diffPillValue}>{d.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Codeforces Rating History ── */}
        {cfLineData.length > 1 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="stats-chart" size={18} color="#1F8ACB" />
              <Text style={s.cardTitle}>Codeforces Rating History</Text>
            </View>
            <View style={{ marginTop: 10, overflow: 'hidden', paddingBottom: 10 }}>
              <LineChart
                data={cfLineData}
                width={CHART_WIDTH}
                height={160}
                color="#1F8ACB"
                thickness={3}
                dataPointsColor="#1F8ACB"
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                yAxisOffset={offsetCf}
                maxValue={rangeCf}
                initialSpacing={20}
                endSpacing={30}
                hideRules
                curved
                spacing={60}
                scrollToEnd
                linearGradientComponent={LinearGradient}
              />
            </View>
          </View>
        )}

        {/* ── Activity Heatmap ── */}
        {heatmap.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="grid" size={18} color="#39FF14" />
              <Text style={s.cardTitle}>Daily Activity Heatmap</Text>
            </View>
            <View style={s.heatmapGrid}>
              {heatmap.map((day, i) => (
                <View
                  key={day.date || i}
                  style={[s.heatCell, {
                    backgroundColor: day.level === 4 ? '#39FF14'
                      : day.level === 3 ? '#39FF14B3'
                      : day.level === 2 ? '#39FF1480'
                      : day.level === 1 ? '#39FF144D'
                      : colors.border,
                  }]}
                />
              ))}
            </View>
            <View style={s.heatLegend}>
              <Text style={s.heatLegendLabel}>Less</Text>
              {['#334155', '#39FF144D', '#39FF1480', '#39FF14B3', '#39FF14'].map((c, i) => (
                <View key={i} style={[s.heatLegendDot, { backgroundColor: c }]} />
              ))}
              <Text style={s.heatLegendLabel}>More</Text>
            </View>
          </View>
        )}

        {/* ── LeetCode Rating History ── */}
        {lcLineData.length > 1 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="stats-chart" size={18} color="#FFA116" />
              <Text style={s.cardTitle}>LeetCode Rating History</Text>
            </View>
            <View style={{ marginTop: 10, overflow: 'hidden', paddingBottom: 10 }}>
              <LineChart
                data={lcLineData}
                width={CHART_WIDTH}
                height={160}
                color="#FFA116"
                thickness={3}
                dataPointsColor="#FFA116"
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                yAxisOffset={offsetLc}
                maxValue={rangeLc}
                initialSpacing={20}
                endSpacing={30}
                hideRules
                curved
                spacing={60}
                scrollToEnd
                linearGradientComponent={LinearGradient}
              />
            </View>
          </View>
        )}

        {/* ── LeetCode Heatmap ── */}
        {user?.leetcodeHandle && leetcodeCalendar && (
          <View style={[s.card, { paddingHorizontal: 0 }]}>
            <View style={[s.cardHeader, { paddingHorizontal: 16 }]}>
              <Ionicons name="logo-closed-captioning" size={18} color="#FFA116" />
              <Text style={s.cardTitle}>LeetCode Submissions</Text>
            </View>
            <LeetCodeHeatmap submissionCalendar={leetcodeCalendar} colors={colors} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  platformCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 3,
  },
  platformName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  platformCount: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  diffPillsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    flexWrap: 'wrap',
  },
  diffPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffPillLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  diffPillValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: (SCREEN_WIDTH - 80) / 11, height: (SCREEN_WIDTH - 80) / 11, borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' },
  heatLegendDot: { width: 12, height: 12, borderRadius: 2 },
  heatLegendLabel: { fontSize: 10, color: colors.textMuted },

  ratingLabelBox: { position: 'absolute', top: -20, width: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 },
  cfDataPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1F8ACB', shadowColor: '#1F8ACB', shadowRadius: 6, shadowOpacity: 1, elevation: 5, justifyContent: 'center', alignItems: 'center' },
  cfDataPointText: { color: '#1F8ACB', fontSize: 10, fontWeight: '800', textShadowColor: '#1F8ACB', textShadowRadius: 6 },
  
  lcDataPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFA116', shadowColor: '#FFA116', shadowRadius: 6, shadowOpacity: 1, elevation: 5, justifyContent: 'center', alignItems: 'center' },
  lcDataPointText: { color: '#FFA116', fontSize: 10, fontWeight: '800', textShadowColor: '#FFA116', textShadowRadius: 6 },
});

export default AnalyticsScreen;
