import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bucketService from '../services/bucketService';
import useThemeStore from '../context/themeStore';

const CATEGORY_ICONS = {
  graph: 'git-network',
  dp: 'albums',
  arrays: 'list',
  dsa: 'code-working',
  dev: 'code-slash',
  default: 'book',
};

const SUBJECT_CATEGORIES = [
  { id: 'dsa', label: 'DSA Sheet', icon: 'code-working', color: '#00FF88' },
  { id: 'cp', label: 'Competitive Programming', icon: 'trophy', color: '#3b82f6' },
  { id: 'os', label: 'Operating Systems', icon: 'hardware-chip', color: '#a855f7' },
  { id: 'cn', label: 'Computer Networks', icon: 'git-network', color: '#14b8a6' },
  { id: 'oop', label: 'Object Oriented Programming', icon: 'cube', color: '#f59e0b' },
  { id: 'dev', label: 'Development', icon: 'code-slash', color: '#22c55e' },
  { id: 'database', label: 'Database', icon: 'server', color: '#f43f5e' },
];

const DIFFICULTY_COLORS = {
  easy: '#4ade80',
  medium: '#facc15',
  hard: '#f87171',
};

const BucketPickerModal = ({ visible, onClose, onImport, sheets = [] }) => {
  const colors = useThemeStore((state) => state.colors);
  
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [bucketDetails, setBucketDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  const [mode, setMode] = useState('categories'); // 'categories' | 'list' | 'details' | 'duplicate-warning'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [importMode, setImportMode] = useState('new'); // 'new' | 'existing'
  const [selectedSheet, setSelectedSheet] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [existingSheetForBucket, setExistingSheetForBucket] = useState(null);
  const [allowDuplicateCreation, setAllowDuplicateCreation] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchBuckets();
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setMode('categories');
    setSelectedCategory(null);
    setSelectedBucket(null);
    setBucketDetails(null);
    setImportMode('new');
    setSelectedSheet('');
    setNewSheetName('');
    setExistingSheetForBucket(null);
    setAllowDuplicateCreation(false);
  };

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      const data = await bucketService.getBuckets();
      setBuckets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBuckets = () => {
    if (!selectedCategory) return buckets;
    return buckets.filter(b => {
      if (b.category === selectedCategory) return true;
      if (selectedCategory === 'dsa' && !['cp', 'os', 'cn', 'oop', 'dev', 'database'].includes(b.category)) {
        return true;
      }
      return false;
    });
  };

  const filteredBuckets = getFilteredBuckets();

  const isDuplicateName = sheets.some(s => s.name.toLowerCase() === newSheetName.trim().toLowerCase());
  const canImportNew = !isDuplicateName && newSheetName.trim().length > 0;

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setMode('list');
  };

  const handleSelectBucket = async (bucket) => {
    setSelectedBucket(bucket);
    setMode('details');
    try {
      const details = await bucketService.getBucket(bucket._id);
      setBucketDetails(details);
      setNewSheetName(bucket.name);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (!selectedBucket) return;

    if (importMode === 'new') {
      const targetName = (newSheetName || selectedBucket.name).trim();
      const duplicateSheet = sheets.find(s => s.name.toLowerCase() === targetName.toLowerCase());
      
      if (duplicateSheet && !allowDuplicateCreation) {
        setExistingSheetForBucket(duplicateSheet);
        setMode('duplicate-warning');
        return;
      }
    }

    try {
      setImporting(true);
      if (importMode === 'new') {
        const result = await bucketService.createSheetFromBucket(
          selectedBucket._id,
          newSheetName || selectedBucket.name
        );
        onImport?.(result.sheet);
      } else {
        if (!selectedSheet) return;
        const result = await bucketService.importToSheet(selectedBucket._id, selectedSheet);
        onImport?.();
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleBack = () => {
    if (mode === 'details') {
      setSelectedBucket(null);
      setBucketDetails(null);
      setExistingSheetForBucket(null);
      setAllowDuplicateCreation(false);
      setMode('list');
    } else if (mode === 'duplicate-warning') {
      setMode('details');
      setAllowDuplicateCreation(false);
    } else if (mode === 'list') {
      setSelectedCategory(null);
      setMode('categories');
    }
  };

  const s = styles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {mode !== 'categories' && (
                <TouchableOpacity onPress={handleBack} style={s.backBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
              <Text style={s.headerTitle} numberOfLines={1}>
                {mode === 'categories' && 'Select Category'}
                {mode === 'list' && (SUBJECT_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Buckets')}
                {(mode === 'details' || mode === 'duplicate-warning') && selectedBucket?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={s.content} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : mode === 'categories' ? (
              <View style={s.grid}>
                {SUBJECT_CATEGORIES.map((cat) => {
                  const catBuckets = buckets.filter(b => {
                    if (b.category === cat.id) return true;
                    if (cat.id === 'dsa' && !['cp', 'os', 'cn', 'oop', 'dev', 'database'].includes(b.category)) return true;
                    return false;
                  });
                  const totalProbs = catBuckets.reduce((acc, b) => acc + (b.totalProblems || 0), 0);
                  
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={s.catCard}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <View style={[s.catIconWrap, { backgroundColor: `${cat.color}20` }]}>
                        <Ionicons name={cat.icon} size={24} color={cat.color} />
                      </View>
                      <View style={s.catInfo}>
                        <Text style={s.catLabel} numberOfLines={1}>{cat.label}</Text>
                        <Text style={s.catSub}>{totalProbs} problems</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : mode === 'list' ? (
              <View style={s.list}>
                {filteredBuckets.length === 0 ? (
                  <View style={s.emptyState}>
                    <Ionicons name="book-outline" size={48} color={colors.textMuted} />
                    <Text style={s.emptyTitle}>Coming Soon</Text>
                    <Text style={s.emptySub}>No templates in this category yet.</Text>
                  </View>
                ) : (
                  filteredBuckets.map((bucket) => {
                    const iconName = CATEGORY_ICONS[bucket.category] || CATEGORY_ICONS.default;
                    return (
                      <TouchableOpacity
                        key={bucket._id}
                        style={s.bucketCard}
                        onPress={() => handleSelectBucket(bucket)}
                      >
                        <View style={[s.bucketIconWrap, { backgroundColor: `${bucket.color}20` }]}>
                          <Ionicons name={iconName} size={24} color={bucket.color} />
                        </View>
                        <View style={s.bucketInfo}>
                          <Text style={s.bucketName}>{bucket.name}</Text>
                          <Text style={s.bucketDesc} numberOfLines={2}>{bucket.description}</Text>
                          <View style={s.bucketStatsRow}>
                            <Text style={s.bucketStatItem}>{bucket.totalProblems} problems</Text>
                            <Text style={[s.bucketStatItem, { color: DIFFICULTY_COLORS.easy }]}>{bucket.difficultyBreakdown?.easy || 0} Easy</Text>
                            <Text style={[s.bucketStatItem, { color: DIFFICULTY_COLORS.medium }]}>{bucket.difficultyBreakdown?.medium || 0} Med</Text>
                            <Text style={[s.bucketStatItem, { color: DIFFICULTY_COLORS.hard }]}>{bucket.difficultyBreakdown?.hard || 0} Hard</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : mode === 'details' && bucketDetails ? (
              <View style={s.details}>
                <Text style={s.bucketDescDetail}>{bucketDetails.description}</Text>
                
                {/* Stats */}
                <View style={s.statsGrid}>
                  <View style={s.statBox}>
                    <Text style={s.statBoxNum}>{bucketDetails.totalProblems}</Text>
                    <Text style={s.statBoxLabel}>Total</Text>
                  </View>
                  <View style={[s.statBox, { backgroundColor: `${DIFFICULTY_COLORS.easy}15` }]}>
                    <Text style={[s.statBoxNum, { color: DIFFICULTY_COLORS.easy }]}>{bucketDetails.difficultyBreakdown?.easy || 0}</Text>
                    <Text style={s.statBoxLabel}>Easy</Text>
                  </View>
                  <View style={[s.statBox, { backgroundColor: `${DIFFICULTY_COLORS.medium}15` }]}>
                    <Text style={[s.statBoxNum, { color: DIFFICULTY_COLORS.medium }]}>{bucketDetails.difficultyBreakdown?.medium || 0}</Text>
                    <Text style={s.statBoxLabel}>Medium</Text>
                  </View>
                  <View style={[s.statBox, { backgroundColor: `${DIFFICULTY_COLORS.hard}15` }]}>
                    <Text style={[s.statBoxNum, { color: DIFFICULTY_COLORS.hard }]}>{bucketDetails.difficultyBreakdown?.hard || 0}</Text>
                    <Text style={s.statBoxLabel}>Hard</Text>
                  </View>
                </View>

                {/* Topics */}
                {bucketDetails.topics && bucketDetails.topics.length > 0 && (
                  <View style={s.sectionBlock}>
                    <Text style={s.sectionTitle}>Topics Covered</Text>
                    <View style={s.chipRow}>
                      {bucketDetails.topics.map(t => (
                        <View key={t} style={s.chip}>
                          <Text style={s.chipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Preview */}
                <View style={s.sectionBlock}>
                  <Text style={s.sectionTitle}>Preview ({Math.min(8, bucketDetails.problems?.length || 0)} of {bucketDetails.problems?.length || 0})</Text>
                  {bucketDetails.problems?.slice(0, 8).map((p, idx) => (
                    <View key={idx} style={s.previewRow}>
                      <Text style={s.previewIdx}>{idx + 1}.</Text>
                      <Text style={s.previewTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={[s.previewDiff, { color: DIFFICULTY_COLORS[p.difficulty] }]}>{p.difficulty}</Text>
                    </View>
                  ))}
                </View>

                {/* Import Options */}
                <View style={[s.sectionBlock, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }]}>
                  <View style={s.importModeRow}>
                    <TouchableOpacity
                      style={[s.importModeBtn, importMode === 'new' && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
                      onPress={() => setImportMode('new')}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={importMode === 'new' ? colors.primary : colors.textMuted} />
                      <Text style={[s.importModeText, importMode === 'new' && { color: colors.primary }]}>Create New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.importModeBtn, importMode === 'existing' && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
                      onPress={() => setImportMode('existing')}
                    >
                      <Ionicons name="download-outline" size={20} color={importMode === 'existing' ? colors.primary : colors.textMuted} />
                      <Text style={[s.importModeText, importMode === 'existing' && { color: colors.primary }]}>Add to Existing</Text>
                    </TouchableOpacity>
                  </View>

                  {importMode === 'new' ? (
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>Sheet Name</Text>
                      <TextInput
                        style={s.textInput}
                        value={newSheetName}
                        onChangeText={setNewSheetName}
                        placeholder={selectedBucket?.name}
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  ) : (
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>Select Sheet</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                        {sheets.map(sheet => (
                          <TouchableOpacity
                            key={sheet._id}
                            style={[s.sheetSelectBtn, selectedSheet === sheet._id && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
                            onPress={() => setSelectedSheet(sheet._id)}
                          >
                            <Text style={[s.sheetSelectText, selectedSheet === sheet._id && { color: colors.primary }]}>{sheet.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.submitBtn, (importing || (importMode === 'existing' && !selectedSheet)) && { opacity: 0.5 }]}
                  disabled={importing || (importMode === 'existing' && !selectedSheet)}
                  onPress={handleImport}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={s.submitBtnText}>Import {bucketDetails.totalProblems} Problems</Text>
                  )}
                </TouchableOpacity>

              </View>
            ) : mode === 'duplicate-warning' && existingSheetForBucket ? (
              <View style={s.details}>
                <View style={s.warnHeader}>
                  <View style={s.warnIconWrap}>
                    <Ionicons name="warning" size={32} color="#f59e0b" />
                  </View>
                  <Text style={s.warnTitle}>Oops! You already have this</Text>
                  <Text style={s.warnSub}>You imported "{existingSheetForBucket.name}" previously. Importing it again might duplicate your tracking.</Text>
                </View>

                <View style={s.warnStatsBox}>
                  <View style={s.warnStatsRow}>
                    <Text style={s.warnStatsLabel}>Your Current Progress</Text>
                    <Text style={s.warnStatsValues}>{existingSheetForBucket.solvedProblems} / {existingSheetForBucket.totalProblems}</Text>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${existingSheetForBucket.totalProblems > 0 ? Math.round((existingSheetForBucket.solvedProblems / existingSheetForBucket.totalProblems) * 100) : 0}%` }]} />
                  </View>
                </View>

                <View style={s.warnActions}>
                  <TouchableOpacity
                    style={s.checkboxRow}
                    onPress={() => {
                      setAllowDuplicateCreation(!allowDuplicateCreation);
                      if (allowDuplicateCreation) setNewSheetName(selectedBucket.name);
                    }}
                  >
                    <View style={[s.checkbox, allowDuplicateCreation && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      {allowDuplicateCreation && <Ionicons name="checkmark" size={14} color="#000" />}
                    </View>
                    <Text style={s.checkboxLabel}>I want to create another one anyway</Text>
                  </TouchableOpacity>

                  {allowDuplicateCreation && (
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>New Sheet Name</Text>
                      <TextInput
                        style={[s.textInput, isDuplicateName && { borderColor: '#ef4444' }]}
                        value={newSheetName}
                        onChangeText={setNewSheetName}
                        placeholder="Enter a unique name..."
                        placeholderTextColor={colors.textMuted}
                      />
                      {isDuplicateName && (
                        <Text style={s.errorText}>A sheet with this name already exists.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={s.warnBtnRow}>
                  <TouchableOpacity style={s.warnBackBtn} onPress={handleBack}>
                    <Text style={s.warnBackText}>Go Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.warnImportBtn, (importing || !allowDuplicateCreation || !canImportNew) && { opacity: 0.5 }]}
                    disabled={importing || !allowDuplicateCreation || !canImportNew}
                    onPress={handleImport}
                  >
                    {importing ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={s.warnImportText}>Import Anyway</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Categories
  grid: { gap: 12 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  catSub: { fontSize: 12, color: colors.textMuted },

  // List
  list: { gap: 12 },
  bucketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bucketIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  bucketInfo: { flex: 1 },
  bucketName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  bucketDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  bucketStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bucketStatItem: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  // Details
  details: { gap: 16 },
  bucketDescDetail: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: colors.background, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statBoxNum: { fontSize: 18, fontWeight: '800', color: colors.text },
  statBoxLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionBlock: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  previewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: 10, marginBottom: 8 },
  previewIdx: { fontSize: 12, color: colors.textMuted, width: 24 },
  previewTitle: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  previewDiff: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  importModeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  importModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  importModeText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  textInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text },
  sheetSelectBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  sheetSelectText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },

  // Duplicate Warning
  warnHeader: { alignItems: 'center', marginVertical: 20 },
  warnIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  warnTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  warnSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  warnStatsBox: { backgroundColor: colors.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  warnStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  warnStatsLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  warnStatsValues: { fontSize: 14, fontWeight: '700', color: colors.text },
  progressBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  warnActions: { marginTop: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 6, marginLeft: 4 },
  warnBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  warnBackBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  warnBackText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  warnImportBtn: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center' },
  warnImportText: { fontSize: 16, fontWeight: '700', color: '#000' },
});

export default BucketPickerModal;
