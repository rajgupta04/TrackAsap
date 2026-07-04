import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, parseISO, getDay, differenceInDays } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import useDailyLogStore from '../context/dailyLogStore';
import useAuthStore from '../context/authStore';
import useThemeStore from '../context/themeStore';
import useProblemStore from '../context/problemStore';

const WORKOUT_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'push', label: 'Push Day' },
  { value: 'pull', label: 'Pull Day' },
  { value: 'legs', label: 'Leg Day' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'rest', label: 'Rest Day' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTY_OPTIONS = ['none', 'easy', 'medium', 'hard'];
const DIFFICULTY_COLORS = { easy: '#00B8A3', medium: '#FFC01E', hard: '#FF375F', none: '#64748B' };

const PLATFORM_CONFIG = {
  leetcode: { label: 'LeetCode', color: '#FFA116', bg: 'rgba(255,161,22,0.1)' },
  codechef: { label: 'CodeChef', color: '#a07a5a', bg: 'rgba(91,70,56,0.2)' },
  codeforces: { label: 'Codeforces', color: '#1F8ACB', bg: 'rgba(31,138,203,0.1)' },
};

const DailyTrackerScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { user } = useAuthStore();
  const {
    currentLog,
    selectedDate,
    setSelectedDate,
    fetchLogByDate,
    updateCurrentLog,
    saveLog,
    deleteLog,
    fetchStreak,
    streak,
    isLoading,
    isSaving,
  } = useDailyLogStore();

  const { fetchProblemsByDate } = useProblemStore();
  const [todayProblems, setTodayProblems] = useState([]);
  const [cfContests, setCfContests] = useState([]);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Fetch Codeforces contest dates
  useEffect(() => {
    fetch('https://codeforces.com/api/contest.list?gym=false')
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'OK') {
          const dates = d.result.map((c) => format(new Date(c.startTimeSeconds * 1000), 'yyyy-MM-dd'));
          setCfContests([...new Set(dates)]);
        }
      })
      .catch(() => {});
    fetchStreak();
  }, []);

  useEffect(() => {
    fetchLogByDate(selectedDate);
    fetchProblemsByDate(selectedDate).then(setTodayProblems);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

  const hasContest = useCallback((platform, dateStr) => {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    const dow = getDay(date);
    if (platform === 'leetcode') {
      if (dow === 0) return true;
      if (dow === 6) {
        const ref = new Date('2024-03-02T00:00:00Z');
        return Math.abs(differenceInDays(date, ref)) % 14 === 0;
      }
      return false;
    }
    if (platform === 'codechef') return dow === 3;
    if (platform === 'codeforces') return cfContests.includes(dateStr);
    return false;
  }, [cfContests]);

  const getDayNumber = () => {
    if (!user?.startDate) return 1;
    const start = new Date(user.startDate);
    start.setHours(0, 0, 0, 0);
    const sel = parseISO(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const diff = Math.floor((sel - start) / 86400000) + 1;
    return Math.max(1, Math.min(75, diff));
  };

  const getCompletionScore = () => {
    if (!currentLog) return 0;
    let score = 0;
    const hasPhysique = Boolean(user?.enablePhysique);
    const total = hasPhysique ? 5 : 3;
    if (currentLog.leetcode?.problemsSolved > 0 || currentLog.leetcode?.contestParticipated) score++;
    if (currentLog.codechef?.dailyProblem || currentLog.codechef?.contestParticipated) score++;
    if (currentLog.codeforces?.problemsSolved > 0 || currentLog.codeforces?.contestParticipated) score++;
    if (hasPhysique) {
      if (currentLog.gym?.completed) score++;
      if (currentLog.diet?.cleanDiet) score++;
    }
    return Math.round((score / total) * 100);
  };

  const handleSave = async () => {
    const result = await saveLog({ ...currentLog, date: selectedDate });
    if (result.success) {
      setSaveMessage('✓ Log saved!');
      setTimeout(() => setSaveMessage(null), 2500);
    } else {
      Alert.alert('Save Failed', result.error || 'Failed to save log');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Log', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const result = await deleteLog(selectedDate);
          if (!result.success) Alert.alert('Error', result.error || 'Failed to delete');
        },
      },
    ]);
  };

  const score = getCompletionScore();
  const dayNumber = getDayNumber();
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const s = styles(colors);

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header: Date Navigation */}
        <View style={s.card}>
          <View style={s.dateRow}>
            <TouchableOpacity style={s.navBtn} onPress={handlePrevDay}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={s.dateCenterBlock}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={s.dateText}>
                {isToday ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}
              </Text>
              <Text style={s.dateSubText}>{format(parseISO(selectedDate), 'EEEE')}</Text>
            </View>

            <TouchableOpacity style={s.navBtn} onPress={handleNextDay}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Day number + score ring */}
          <View style={s.scoreRow}>
            <View style={s.dayBadge}>
              <Text style={s.dayBadgeLabel}>Day</Text>
              <Text style={s.dayBadgeNumber}>{dayNumber}</Text>
              <Text style={s.dayBadgeLabel}>of 75</Text>
            </View>

            <View style={s.scoreRing}>
              <View style={[s.ringOuter, { borderColor: score > 0 ? colors.primary : colors.border }]}>
                <Text style={[s.ringScore, { color: score > 0 ? colors.primary : colors.textMuted }]}>{score}%</Text>
                <Text style={s.ringLabel}>done</Text>
              </View>
            </View>

            <View style={s.streakBadge}>
              <Ionicons name="flame" size={20} color="#F97316" />
              <Text style={s.streakNum}>{streak.currentStreak}</Text>
              <Text style={s.streakLabel}>streak</Text>
            </View>
          </View>
        </View>

        {/* ── LeetCode ── */}
        <PlatformCard
          platform="leetcode"
          colors={colors}
          currentLog={currentLog}
          updateCurrentLog={updateCurrentLog}
          hasContest={hasContest('leetcode', selectedDate)}
          todayProblems={todayProblems.filter((p) => p.platform === 'leetcode')}
          showDifficultyPicker={showDifficultyPicker}
          setShowDifficultyPicker={setShowDifficultyPicker}
          selectedDate={selectedDate}
        />

        {/* ── CodeChef ── */}
        <View style={s.card}>
          <View style={s.platformHeader}>
            <View style={[s.platformIcon, { backgroundColor: PLATFORM_CONFIG.codechef.bg }]}>
              <Ionicons name="code-slash" size={18} color={PLATFORM_CONFIG.codechef.color} />
            </View>
            <Text style={s.platformTitle}>CodeChef</Text>
          </View>
          <CheckRow label="Daily Problem" value={currentLog?.codechef?.dailyProblem || false}
            onChange={(v) => updateCurrentLog('codechef.dailyProblem', v)} colors={colors} />
          {hasContest('codechef', selectedDate) && (
            <CheckRow label="Contest Participated" value={currentLog?.codechef?.contestParticipated || false}
              onChange={(v) => updateCurrentLog('codechef.contestParticipated', v)} colors={colors} />
          )}
          <NumberRow label="Problems Solved" value={currentLog?.codechef?.problemsSolved || 0}
            onChange={(v) => updateCurrentLog('codechef.problemsSolved', v)} colors={colors} />
          <ProblemList problems={todayProblems.filter((p) => p.platform === 'codechef')} colors={colors} />
        </View>

        {/* ── Codeforces ── */}
        <View style={s.card}>
          <View style={s.platformHeader}>
            <View style={[s.platformIcon, { backgroundColor: PLATFORM_CONFIG.codeforces.bg }]}>
              <Ionicons name="code-slash" size={18} color={PLATFORM_CONFIG.codeforces.color} />
            </View>
            <Text style={s.platformTitle}>Codeforces</Text>
          </View>
          {hasContest('codeforces', selectedDate) && (
            <CheckRow label="Contest Participated" value={currentLog?.codeforces?.contestParticipated || false}
              onChange={(v) => updateCurrentLog('codeforces.contestParticipated', v)} colors={colors} />
          )}
          <NumberRow label="Problems Solved" value={currentLog?.codeforces?.problemsSolved || 0}
            onChange={(v) => updateCurrentLog('codeforces.problemsSolved', v)} colors={colors} />
          <NumberRow label="Rating (if updated)" value={currentLog?.codeforces?.rating || ''}
            onChange={(v) => updateCurrentLog('codeforces.rating', v)} colors={colors} placeholder="Optional" />
          <ProblemList problems={todayProblems.filter((p) => p.platform === 'codeforces')} colors={colors} />
        </View>

        {/* ── Gym & Diet (physique users only) ── */}
        {Boolean(user?.enablePhysique) && (
          <>
            {/* Gym */}
            <View style={s.card}>
              <View style={s.platformHeader}>
                <View style={[s.platformIcon, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                  <Ionicons name="barbell-outline" size={18} color="#A855F7" />
                </View>
                <Text style={s.platformTitle}>Gym</Text>
              </View>
              <CheckRow label="Workout Completed" sublabel="Did you hit the gym today?"
                value={currentLog?.gym?.completed || false}
                onChange={(v) => updateCurrentLog('gym.completed', v)} colors={colors} />

              {/* Workout type picker */}
              <Text style={s.fieldLabel}>Workout Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {WORKOUT_TYPES.map((wt) => (
                  <TouchableOpacity key={wt.value}
                    style={[s.chip, { borderColor: (currentLog?.gym?.workoutType || 'none') === wt.value ? '#A855F7' : colors.border,
                      backgroundColor: (currentLog?.gym?.workoutType || 'none') === wt.value ? 'rgba(168,85,247,0.15)' : 'transparent' }]}
                    onPress={() => updateCurrentLog('gym.workoutType', wt.value)}>
                    <Text style={[s.chipText, { color: (currentLog?.gym?.workoutType || 'none') === wt.value ? '#A855F7' : colors.textMuted }]}>{wt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <NumberRow label="Duration (minutes)" value={currentLog?.gym?.duration || ''}
                onChange={(v) => updateCurrentLog('gym.duration', v)} colors={colors} />
            </View>

            {/* Diet */}
            <View style={s.card}>
              <View style={s.platformHeader}>
                <View style={[s.platformIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                  <Ionicons name="nutrition-outline" size={18} color="#22C55E" />
                </View>
                <Text style={s.platformTitle}>Diet</Text>
              </View>
              <CheckRow label="Clean Diet" sublabel="Stayed on track with nutrition"
                value={currentLog?.diet?.cleanDiet || false}
                onChange={(v) => updateCurrentLog('diet.cleanDiet', v)} colors={colors} />
              <View style={s.twoCol}>
                <View style={s.halfCol}>
                  <NumberRow label="Calories" value={currentLog?.diet?.calories || ''}
                    onChange={(v) => updateCurrentLog('diet.calories', v)} colors={colors} placeholder="Optional" />
                </View>
                <View style={s.halfCol}>
                  <NumberRow label="Protein (g)" value={currentLog?.diet?.protein || ''}
                    onChange={(v) => updateCurrentLog('diet.protein', v)} colors={colors} placeholder="Optional" />
                </View>
              </View>
              <Text style={s.fieldLabel}>Diet Notes</Text>
              <TextInput
                style={[s.textArea, { color: colors.text, borderColor: colors.border }]}
                value={currentLog?.diet?.notes || ''}
                onChangeText={(v) => updateCurrentLog('diet.notes', v)}
                placeholder="What did you eat today?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* ── Internship Prep ── */}
        <View style={s.card}>
          <View style={s.platformHeader}>
            <View style={[s.platformIcon, { backgroundColor: 'rgba(6,182,212,0.1)' }]}>
              <Ionicons name="book-outline" size={18} color="#06B6D4" />
            </View>
            <Text style={s.platformTitle}>Internship Prep</Text>
          </View>
          <CheckRow label="Study Session Completed"
            value={currentLog?.internshipPrep?.completed || false}
            onChange={(v) => updateCurrentLog('internshipPrep.completed', v)} colors={colors} />
          <NumberRow label="Hours Spent" value={currentLog?.internshipPrep?.hoursSpent || ''}
            onChange={(v) => updateCurrentLog('internshipPrep.hoursSpent', v)} colors={colors} placeholder="0" />
        </View>

        {/* ── Daily Notes ── */}
        <View style={s.card}>
          <Text style={s.platformTitle}>Daily Notes</Text>
          <TextInput
            style={[s.textArea, { color: colors.text, borderColor: colors.border, marginTop: 8 }]}
            value={currentLog?.notes || ''}
            onChangeText={(v) => updateCurrentLog('notes', v)}
            placeholder="How was your day? Any reflections or achievements..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.deleteBtn, { borderColor: '#EF4444' }]}
            onPress={handleDelete}
            disabled={currentLog?.isNew}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[s.deleteBtnText, { opacity: currentLog?.isNew ? 0.4 : 1 }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Save Progress</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Toast */}
        {saveMessage && (
          <View style={[s.toast, { backgroundColor: colors.success }]}>
            <Text style={s.toastText}>{saveMessage}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Subcomponents ────────────────────────────────

const PlatformCard = ({ colors, currentLog, updateCurrentLog, hasContest, todayProblems, selectedDate }) => {
  const s = styles(colors);
  const [showDifficultyPicker, setShowDifficultyPicker] = React.useState(false);
  return (
    <View style={s.card}>
      <View style={s.platformHeader}>
        <View style={[s.platformIcon, { backgroundColor: PLATFORM_CONFIG.leetcode.bg }]}>
          <Ionicons name="code-slash" size={18} color={PLATFORM_CONFIG.leetcode.color} />
        </View>
        <Text style={s.platformTitle}>LeetCode</Text>
      </View>
      {hasContest && (
        <CheckRow label="Contest Participated" value={currentLog?.leetcode?.contestParticipated || false}
          onChange={(v) => updateCurrentLog('leetcode.contestParticipated', v)} colors={colors} />
      )}
      <NumberRow label="Problems Solved" value={currentLog?.leetcode?.problemsSolved || 0}
        onChange={(v) => updateCurrentLog('leetcode.problemsSolved', v)} colors={colors} />
      {/* Difficulty chips */}
      <Text style={s.fieldLabel}>Difficulty</Text>
      <View style={s.chipRow}>
        {DIFFICULTY_OPTIONS.map((d) => (
          <TouchableOpacity key={d}
            style={[s.chip, {
              borderColor: (currentLog?.leetcode?.problemDifficulty || 'none') === d ? DIFFICULTY_COLORS[d] : colors.border,
              backgroundColor: (currentLog?.leetcode?.problemDifficulty || 'none') === d ? `${DIFFICULTY_COLORS[d]}20` : 'transparent',
            }]}
            onPress={() => updateCurrentLog('leetcode.problemDifficulty', d)}>
            <Text style={[s.chipText, {
              color: (currentLog?.leetcode?.problemDifficulty || 'none') === d ? DIFFICULTY_COLORS[d] : colors.textMuted,
            }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ProblemList problems={todayProblems} colors={colors} />
    </View>
  );
};

const CheckRow = ({ label, sublabel, value, onChange, colors }) => {
  const s = styles(colors);
  return (
    <TouchableOpacity style={s.checkRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={[s.checkbox, { borderColor: value ? colors.primary : colors.border,
        backgroundColor: value ? colors.primary : 'transparent' }]}>
        {value && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.checkLabel, { color: colors.text }]}>{label}</Text>
        {sublabel && <Text style={[s.checkSublabel, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const NumberRow = ({ label, value, onChange, colors, placeholder = '0' }) => {
  const s = styles(colors);
  return (
    <View style={s.numberRow}>
      <Text style={[s.fieldLabel, { marginBottom: 0, flex: 1 }]}>{label}</Text>
      <View style={s.numberControls}>
        <TouchableOpacity style={[s.numBtn, { borderColor: colors.border }]}
          onPress={() => { const n = Math.max(0, (parseInt(value) || 0) - 1); onChange(n); }}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={[s.numInput, { color: colors.text, borderColor: colors.border }]}
          value={String(value ?? '')}
          onChangeText={(t) => onChange(t === '' ? '' : parseInt(t) || 0)}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={[s.numBtn, { borderColor: colors.border }]}
          onPress={() => { const n = (parseInt(value) || 0) + 1; onChange(n); }}>
          <Ionicons name="add" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProblemList = ({ problems, colors }) => {
  if (!problems || problems.length === 0) return null;
  const s = styles(colors);
  return (
    <View style={s.problemListContainer}>
      <Text style={[s.checkSublabel, { marginBottom: 4 }]}>Today's Problems:</Text>
      {problems.map((p) => (
        <View key={p._id} style={s.problemRow}>
          <Ionicons name="code-outline" size={13} color={colors.textMuted} />
          <Text style={s.problemTitle} numberOfLines={1}>{p.title}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Styles ────────────────────────────────

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Date navigation
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  dateCenterBlock: { alignItems: 'center', gap: 2 },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  dateSubText: { fontSize: 12, color: colors.textMuted },

  // Score row
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  dayBadge: { alignItems: 'center' },
  dayBadgeLabel: { fontSize: 11, color: colors.textMuted },
  dayBadgeNumber: { fontSize: 28, fontWeight: '800', color: colors.primary, lineHeight: 34 },
  ringOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  ringScore: { fontSize: 18, fontWeight: '800' },
  ringLabel: { fontSize: 10, color: colors.textMuted },
  scoreRing: {},
  streakBadge: { alignItems: 'center' },
  streakNum: { fontSize: 24, fontWeight: '800', color: '#F97316' },
  streakLabel: { fontSize: 11, color: colors.textMuted },

  // Platform card
  platformHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  platformIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  platformTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkLabel: { fontSize: 14, fontWeight: '500' },
  checkSublabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  // Number input
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  numberControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  numInput: { width: 52, height: 32, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontSize: 14, fontWeight: '600' },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Field label
  fieldLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginBottom: 6 },

  // Text area
  textArea: {
    borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14,
    minHeight: 80, textAlignVertical: 'top',
    backgroundColor: colors.background,
  },

  // Problem list
  problemListContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  problemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  problemTitle: { flex: 1, fontSize: 12, color: colors.textMuted },

  // Two-column layout
  twoCol: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Toast
  toast: {
    marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default DailyTrackerScreen;
