import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, LayoutAnimation, UIManager, Platform,
  Linking, Modal
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

  // Modals state
  const [notesModal, setNotesModal] = useState(null); // { problemId, notes }
  const [codeModal, setCodeModal] = useState(null); // { problemId, code, language }
  const [inputText, setInputText] = useState('');

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

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    try {
      await sheetProblemService.updateProblem(notesModal.problemId, { notes: inputText });
      Alert.alert('Success', 'Notes saved');
      setNotesModal(null);
      loadProblems();
    } catch (e) {
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const handleSaveCode = async () => {
    if (!codeModal) return;
    try {
      await sheetProblemService.updateProblem(codeModal.problemId, { code: inputText, language: codeModal.language || 'cpp' });
      Alert.alert('Success', 'Code saved');
      setCodeModal(null);
      loadProblems();
    } catch (e) {
      Alert.alert('Error', 'Failed to save code');
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

                            {/* Links & Actions */}
                            <View style={s.problemActionsRow}>
                              <View style={s.linksRow}>
                                {problem.problemLink && (
                                  <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(problem.problemLink)}>
                                    <Ionicons name="code-slash" size={14} color="#3b82f6" />
                                    <Text style={[s.linkText, { color: '#3b82f6' }]}>Solve</Text>
                                  </TouchableOpacity>
                                )}
                                {problem.articleLink && (
                                  <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(problem.articleLink)}>
                                    <Ionicons name="document-text" size={14} color="#f97316" />
                                  </TouchableOpacity>
                                )}
                                {problem.youtubeLink && (
                                  <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(problem.youtubeLink)}>
                                    <Ionicons name="logo-youtube" size={14} color="#ef4444" />
                                  </TouchableOpacity>
                                )}
                              </View>

                              <View style={s.actionsRight}>
                                <TouchableOpacity
                                  style={[s.actionBtn, problem.notes ? { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' } : {}]}
                                  onPress={() => { setNotesModal({ problemId: problem._id, notes: problem.notes }); setInputText(problem.notes || ''); }}
                                >
                                  <Ionicons name="document-text-outline" size={14} color={problem.notes ? '#a855f7' : colors.textMuted} />
                                  {problem.notes && <Text style={[s.actionBtnText, { color: '#a855f7' }]}>Notes</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.actionBtn, problem.code ? { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' } : {}]}
                                  onPress={() => { setCodeModal({ problemId: problem._id, code: problem.code, language: problem.language }); setInputText(problem.code || ''); }}
                                >
                                  <Ionicons name="terminal-outline" size={14} color={problem.code ? '#22c55e' : colors.textMuted} />
                                  {problem.code && <Text style={[s.actionBtnText, { color: '#22c55e' }]}>Code</Text>}
                                </TouchableOpacity>
                              </View>
                            </View>
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

      {/* Notes Modal */}
      <Modal visible={!!notesModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Notes</Text>
            <TextInput
              style={s.modalInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Write your notes here..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setNotesModal(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveNotes}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Code Modal */}
      <Modal visible={!!codeModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Code</Text>
            <TextInput
              style={[s.modalInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Paste your code here..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setCodeModal(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveCode}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  problemTitleSolved: { color: 'rgba(34, 197, 94, 0.6)', textDecorationLine: 'line-through' },
  
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  diffText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, color: colors.textMuted },
  
  problemActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  linksRow: { flexDirection: 'row', gap: 6 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  linkText: { fontSize: 11, fontWeight: '600' },
  actionsRight: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  actionBtnText: { fontSize: 11, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, minHeight: 150, textAlignVertical: 'top' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  modalSaveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#000' },
});

export default SheetDetailScreen;
