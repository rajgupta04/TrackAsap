import { create } from 'zustand';

export const THEMES = [
  {
    id: 'obsidian',
    legacyIds: ['vercel'],
    name: 'Emerald Obsidian',
    tag: 'Default • High Contrast',
    description: 'Pitch OLED black with precision emerald accents. Sharp, high-contrast engineering aesthetic.',
    colors: {
      bg: '#000000',
      surface: '#0a0a0a',
      card: '#121212',
      accent: '#10b981',
    },
  },
  {
    id: 'carbon',
    legacyIds: ['linear'],
    name: 'Indigo Carbon',
    tag: 'Minimalist Dark',
    description: 'Matte carbon black with refined electric indigo accents. Clean, modern, and distraction-free.',
    colors: {
      bg: '#0c0d10',
      surface: '#13151b',
      card: '#1b1e27',
      accent: '#6366f1',
    },
  },
  {
    id: 'midnight',
    legacyIds: ['tokyo'],
    name: 'Midnight Slate',
    tag: 'Deep Focus',
    description: 'Warm slate navy with soft pastel mint & lavender tones. Easy on the eyes for extended coding sessions.',
    colors: {
      bg: '#16161e',
      surface: '#1a1b26',
      card: '#24283b',
      accent: '#73daca',
    },
  },
  {
    id: 'amber',
    legacyIds: ['stripe'],
    name: 'Graphite Amber',
    tag: 'Classic Warmth',
    description: 'Deep graphite slate with warm amber accents. Polished and authoritative craftsmanship.',
    colors: {
      bg: '#0d1117',
      surface: '#161b22',
      card: '#21262d',
      accent: '#f59e0b',
    },
  },
  {
    id: 'matrix',
    legacyIds: ['cyberpunk'],
    name: 'Matrix Neon',
    tag: 'Vibrant Glow',
    description: 'Vibrant radioactive neon-green on deep void black. High energy and retro-futuristic.',
    colors: {
      bg: '#020617',
      surface: '#0f172a',
      card: '#1e293b',
      accent: '#39ff14',
    },
  },
];

const getInitialTheme = () => {
  const saved = localStorage.getItem('trackasap_theme');
  if (saved) {
    const match = THEMES.find((t) => t.id === saved || t.legacyIds?.includes(saved));
    if (match) return match.id;
  }
  return 'obsidian'; // Default to Emerald Obsidian (Supabase OLED black aesthetic)
};

export const useThemeStore = create((set) => ({
  currentTheme: getInitialTheme(),
  isThemeModalOpen: false,

  setTheme: (themeId) => {
    const themeObj = THEMES.find((t) => t.id === themeId || t.legacyIds?.includes(themeId));
    if (!themeObj) return;
    const resolvedId = themeObj.id;
    localStorage.setItem('trackasap_theme', resolvedId);
    document.documentElement.setAttribute('data-theme', resolvedId);
    set({ currentTheme: resolvedId });
  },

  openThemeModal: () => set({ isThemeModalOpen: true }),
  closeThemeModal: () => set({ isThemeModalOpen: false }),
}));

// Apply theme on module load
if (typeof document !== 'undefined') {
  const initial = getInitialTheme();
  document.documentElement.setAttribute('data-theme', initial);
}
