import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import usePhysiqueStore from '../context/physiqueStore';
import useAuthStore from '../context/authStore';
import useThemeStore from '../context/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PhysiqueScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { user } = useAuthStore();
  const { logs, progress, isLoading, isSaving, fetchAll, fetchProgress, addLog, deleteLog } = usePhysiqueStore();

  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    notes: '',
  });

  useEffect(() => {
    fetchAll();
    fetchProgress();
  }, []);

  const handleAdd = async () => {
    if (!newLog.weight) {
      Alert.alert('Missing Field', 'Please enter your weight.');
      return;
    }
    const result = await addLog({
      date: newLog.date,
      weight: parseFloat(newLog.weight),
      bodyFat: newLog.bodyFat ? parseFloat(newLog.bodyFat) : undefined,
      notes: newLog.notes,
    });
    if (result.success) {
      setShowForm(false);
      setNewLog({ date: format(new Date(), 'yyyy-MM-dd'), weight: '', bodyFat: '', notes: '' });
      fetchProgress();
    } else {
      Alert.alert('Error', result.error || 'Failed to add log');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Log', 'Delete this weight log entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLog(id) },
    ]);
  };

  // Build line chart data from logs
  const chartData = [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({ value: l.weight, label: format(new Date(l.date), 'M/d') }));

  const targetWeight = user?.targetWeight || progress?.targetWeight;
  const currentWeight = progress?.currentWeight || (logs.length > 0 ? logs[0].weight : null);
  const diff = currentWeight && targetWeight ? (currentWeight - targetWeight).toFixed(1) : null;

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Physique Tracker</Text>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
            onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={s.statsRow}>
          <StatCard label="Current" value={currentWeight ? `${currentWeight} kg` : '—'} color="#06B6D4" colors={colors} />
          <StatCard label="Target" value={targetWeight ? `${targetWeight} kg` : '—'} color="#8B5CF6" colors={colors} />
          <StatCard label="Diff" value={diff !== null ? `${diff > 0 ? '+' : ''}${diff} kg` : '—'}
            color={diff !== null && parseFloat(diff) <= 0 ? '#22C55E' : '#EF4444'} colors={colors} />
          <StatCard label="Logs" value={logs.length} color="#F59E0B" colors={colors} />
        </View>

        {/* ── Weight Chart ── */}
        {chartData.length > 1 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="trending-down" size={18} color="#06B6D4" />
              <Text style={s.cardTitle}>Weight Progress</Text>
            </View>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 64}
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
            {targetWeight && (
              <Text style={[s.targetLine, { color: '#8B5CF6' }]}>
                Target: {targetWeight} kg
              </Text>
            )}
          </View>
        )}

        {/* ── Add Log Form ── */}
        {showForm && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Add Weight Log</Text>

            <View style={s.fieldRow}>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>Date</Text>
                <TextInput style={[s.fieldInput, { color: colors.text, borderColor: colors.border }]}
                  value={newLog.date} onChangeText={(v) => setNewLog((p) => ({ ...p, date: v }))}
                  placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>Weight (kg) *</Text>
                <TextInput style={[s.fieldInput, { color: colors.text, borderColor: colors.primary }]}
                  value={newLog.weight} onChangeText={(v) => setNewLog((p) => ({ ...p, weight: v }))}
                  placeholder="70.5" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={s.fieldRow}>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>Body Fat % (opt.)</Text>
                <TextInput style={[s.fieldInput, { color: colors.text, borderColor: colors.border }]}
                  value={newLog.bodyFat} onChangeText={(v) => setNewLog((p) => ({ ...p, bodyFat: v }))}
                  placeholder="15.0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>Notes (opt.)</Text>
                <TextInput style={[s.fieldInput, { color: colors.text, borderColor: colors.border }]}
                  value={newLog.notes} onChangeText={(v) => setNewLog((p) => ({ ...p, notes: v }))}
                  placeholder="Morning weight" placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="add-circle-outline" size={18} color="#fff" /><Text style={s.submitText}>Add Log</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Log List ── */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : logs.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="scale-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyText}>No weight logs yet</Text>
            <Text style={s.emptySubText}>Tap + to add your first entry</Text>
          </View>
        ) : (
          <View style={s.logList}>
            {logs.map((log) => (
              <View key={log._id} style={s.logCard}>
                <View style={s.logLeft}>
                  <Text style={s.logDate}>{format(new Date(log.date), 'MMM d, yyyy')}</Text>
                  {log.notes ? <Text style={s.logNote}>{log.notes}</Text> : null}
                </View>
                <View style={s.logRight}>
                  <Text style={s.logWeight}>{log.weight} kg</Text>
                  {log.bodyFat ? <Text style={s.logBodyFat}>{log.bodyFat}% BF</Text> : null}
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(log._id)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, color, colors }) => {
  const s = styles(colors);
  return (
    <View style={[s.statCard, { borderColor: `${color}30`, backgroundColor: `${color}10` }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  targetLine: { fontSize: 12, fontWeight: '600', textAlign: 'right', marginTop: 6 },

  fieldRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: '500' },
  fieldInput: {
    borderWidth: 1.5, borderRadius: 10, padding: 10,
    fontSize: 14, backgroundColor: colors.background,
  },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, marginTop: 4 },
  submitText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubText: { fontSize: 13, color: colors.textMuted },

  logList: { marginHorizontal: 16, marginTop: 12, gap: 8 },
  logCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  logLeft: { flex: 1 },
  logDate: { fontSize: 14, fontWeight: '600', color: colors.text },
  logNote: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logRight: { alignItems: 'flex-end', marginRight: 10 },
  logWeight: { fontSize: 16, fontWeight: '800', color: colors.primary },
  logBodyFat: { fontSize: 11, color: colors.textMuted },
  deleteBtn: { padding: 6 },
});

export default PhysiqueScreen;
