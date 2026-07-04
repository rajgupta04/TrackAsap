/**
 * Format a Date object or string to YYYY-MM-DD format (ISO date string)
 * Required by daily log backend API
 */
export const formatToISODate = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get display friendly string (e.g. "Today", "Yesterday", or "Jul 3, 2026")
 */
export const getFriendlyDateString = (dateString) => {
  const today = formatToISODate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatToISODate(yesterdayDate);

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';

  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default {
  formatToISODate,
  getFriendlyDateString,
};
