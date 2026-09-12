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
    pitch: 1.0,
    rate: 1.0,
    voicePreferences: [
      'ryan online (natural)',
      'guy online (natural)',
      'christopher online (natural)',
      'alex',
      'google us english',
      'daniel',
      'natural',
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
    pitch: 1.0,
    rate: 1.0,
    voicePreferences: [
      'jenny online (natural)',
      'aria online (natural)',
      'google us english female',
      'google uk english female',
      'samantha',
      'victoria',
      'natural',
      'female',
    ],
  },
];

export const getPanelistById = (id) => {
  return INTERVIEW_PANELISTS.find((p) => p.id === id) || INTERVIEW_PANELISTS[0];
};
