import { useState, useCallback } from 'react';
import taskService from '../services/taskService';
import { formatToISODate } from '../utils/dateUtils';

export const useTasks = () => {
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all daily logs
   */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskService.getAllLogs();
      const data = res.data || res;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch daily logs');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch user streak summary
   */
  const fetchStreak = useCallback(async () => {
    try {
      const res = await taskService.getStreak();
      const data = res.data || res;
      if (data) {
        setStreak({
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching streak:', err);
    }
  }, []);

  /**
   * Fetch weekly summary
   */
  const fetchWeeklySummary = useCallback(async () => {
    try {
      const res = await taskService.getWeeklySummary();
      const data = res.data || res;
      setWeeklySummary(data);
    } catch (err) {
      console.error('Error fetching weekly summary:', err);
    }
  }, []);

  /**
   * Save or update daily log entry
   */
  const saveTaskLog = useCallback(async (logData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskService.saveDailyLog(logData);
      const saved = res.data || res;
      // Refresh local logs list
      setLogs((prev) => {
        const filtered = prev.filter(
          (l) => formatToISODate(l.date) !== formatToISODate(logData.date)
        );
        return [saved, ...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
      });
      return { success: true, data: saved };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to save daily log';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    streak,
    weeklySummary,
    loading,
    error,
    fetchLogs,
    fetchStreak,
    fetchWeeklySummary,
    saveTaskLog,
  };
};

export default useTasks;
