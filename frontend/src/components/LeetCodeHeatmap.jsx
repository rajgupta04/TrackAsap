import { useMemo } from 'react';
import { motion } from 'framer-motion';

const LeetCodeHeatmap = ({ submissionCalendar }) => {
  const heatmapData = useMemo(() => {
    if (!submissionCalendar) {
      return [];
    }

    // Parse the submission calendar - it's a JSON string of timestamp: count pairs
    let calendarData = {};
    
    if (typeof submissionCalendar === 'string') {
      try {
        calendarData = JSON.parse(submissionCalendar);
      } catch (e) {
        console.error('Failed to parse calendar data:', e);
        return [];
      }
    } else if (typeof submissionCalendar === 'object') {
      calendarData = submissionCalendar;
    }

    // Check if we have any data
    const timestamps = Object.keys(calendarData);
    if (timestamps.length === 0) {
      return [];
    }

    // Create a map of all submissions by date string for easier lookup
    const submissionsByDate = {};
    timestamps.forEach((ts) => {
      const date = new Date(parseInt(ts) * 1000);
      const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      submissionsByDate[dateKey] = calendarData[ts];
    });

    // Get dates for the last 365 days
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const days = [];
    const currentDate = new Date(oneYearAgo);

    while (currentDate <= today) {
      // Create date key in local time
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      const count = submissionsByDate[dateKey] || 0;

      days.push({
        date: new Date(currentDate),
        count,
        dateKey,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [submissionCalendar]);

  const getColorClass = (count) => {
    if (count === 0) return 'bg-dark-700/50';
    if (count <= 1) return 'bg-green-900/60';
    if (count <= 3) return 'bg-green-700/70';
    if (count <= 5) return 'bg-green-500/80';
    return 'bg-green-400';
  };

  const getIntensityColor = (count) => {
    if (count === 0) return 'rgba(30, 41, 59, 0.5)';
    if (count <= 1) return 'rgba(20, 83, 45, 0.6)';
    if (count <= 3) return 'rgba(21, 128, 61, 0.7)';
    if (count <= 5) return 'rgba(34, 197, 94, 0.8)';
    return 'rgba(74, 222, 128, 1)';
  };

  // Group days by week
  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = [];

    // Fill initial empty days to align with week start
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

  // Get month labels
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

  const totalSubmissions = useMemo(() => {
    return heatmapData.reduce((sum, day) => sum + day.count, 0);
  }, [heatmapData]);

  // Check if we have any data with submissions
  const hasSubmissions = heatmapData.length > 0 && totalSubmissions > 0;

  if (heatmapData.length === 0 || !hasSubmissions) {
    // If we have the raw calendar data, show that there's an issue parsing it
    if (submissionCalendar && typeof submissionCalendar === 'string' && submissionCalendar.length > 10) {
      return (
        <div className="text-center py-4 text-dark-400 text-sm">
          Loading activity data...
        </div>
      );
    }
    return (
      <div className="text-center py-4 text-dark-400 text-sm">
        No submission data available
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h4 className="text-sm font-medium text-white">Activity Heatmap</h4>
        <span className="text-xs text-dark-400">
          {totalSubmissions} submissions in the last year
        </span>
      </div>

      {/* Scrollable container for heatmap */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
        <div className="min-w-[700px] md:min-w-0 md:w-full">
          {/* Month labels */}
          <div className="flex mb-1.5 md:mb-2 ml-7 md:ml-10">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-[10px] md:text-xs text-dark-400 font-medium"
                style={{
                  marginLeft: idx === 0 ? `${label.weekIndex * 11}px` : undefined,
                  width: idx < monthLabels.length - 1
                    ? `${(monthLabels[idx + 1].weekIndex - label.weekIndex) * 11}px`
                    : 'auto',
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels - hidden on very small screens */}
            <div className="hidden sm:flex flex-col justify-around text-[10px] md:text-xs text-dark-400 mr-2 md:mr-3 h-[70px] md:h-[98px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px] md:gap-[3px] flex-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px] md:gap-[3px]">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const day = week[dayIndex];
                    if (!day) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-[8px] h-[8px] md:w-[12px] md:h-[12px] rounded-[2px] md:rounded-sm bg-transparent"
                        />
                      );
                    }

                    return (
                      <motion.div
                        key={dayIndex}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: weekIndex * 0.003,
                          duration: 0.15,
                        }}
                        className="w-[8px] h-[8px] md:w-[12px] md:h-[12px] rounded-[2px] md:rounded-sm cursor-pointer hover:ring-1 md:hover:ring-2 hover:ring-white/40 hover:scale-110 md:hover:scale-125 transition-transform"
                        style={{ backgroundColor: getIntensityColor(day.count) }}
                        title={`${day.date.toLocaleDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 md:gap-2 mt-3 md:mt-4">
            <span className="text-[10px] md:text-xs text-dark-400 mr-0.5 md:mr-1">Less</span>
            {[0, 1, 3, 5, 7].map((level) => (
              <div
                key={level}
                className="w-[8px] h-[8px] md:w-[12px] md:h-[12px] rounded-[2px] md:rounded-sm"
                style={{ backgroundColor: getIntensityColor(level) }}
              />
            ))}
            <span className="text-[10px] md:text-xs text-dark-400 ml-0.5 md:ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeetCodeHeatmap;
