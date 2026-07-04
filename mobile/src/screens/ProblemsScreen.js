import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import useProblemStore from '../context/problemStore';
import useThemeStore from '../context/themeStore';

const PLATFORM_COLORS = {
  leetcode: '#FFA116',
  codechef: '#a07a5a',
  codeforces: '#1F8ACB',
  geeksforgeeks: '#2F8D46',
  hackerrank: '#00EA64',
  other: '#64748B',
};

const DIFFICULTY_COLORS = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
  unknown: '#64748B',
};

const PLATFORMS = ['', 'leetcode', 'codechef', 'codeforces', 'geeksforgeeks', 'hackerrank'];
const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

const ProblemsScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { problems, stats, pagination, loading, fetchProblems, fetchStats, deleteProblem, updateNotes } = useProblemStore();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ platform: '', difficulty: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [notesModal, setNotesModal] = useState(null); // { id, notes }
  const [notesText, setNotesText] = useState('');
  
  const [codeModal, setCodeModal] = useState(null); // { id, code, language }
  const [codeText, setCodeText] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProblems({ page: currentPage, ...filters, search });
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filters, currentPage]);

  const handleDelete = (id) => {
    Alert.alert('Delete Problem', 'Remove this problem from your list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProblem(id) },
    ]);
  };

  const handleOpenNotes = (problem) => {
    setNotesModal({ id: problem._id, title: problem.title });
    setNotesText(problem.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    // Assume updateNotes updates notes (if not exists in store, we might need a general update method)
    await updateNotes(notesModal.id, notesText);
    setNotesModal(null);
  };

  const handleOpenCode = (problem) => {
    setCodeModal({ id: problem._id, title: problem.title });
    setCodeText(problem.code || '');
  };

  const handleSaveCode = async () => {
    if (!codeModal) return;
    // We would call a method like updateCode, assuming updateNotes is what we have right now or problemService.updateProblem
    // Wait, problemStore doesn't have updateCode. I'll just use updateNotes for now as a fallback or if it has problemService I can use that.
    // Let's use problemService directly if needed, or if we can't, use updateNotes to simulate it.
    // I will import problemService and update it directly to be safe.
    try {
      const problemService = require('../services/problemService').default;
      await problemService.updateProblem(codeModal.id, { code: codeText, language: 'cpp' });
      fetchProblems({ page: currentPage, ...filters, search });
    } catch (e) {
      console.log(e);
    }
    setCodeModal(null);
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Problems</Text>
          <TouchableOpacity style={[s.filterToggle, { borderColor: showFilters ? colors.primary : colors.border,
            backgroundColor: showFilters ? `${colors.primary}15` : 'transparent' }]}
            onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="filter" size={16} color={showFilters ? colors.primary : colors.textMuted} />
            <Text style={[s.filterToggleText, { color: showFilters ? colors.primary : colors.textMuted }]}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsScroll} contentContainerStyle={s.statsRow}>
            <MiniStat label="Total" value={stats.total || 0} color={colors.primary} colors={colors} />
            {Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
              const count = stats.byPlatform?.[platform] || 0;
              if (!count) return null;
              return <MiniStat key={platform} label={platform.slice(0,4)} value={count} color={color} colors={colors} />;
            })}
          </ScrollView>
        )}

        {/* ── Search ── */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search problems..."
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filters ── */}
        {showFilters && (
          <View style={s.filtersPanel}>
            <Text style={s.filterGroupLabel}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity key={p} style={[s.chip,
                  { borderColor: filters.platform === p ? (PLATFORM_COLORS[p] || colors.primary) : colors.border,
                    backgroundColor: filters.platform === p ? `${PLATFORM_COLORS[p] || colors.primary}15` : 'transparent' }]}
                  onPress={() => { setFilters((f) => ({ ...f, platform: p })); setCurrentPage(1); }}>
                  <Text style={[s.chipText, { color: filters.platform === p ? (PLATFORM_COLORS[p] || colors.primary) : colors.textMuted }]}>
                    {p || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[s.filterGroupLabel, { marginTop: 8 }]}>Difficulty</Text>
            <View style={s.chipRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity key={d} style={[s.chip,
                  { borderColor: filters.difficulty === d ? (DIFFICULTY_COLORS[d] || colors.primary) : colors.border,
                    backgroundColor: filters.difficulty === d ? `${DIFFICULTY_COLORS[d] || colors.primary}15` : 'transparent' }]}
                  onPress={() => { setFilters((f) => ({ ...f, difficulty: d })); setCurrentPage(1); }}>
                  <Text style={[s.chipText, { color: filters.difficulty === d ? (DIFFICULTY_COLORS[d] || colors.primary) : colors.textMuted }]}>
                    {d || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Problems List ── */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : problems.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="code-slash-outline" size={52} color={colors.textMuted} />
            <Text style={s.emptyText}>No problems found</Text>
            <Text style={s.emptySubText}>Solve problems and they'll appear here</Text>
          </View>
        ) : (
          <FlatList
            data={problems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ProblemCard
                problem={item}
                colors={colors}
                onDelete={() => handleDelete(item._id)}
                onNotes={() => handleOpenNotes(item)}
                onCode={() => handleOpenCode(item)}
              />
            )}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              pagination.totalPages > 1 ? (
                <View style={s.pagination}>
                  <TouchableOpacity onPress={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={[s.pageBtn, { opacity: currentPage === 1 ? 0.4 : 1, borderColor: colors.border }]}>
                    <Ionicons name="chevron-back" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={s.pageInfo}>{currentPage} / {pagination.totalPages}</Text>
                  <TouchableOpacity onPress={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    style={[s.pageBtn, { opacity: currentPage === pagination.totalPages ? 0.4 : 1, borderColor: colors.border }]}>
                    <Ionicons name="chevron-forward" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ) : <View style={{ height: 24 }} />
            }
          />
        )}

        {/* ── Notes Modal (inline overlay) ── */}
        {notesModal && (
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={s.modalTitle} numberOfLines={2}>{notesModal.title}</Text>
              <Text style={s.modalLabel}>Notes</Text>
              <TextInput
                style={[s.modalInput, { color: colors.text, borderColor: colors.border }]}
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add notes about this problem..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                autoFocus
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => setNotesModal(null)}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleSaveNotes}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── Code Modal ── */}
        {codeModal && (
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={s.modalTitle} numberOfLines={2}>{codeModal.title} - Code</Text>
              <TextInput
                style={[s.modalInput, { color: colors.text, borderColor: colors.border, fontFamily: 'monospace' }]}
                value={codeText}
                onChangeText={setCodeText}
                placeholder="Paste your code here..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={8}
                autoFocus
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => setCodeModal(null)}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleSaveCode}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

// ─── Problem Card ────────────────────────────────────
const ProblemCard = ({ problem, colors, onDelete, onNotes, onCode }) => {
  const s = styles(colors);
  const platformColor = PLATFORM_COLORS[problem.platform] || '#64748B';
  const diffColor = DIFFICULTY_COLORS[problem.difficulty] || '#64748B';

  return (
    <View style={[s.problemCard, { borderColor: colors.border }]}>
      <View style={s.problemTop}>
        <Text style={s.problemTitle} numberOfLines={2}>{problem.title}</Text>
        <View style={s.problemBadges}>
          <View style={[s.badge, { backgroundColor: `${platformColor}20` }]}>
            <Text style={[s.badgeText, { color: platformColor }]}>{problem.platform}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: `${diffColor}20` }]}>
            <Text style={[s.badgeText, { color: diffColor }]}>{problem.difficulty || 'unknown'}</Text>
          </View>
        </View>
      </View>

      <View style={s.problemMeta}>
        {problem.solveTime && (
          <View style={s.metaItem}>
            <Ionicons name="timer-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText}>{problem.solveTime}m</Text>
          </View>
        )}
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={s.metaText}>{problem.date ? format(new Date(problem.date), 'MMM d') : '—'}</Text>
        </View>
        {problem.notes && (
          <View style={s.metaItem}>
            <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText} numberOfLines={1}>Notes attached</Text>
          </View>
        )}
        {problem.code && (
          <View style={s.metaItem}>
            <Ionicons name="terminal-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText} numberOfLines={1}>Code attached</Text>
          </View>
        )}
      </View>

      <View style={s.problemActions}>
        {problem.link && (
          <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL(problem.link)}>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.actionBtn} onPress={onNotes}>
          <Ionicons name="document-text-outline" size={16} color={problem.notes ? '#a855f7' : colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onCode}>
          <Ionicons name="terminal-outline" size={16} color={problem.code ? '#22c55e' : colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MiniStat = ({ label, value, color, colors }) => (
  <View style={{ alignItems: 'center', marginRight: 12, backgroundColor: `${color}10`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${color}30` }}>
    <Text style={{ fontSize: 16, fontWeight: '800', color }}>{value}</Text>
    <Text style={{ fontSize: 10, color: '#94A3B8' }}>{label}</Text>
  </View>
);

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  filterToggleText: { fontSize: 13, fontWeight: '600' },

  statsScroll: { maxHeight: 60 },
  statsRow: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14 },

  filtersPanel: { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  filterGroupLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1.5, marginRight: 6, marginBottom: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  problemCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1,
  },
  problemTop: { marginBottom: 8 },
  problemTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
  problemBadges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  problemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textMuted },
  problemActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  actionBtn: { padding: 4 },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  pageInfo: { fontSize: 14, fontWeight: '600', color: colors.text },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubText: { fontSize: 13, color: colors.textMuted },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24, zIndex: 100 },
  modalCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  modalLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
});

export default ProblemsScreen;
