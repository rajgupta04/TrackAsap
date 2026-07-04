import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, LayoutAnimation, UIManager, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSheetStore from '../context/sheetStore';
import useThemeStore from '../context/themeStore';
import sheetProblemService from '../services/sheetProblemService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DIFFICULTY_COLORS = {
  easy: '#22C55E',
  medium: '#EAB308',
  hard: '#EF4444',
};

const STATUS_ICONS = {
  pending: { name: 'ellipse-outline', color: '#94A3B8' },
  solved: { name: 'checkmark-circle', color: '#22C55E' },
  revision: { name: 'refresh-circle', color: '#EAB308' },
};

const SheetDetailScreen = ({ route, navigation }) => {
  const { sheetId, title } = route.params;
  const colors = useThemeStore((state) => state.colors);
  const { currentSheet, sheetProblems, loading, fetchSheet } = useSheetStore();

  const [problemsByTopic, setProblemsByTopic] = useState({});
  const [stats, setStats] = useState({ total: 0, solved: 0, revision: 0, pending: 0, easy: 0, medium: 0, hard: 0 });
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title || currentSheet?.name || 'Sheet Details',
    });
    loadProblems();
  }, [sheetId]);

  const loadProblems = async () => {
    try {
      const data = await sheetProblemService.getProblems(sheetId);
      setProblemsByTopic(data.problems || {});
      setStats(data.stats || { total: 0, solved: 0, revision: 0, pending: 0, easy: 0, medium: 0, hard: 0 });
      
      const expanded = {};
      Object.keys(data.problems || {}).forEach(topic => { expanded[topic] = true; });
      setExpandedTopics(expanded);
    } catch (e) {
      Alert.alert('Error', 'Failed to load problems');
    }
  };

  const toggleTopic = (topic) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleStatusChange = async (problemId, currentStatus) => {
    const cycle = { pending: 'solved', solved: 'revision', revision: 'pending' };
    const newStatus = cycle[currentStatus];

    // Optimistic update
    setProblemsByTopic((prev) => {
      const updated = { ...prev };
      for (const topic in updated) {
        updated[topic] = updated[topic].map((p) => p._id === problemId ? { ...p, status: newStatus } : p);
      }
      return updated;
    });

    setUpdatingId(problemId);
    try {
      await sheetProblemService.updateStatus(problemId, newStatus);
      await fetchSheet(sheetId, true); // Update global store background stats
      const data = await sheetProblemService.getProblems(sheetId); // Re-fetch for exact stats
      setStats(data.stats || stats);
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
      loadProblems(); // Revert
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter problems
  const filteredTopics = {};
  Object.entries(problemsByTopic).forEach(([topic, problems]) => {
    const filtered = problems.filter((p) => 
      !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (filtered.length > 0) filteredTopics[topic] = filtered;
  });

  const completionPercent = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  const s = styles(colors);

  if (loading && Object.keys(problemsByTopic).length === 0) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        
        {/* Mobile Unified Dashboard Tile */}
        <View style={s.statsCard}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Sheet Completion</Text>
            <Text style={[s.progressPct, { color: colors.primary }]}>{completionPercent}%</Text>
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${completionPercent}%`, backgroundColor: colors.primary }]} />
          </View>

          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statBoxValue}>{stats.total}</Text>
              <Text style={s.statBoxLabel}>Total</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1 }]}>
              <Text style={[s.statBoxValue, { color: '#22C55E' }]}>{stats.solved}</Text>
              <Text style={[s.statBoxLabel, { color: 'rgba(34, 197, 94, 0.8)' }]}>Solved</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)', borderWidth: 1 }]}>
              <Text style={[s.statBoxValue, { color: '#EAB308' }]}>{stats.revision}</Text>
              <Text style={[s.statBoxLabel, { color: 'rgba(234, 179, 8, 0.8)' }]}>Review</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statBoxValue, { color: colors.textMuted }]}>{stats.pending}</Text>
              <Text style={s.statBoxLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search problems..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Problems List */}
        {Object.keys(filteredTopics).length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No problems found</Text>
          </View>
        ) : (
          Object.entries(filteredTopics).map(([topic, problems]) => {
            const topicSolved = problems.filter(p => p.status === 'solved').length;
            const isExpanded = expandedTopics[topic];

            return (
              <View key={topic} style={s.topicCard}>
                <TouchableOpacity style={s.topicHeader} onPress={() => toggleTopic(topic)} activeOpacity={0.7}>
                  <View style={s.topicHeaderLeft}>
                    <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={20} color={isExpanded ? colors.primary : colors.textMuted} />
                    <Text style={s.topicTitle}>{topic}</Text>
                    <View style={s.topicBadge}>
                      <Text style={s.topicBadgeText}>{topicSolved}/{problems.length}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={s.problemList}>
                    {problems.map((problem, idx) => {
                      const statusIcon = STATUS_ICONS[problem.status];
                      const diffColor = DIFFICULTY_COLORS[problem.difficulty] || colors.textMuted;

                      return (
                        <View key={problem._id} style={[s.problemItem, problem.status === 'solved' && s.problemItemSolved]}>
                          <TouchableOpacity
                            style={s.statusBtn}
                            onPress={() => handleStatusChange(problem._id, problem.status)}
                            disabled={updatingId === problem._id}
                          >
                            {updatingId === problem._id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name={statusIcon.name} size={26} color={statusIcon.color} />
                            )}
                          </TouchableOpacity>
                          
                          <View style={s.problemContent}>
                            <View style={s.problemHeaderRow}>
                              <Text style={[s.problemTitle, problem.status === 'solved' && s.problemTitleSolved]}>
                                {idx + 1}. {problem.title}
                              </Text>
                              <View style={[s.diffBadge, { backgroundColor: `${diffColor}20`, borderColor: `${diffColor}40` }]}>
                                <Text style={[s.diffText, { color: diffColor }]}>{problem.difficulty}</Text>
                              </View>
                            </View>

                            {problem.tags && problem.tags.length > 0 && (
                              <View style={s.tagsRow}>
                                {problem.tags.slice(0, 3).map((tag, i) => (
                                  <View key={i} style={s.tagChip}>
                                    <Text style={s.tagText}>{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16 },

  statsCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  progressPct: { fontSize: 14, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.background, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  statBoxValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statBoxLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 4 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, color: colors.textMuted },

  topicCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12, overflow: 'hidden' },
  topicHeader: { padding: 16, backgroundColor: colors.surface },
  topicHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  topicBadge: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  topicBadgeText: { fontSize: 11, fontWeight: '700', color: colors.text },

  problemList: { borderTopWidth: 1, borderTopColor: colors.border },
  problemItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  problemItemSolved: { backgroundColor: 'rgba(34, 197, 94, 0.05)' },
  statusBtn: { marginRight: 12, marginTop: 2 },
  
  problemContent: { flex: 1 },
  problemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  problemTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 22 },
  problemTitleSolved: { color: 'rgba(34, 197, 94, 0.8)' },
  
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  diffText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, color: colors.textMuted },
});

export default SheetDetailScreen;
