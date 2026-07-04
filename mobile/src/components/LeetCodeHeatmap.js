import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const getIntensityColor = (count, colors) => {
  if (count === 0) return 'rgba(20, 20, 28, 0.8)'; // Dark empty state
  if (count <= 1) return '#092b16';
  if (count <= 3) return '#10592a';
  if (count <= 5) return '#1a9643';
  return '#39FF14'; // Neon primary
};

const LeetCodeHeatmap = ({ submissionCalendar, colors }) => {
  const heatmapData = useMemo(() => {
    if (!submissionCalendar) return [];

    let calendarData = {};
    if (typeof submissionCalendar === 'string') {
      try {
        calendarData = JSON.parse(submissionCalendar);
      } catch (e) {
        return [];
      }
    } else if (typeof submissionCalendar === 'object') {
      calendarData = submissionCalendar;
    }

    const timestamps = Object.keys(calendarData);
    if (timestamps.length === 0) return [];

    const submissionsByDate = {};
    timestamps.forEach((ts) => {
      const date = new Date(parseInt(ts) * 1000);
      const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      submissionsByDate[dateKey] = calendarData[ts];
    });

    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const days = [];
    const currentDate = new Date(oneYearAgo);

    while (currentDate <= today) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      days.push({
        date: new Date(currentDate),
        count: submissionsByDate[dateKey] || 0,
        dateKey,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, [submissionCalendar]);

  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = [];

    if (heatmapData.length > 0) {
      const firstDayOfWeek = heatmapData[0].date.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }
    }

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (day.date.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [heatmapData]);

  const totalSubmissions = useMemo(() => {
    return heatmapData.reduce((sum, day) => sum + day.count, 0);
  }, [heatmapData]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const month = validDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: validDay.date.toLocaleString('default', { month: 'short' }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  const hasSubmissions = heatmapData.length > 0 && totalSubmissions > 0;

  if (heatmapData.length === 0 || !hasSubmissions) {
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>No submission data available</Text>
      </View>
    );
  }

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>LeetCode Heatmap</Text>
        <Text style={s.subtitle}>{totalSubmissions} submissions in the last year</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <View>
          {/* Months */}
          <View style={s.monthsRow}>
            {monthLabels.map((label, idx) => {
              const marginLeft = idx === 0 ? label.weekIndex * 15 : 0;
              const width = idx < monthLabels.length - 1 ? (monthLabels[idx + 1].weekIndex - label.weekIndex) * 15 : 'auto';
              return (
                <Text key={idx} style={[s.monthText, { marginLeft, width }]}>
                  {label.month}
                </Text>
              );
            })}
          </View>

          {/* Grid */}
          <View style={s.gridRow}>
            {/* Days Labels */}
            <View style={s.daysCol}>
              <Text style={s.dayText}>M</Text>
              <Text style={s.dayText}>T</Text>
              <Text style={s.dayText}>W</Text>
              <Text style={s.dayText}>Th</Text>
              <Text style={s.dayText}>F</Text>
              <Text style={s.dayText}>Sa</Text>
              <Text style={s.dayText}>Su</Text>
            </View>

            {/* Weeks */}
            <View style={s.weeksContainer}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={s.weekCol}>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const day = week[dayIndex];
                    if (!day) {
                      return <View key={dayIndex} style={[s.emptyCell, { backgroundColor: 'transparent' }]} />;
                    }
                    return (
                      <View
                        key={dayIndex}
                        style={[s.cell, { backgroundColor: getIntensityColor(day.count, colors) }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={s.legendRow}>
            <Text style={s.legendText}>Less</Text>
            {[0, 1, 3, 5, 7].map((level) => (
              <View key={level} style={[s.cell, { backgroundColor: getIntensityColor(level, colors) }]} />
            ))}
            <Text style={s.legendText}>More</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (colors) => StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scrollContent: {
    paddingBottom: 8,
    paddingRight: 16,
    paddingLeft: 16,
  },
  monthsRow: {
    flexDirection: 'row',
    marginBottom: 6,
    marginLeft: 26, // Offset for day labels
  },
  monthText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
  },
  daysCol: {
    justifyContent: 'space-between',
    height: 102, // 12 (height) * 7 + 3 (gap) * 6
    width: 22, // fixed width to prevent overlap
    marginRight: 4,
    paddingTop: 0,
  },
  dayText: {
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 12,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  weekCol: {
    flexDirection: 'col',
    gap: 3,
  },
  emptyCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginBottom: 3,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    borderLeftColor: 'rgba(255,255,255,0.02)',
    borderBottomColor: 'rgba(0,0,0,0.3)',
    borderRightColor: 'rgba(0,0,0,0.2)',
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginBottom: 3,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.3)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});

export default LeetCodeHeatmap;
