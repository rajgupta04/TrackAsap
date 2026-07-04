import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import useThemeStore from '../context/themeStore';

const DeleteConfirmationModal = ({ visible, sheetName, onCancel, onConfirm }) => {
  const colors = useThemeStore((state) => state.colors);
  const s = styles(colors);
  const [inputText, setInputText] = useState('');

  const handleConfirm = () => {
    if (inputText.toLowerCase() === 'delete') {
      onConfirm();
      setInputText('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setInputText('');
  };

  const isMatch = inputText.toLowerCase() === 'delete';

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          <Text style={s.title}>Delete Sheet?</Text>
          <Text style={s.subtitle}>
            Are you sure you want to delete <Text style={{ fontWeight: '700', color: colors.text }}>{sheetName}</Text>? This action cannot be undone.
          </Text>
          
          <Text style={s.instruction}>Type <Text style={{ fontWeight: '800', color: '#EF4444' }}>delete</Text> to confirm:</Text>
          
          <TextInput
            style={s.input}
            placeholder="Type delete..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            autoCapitalize="none"
          />

          <View style={s.actionsContainer}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.deleteBtn, !isMatch && s.deleteBtnDisabled]} 
              onPress={handleConfirm}
              disabled={!isMatch}
            >
              <Text style={s.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 20, lineHeight: 20 },
  instruction: { fontSize: 13, color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colors.text, marginBottom: 24 },
  
  actionsContainer: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  deleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#EF4444' },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default DeleteConfirmationModal;
