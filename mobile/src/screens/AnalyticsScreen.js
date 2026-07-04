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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

const DIFFICULTY_COLORS = ['#00B8A3', '#FFC01E', '#FF375F'];

const AnalyticsScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const {
    difficultyBreakdown, heatmapData, codeforcesRating, isLoading, fetchAll,
  } = useAnalyticsStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const s = styles(colors);

  if (isLoading && heatmapData.length === 0 && !refreshing) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Pie chart data for difficulty
  const pieData = (difficultyBreakdown || []).length > 0
    ? difficultyBreakdown.map((d, i) => ({
        value: d.count || 0,
        color: DIFFICULTY_COLORS[i] || '#888',
        text: d.difficulty || '',
      }))
    : [{ value: 1, color: colors.border, text: 'No Data' }];

  // Line chart data for codeforces rating
  const cfLineData = (codeforcesRating || []).map((d) => ({
    value: d.rating || 0,
    label: `D${d.dayNumber || ''}`,
  }));

  const heatmap = heatmapData || [];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <Text style={s.pageTitle}>Analytics</Text>
        </View>

        {/* ── Difficulty Donut ── */}
        {(difficultyBreakdown || []).length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="pie-chart" size={18} color="#EC4899" />
              <Text style={s.cardTitle}>Difficulty Breakdown</Text>
            </View>
            <View style={s.donutRow}>
              <PieChart
                data={pieData}
                donut
                radius={70}
                innerRadius={40}
                isAnimated
                showText
                textColor={colors.text}
                textSize={10}
              />
              <View style={s.legend}>
                {difficultyBreakdown.map((d, i) => (
                  <View key={d.difficulty} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: DIFFICULTY_COLORS[i] || '#888' }]} />
                    <Text style={s.legendLabel}>{d.difficulty}</Text>
                    <Text style={s.legendValue}>{d.count}</Text>
                  </View>
                ))}
              </View>
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
            <View style={{ marginTop: 10 }}>
              <LineChart
                data={cfLineData}
                width={CHART_WIDTH}
                height={160}
                color="#1F8ACB"
                thickness={2}
                dataPointsColor="#1F8ACB"
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
              <Text style={s.legendLabel}>Less</Text>
              {['#334155', '#39FF144D', '#39FF1480', '#39FF14B3', '#39FF14'].map((c, i) => (
                <View key={i} style={[s.heatLegendDot, { backgroundColor: c }]} />
              ))}
              <Text style={s.legendLabel}>More</Text>
            </View>
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  donutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#94A3B8', flex: 1 },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: (SCREEN_WIDTH - 80) / 11, height: (SCREEN_WIDTH - 80) / 11, borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' },
  heatLegendDot: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontSize: 10, color: colors.textMuted },
});

export default AnalyticsScreen;
