import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSheetStore from '../context/sheetStore';
import useThemeStore from '../context/themeStore';

// Icons mapping based on category
const getCategoryIcon = (category) => {
  const map = {
    dsa: 'git-network',
    cp: 'trophy',
    os: 'hardware-chip',
    cn: 'git-merge',
    oops: 'cube',
    dev: 'code-slash',
    'system-design': 'book',
    custom: 'create',
  };
  return map[category] || 'folder-open';
};

const SheetsScreen = ({ navigation }) => {
  const colors = useThemeStore((state) => state.colors);
  const { sheets, templates, loading, fetchSheets, fetchTemplates, createSheet, deleteSheet } = useSheetStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [newSheetData, setNewSheetData] = useState({ category: '', name: '', useTemplate: true });

  useEffect(() => {
    fetchSheets();
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    if (!newSheetData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    try {
      const template = templates.find((t) => t.category === newSheetData.category);
      await createSheet({
        category: newSheetData.category,
        name: newSheetData.name || (template ? template.name : 'Custom Sheet'),
        useTemplate: newSheetData.useTemplate,
      });
      setShowCreateModal(false);
      setNewSheetData({ category: '', name: '', useTemplate: true });
    } catch (e) {
      Alert.alert('Error', 'Failed to create sheet');
    }
  };

  const handleImportTemplate = async (template) => {
    try {
      await createSheet({
        category: template.category,
        name: template.name,
        useTemplate: true,
      });
      setShowBucketModal(false);
      fetchSheets();
    } catch (e) {
      Alert.alert('Error', 'Failed to import bucket');
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Sheet', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSheet(id) },
    ]);
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <Text style={s.pageTitle}>My Problem Sheets</Text>
        <View style={s.sheetCountBadge}>
          <Text style={s.sheetCountText}>{sheets.length} Sheets</Text>
        </View>
      </View>

      <View style={s.actionRow}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
          onPress={() => setShowBucketModal(true)}>
          <Ionicons name="folder-open" size={20} color={colors.primary} />
          <Text style={[s.actionBtnText, { color: colors.primary }]}>Import Buckets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#39FF1415', borderColor: '#39FF1430' }]}
          onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color="#39FF14" />
          <Text style={[s.actionBtnText, { color: '#39FF14' }]}>New Custom</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && sheets.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : sheets.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="book-outline" size={50} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No problem sheets yet</Text>
            <Text style={s.emptySub}>Tap Import Buckets above to get started!</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {sheets.map((sheet) => (
              <TouchableOpacity
                key={sheet._id}
                style={s.sheetCard}
                onPress={() => navigation.navigate('SheetDetail', { sheetId: sheet._id, title: sheet.name })}
                activeOpacity={0.8}
              >
                <View style={s.sheetCardTop}>
                  <View style={[s.iconBox, { backgroundColor: `${sheet.color || colors.primary}20` }]}>
                    <Ionicons name={getCategoryIcon(sheet.category)} size={22} color={sheet.color || colors.primary} />
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(sheet._id, sheet.name)} style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <Text style={s.sheetTitle} numberOfLines={1}>{sheet.name}</Text>
                
                <View style={s.progressRow}>
                  <Text style={s.progressText}>{sheet.solvedProblems || 0} / {sheet.totalProblems || 0}</Text>
                  <Text style={[s.progressPct, { color: sheet.color || colors.primary }]}>{sheet.completionPercentage || 0}%</Text>
                </View>
                
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { backgroundColor: sheet.color || colors.primary, width: `${sheet.completionPercentage || 0}%` }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Create Custom Modal ── */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Create New Sheet</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>

            <Text style={s.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryScroll}>
              {templates.map(t => (
                <TouchableOpacity
                  key={t.category}
                  style={[s.categoryChip, newSheetData.category === t.category && { borderColor: t.color, backgroundColor: `${t.color}15` }]}
                  onPress={() => setNewSheetData({ ...newSheetData, category: t.category, name: t.name })}
                >
                  <Ionicons name={getCategoryIcon(t.category)} size={16} color={newSheetData.category === t.category ? t.color : colors.textMuted} />
                  <Text style={[s.categoryText, newSheetData.category === t.category && { color: t.color }]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.label, { marginTop: 16 }]}>Custom Name (Optional)</Text>
            <TextInput
              style={s.input}
              value={newSheetData.name}
              onChangeText={(v) => setNewSheetData({ ...newSheetData, name: v })}
              placeholder="E.g. My Next.js Prep"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleCreate}>
              <Text style={s.submitBtnText}>Create Sheet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Import Buckets Modal ── */}
      <Modal visible={showBucketModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { height: '80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Import Pre-built Buckets</Text>
              <TouchableOpacity onPress={() => setShowBucketModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {templates.map(t => (
                <View key={t.category} style={s.templateCard}>
                  <View style={[s.iconBox, { backgroundColor: `${t.color}20`, marginRight: 12 }]}>
                    <Ionicons name={getCategoryIcon(t.category)} size={24} color={t.color} />
                  </View>
                  <View style={s.templateInfo}>
                    <Text style={s.templateName}>{t.name}</Text>
                    <Text style={s.templateDesc}>{t.description || `${t.totalProblems} curated problems`}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.importBtn, { backgroundColor: t.color }]}
                    onPress={() => handleImportTemplate(t)}
                  >
                    <Text style={s.importBtnText}>Import</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  sheetCountBadge: { backgroundColor: `${colors.primary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sheetCountText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  sheetCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  sheetCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { padding: 4 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 11, color: colors.textMuted },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  
  categoryScroll: { maxHeight: 50, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  categoryText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, marginBottom: 24 },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  templateDesc: { fontSize: 12, color: colors.textMuted },
  importBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  importBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

export default SheetsScreen;
