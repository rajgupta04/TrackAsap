import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../context/themeStore';
import Card from './Card';

const TaskCard = ({ log, onPress }) => {
  const colors = useThemeStore((state) => state.colors);

  const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const leetcodeSolved = log.leetcode?.problemsSolved || 0;
  const gymDone = log.gym?.completed || false;
  const cleanDiet = log.diet?.cleanDiet || false;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.dateText, { color: colors.text }]}>{formattedDate}</Text>
          <View style={[styles.badge, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>Day #{log.dayNumber || 1}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="code-slash-outline" size={18} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{leetcodeSolved}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>LeetCode</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons
              name={gymDone ? 'barbell' : 'barbell-outline'}
              size={18}
              color={gymDone ? colors.success : colors.textMuted}
            />
            <Text style={[styles.statValue, { color: gymDone ? colors.success : colors.textSecondary }]}>
              {gymDone ? 'Done' : 'Pending'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Workout</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons
              name={cleanDiet ? 'restaurant' : 'restaurant-outline'}
              size={18}
              color={cleanDiet ? colors.success : colors.textMuted}
            />
            <Text style={[styles.statValue, { color: cleanDiet ? colors.success : colors.textSecondary }]}>
              {cleanDiet ? 'Clean' : 'Cheat'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Diet</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default TaskCard;
