/**
 * Interview Panelists Configuration
 * Defines the Multi-Panel technical board members, their roles, voice calibrations, and visual themes.
 */

export const INTERVIEW_PANELISTS = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    shortName: 'Alex',
    role: 'Lead Systems Architect',
    badge: 'SYSTEMS ARCHITECT',
    gender: 'male',
    color: '#06b6d4', // Cyan
    accentBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    avatarEmoji: '⚡',
    pitch: 0.94,
    rate: 1.02,
    voicePreferences: [
      'alex',
      'ryan online (natural)',
      'guy online (natural)',
      'christopher online (natural)',
      'google us english male',
      'daniel',
      'george',
      'male',
    ],
  },
  {
    id: 'bella',
    name: 'Dr. Bella Chen',
    shortName: 'Dr. Bella',
    role: 'Staff Algorithms Lead',
    badge: 'ALGORITHMS LEAD',
    gender: 'female',
    color: '#ec4899', // Pink / Fuchsia
    accentBg: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    avatarEmoji: '🧠',
    pitch: 1.04,
    rate: 1.02,
    voicePreferences: [
      'jenny online (natural)',
      'aria online (natural)',
      'samantha',
      'victoria',
      'google us english female',
      'zira',
      'female',
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    shortName: 'Marcus',
    role: 'Director of Engineering',
    badge: 'HIRING MANAGER',
    gender: 'male',
    color: '#f59e0b', // Amber / Gold
    accentBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    avatarEmoji: '💼',
    pitch: 0.88,
    rate: 0.98,
    voicePreferences: [
      'david',
      'mark',
      'george',
      'google uk english male',
      'oliver',
      'male',
    ],
  },
  {
    id: 'sophia',
    name: 'Sophia Sterling',
    shortName: 'Sophia',
    role: 'Principal Infrastructure Lead',
    badge: 'INFRASTRUCTURE LEAD',
    gender: 'female',
    color: '#10b981', // Emerald / Mint
    accentBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    avatarEmoji: '🛡️',
    pitch: 1.01,
    rate: 1.00,
    voicePreferences: [
      'karen',
      'hazel',
      'sonia',
      'google uk english female',
      'susan',
      'zira',
      'female',
    ],
  },
];

export const getPanelistById = (id) => {
  return INTERVIEW_PANELISTS.find((p) => p.id === id) || INTERVIEW_PANELISTS[0];
};
