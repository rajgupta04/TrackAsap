import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';

const UserAgreementModal = ({ visible, onAccept, onDecline }) => {
  const colors = useThemeStore((state) => state.colors);
  const s = styles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          <View style={s.iconContainer}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={s.title}>Terms and Conditions</Text>
          <Text style={s.subtitle}>Before you join the discussions, please read and accept our Terms and Conditions.</Text>
          
          <ScrollView style={s.guidelinesContainer} showsVerticalScrollIndicator={false}>
            <View style={s.rule}>
              <Ionicons name="heart" size={18} color="#EF4444" style={s.ruleIcon} />
              <View style={s.ruleTextContainer}>
                <Text style={s.ruleTitle}>Be Respectful</Text>
                <Text style={s.ruleDesc}>Treat others as you would want to be treated. Harassment or hate speech is not tolerated.</Text>
              </View>
            </View>
            <View style={s.rule}>
              <Ionicons name="bulb" size={18} color="#F59E0B" style={s.ruleIcon} />
              <View style={s.ruleTextContainer}>
                <Text style={s.ruleTitle}>Share Value</Text>
                <Text style={s.ruleDesc}>Post your genuine progress, tips, or well-structured sheets. Avoid spam.</Text>
              </View>
            </View>
            <View style={s.rule}>
              <Ionicons name="code-slash" size={18} color="#3B82F6" style={s.ruleIcon} />
              <View style={s.ruleTextContainer}>
                <Text style={s.ruleTitle}>Stay on Topic</Text>
                <Text style={s.ruleDesc}>Keep discussions relevant to programming, career prep, and personal growth.</Text>
              </View>
            </View>
          </ScrollView>

          <Text style={s.agreementNote}>By clicking "I Agree", you acknowledge and accept our Terms and Conditions. Failure to comply may result in a permanent ban.</Text>

          <View style={s.actionsContainer}>
            <TouchableOpacity style={s.declineBtn} onPress={onDecline}>
              <Text style={s.declineText}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={onAccept}>
              <Text style={s.acceptText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: 20, padding: 24, maxHeight: '80%' },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  
  guidelinesContainer: { marginBottom: 24 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  ruleIcon: { marginTop: 2, marginRight: 12 },
  ruleTextContainer: { flex: 1 },
  ruleTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  ruleDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  agreementNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10, lineHeight: 18 },

  actionsContainer: { flexDirection: 'row', gap: 12 },
  declineBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  declineText: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  acceptBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  acceptText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default UserAgreementModal;
