import { useState } from 'react';
import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';
import RankBadge from './RankBadge';
import { RotateCcw, Volume2, VolumeX, Music, ChevronDown, Lock, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const ProgressHUD = () => {
  const { 
    totalXP = 0, 
    coins = 0, 
    completedWorlds = [], 
    unlockedWorlds = ['arrays'],
    resetProgress,
    isAudioMuted = false,
    toggleAudioMute,
    selectedAudioTrack,
    setSelectedAudioTrack,
    questionMode = 'blind75',
    setQuestionMode,
    unlockedAudioTracks = [],
    unlockTrackWithCoins
  } = useRoadmapStore();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showMusicDropdown, setShowMusicDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const AVAILABLE_AUDIO_KEYS = ['arrays', 'two-pointers', 'sliding-window', 'stacks', 'linked-lists', 'trees', 'graphs'];
  const audioWorlds = WORLDS.filter(world => AVAILABLE_AUDIO_KEYS.includes(world.id));
  const unlockedAudioCount = audioWorlds.filter(world => unlockedWorlds.includes(world.id) || unlockedAudioTracks.includes(world.id)).length;

  const totalWorldsCount = WORLDS.length;
  const clearedCount = completedWorlds.length;

  const handleResetClick = () => {
    setShowConfirmReset(true);
  };

  const confirmReset = () => {
    resetProgress();
    setShowConfirmReset(false);
    toast.success('Roadmap progress reset successfully!');
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-dark-950/70 border-b border-white/10 backdrop-blur-xl px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        {/* Left Column: Worlds Cleared Progress Meter */}
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-300">🌍 Worlds Cleared</span>
            <span className="text-xs text-dark-400">({clearedCount} / {totalWorldsCount})</span>
          </div>

          {/* Gamified Segmented Progress Meter */}
          <div className="flex items-center gap-1.5 mt-1 w-full max-w-[280px]">
            {Array.from({ length: totalWorldsCount }).map((_, idx) => {
              const isCompleted = idx < clearedCount;
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${
                    isCompleted
                      ? 'bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.6)]'
                      : 'bg-white/10 border border-white/5'
                  }`}
                  title={isCompleted ? `World ${idx + 1} Cleared` : `World ${idx + 1} Locked`}
                />
              );
            })}
          </div>
        </div>

        {/* Middle/Right Column: Stats & Rank Badge */}
        <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-6 w-full sm:w-auto">
          {/* Total XP Container */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all duration-300">
            <span className="text-lg">✨</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">Total XP</span>
              <span className="text-sm text-neon-green font-bold font-mono">
                {totalXP.toLocaleString()} <span className="text-xs text-dark-400">XP</span>
              </span>
            </div>
          </div>

          {/* Gold Coins Container */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all duration-300">
            <span className="text-lg animate-[spin_4s_linear_infinite]">🪙</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">Coins</span>
              <span className="text-sm text-amber-400 font-bold font-mono">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Rank Badge */}
          <RankBadge xp={totalXP} />

          {/* Question Count Mode Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              title="Select Question Set"
              className={`p-2 border rounded-2xl flex items-center gap-1.5 transition-all duration-300 ${
                questionMode !== 'blind75'
                  ? 'bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border-neon-green/30' 
                  : 'bg-white/5 hover:bg-white/10 text-dark-300 border-white/10'
              }`}
            >
              <Target size={16} />
              <span className="text-xs font-bold hidden md:inline">
                {questionMode === 'blind75' ? 'Blind 75' : questionMode === 'rabbit150' ? 'Rabbit 150' : 'Running Rabbit 175'}
              </span>
              <ChevronDown size={12} className={`opacity-60 transition-transform duration-300 ${showModeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown List */}
            {showModeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-0.5 select-none">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-dark-400 tracking-wider border-b border-white/5 mb-1">
                    Question Set
                  </div>

                  {/* Blind 75 */}
                  <button
                    onClick={() => {
                      setQuestionMode('blind75');
                      setShowModeDropdown(false);
                      toast.success("Switched to Blind 75 mode!");
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      questionMode === 'blind75' 
                        ? 'bg-neon-green/10 text-neon-green' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>Blind 75</span>
                      <span className="text-[9px] text-dark-400 font-normal">75 high-yield questions</span>
                    </div>
                    {questionMode === 'blind75' && <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_6px_rgba(57,255,20,0.8)]" />}
                  </button>

                  {/* Rabbit 150 */}
                  <button
                    onClick={() => {
                      setQuestionMode('rabbit150');
                      setShowModeDropdown(false);
                      toast.success("Switched to Rabbit 150 mode!");
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      questionMode === 'rabbit150' 
                        ? 'bg-neon-green/10 text-neon-green' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>Rabbit 150</span>
                      <span className="text-[9px] text-dark-400 font-normal">150 core pattern questions</span>
                    </div>
                    {questionMode === 'rabbit150' && <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_6px_rgba(57,255,20,0.8)]" />}
                  </button>

                  {/* Running Rabbit 175 */}
                  <button
                    onClick={() => {
                      setQuestionMode('running175');
                      setShowModeDropdown(false);
                      toast.success("Switched to Running Rabbit 175 mode!");
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      questionMode === 'running175' 
                        ? 'bg-neon-green/10 text-neon-green' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>Running Rabbit 175</span>
                      <span className="text-[9px] text-dark-400 font-normal">175 advanced DSA questions</span>
                    </div>
                    {questionMode === 'running175' && <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_6px_rgba(57,255,20,0.8)]" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Soundtrack Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMusicDropdown(!showMusicDropdown)}
              title="Select Soundtrack"
              className={`p-2 border rounded-2xl flex items-center gap-1.5 transition-all duration-300 ${
                selectedAudioTrack 
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' 
                  : 'bg-white/5 hover:bg-white/10 text-dark-300 border-white/10'
              }`}
            >
              <Music size={16} />
              <span className="text-xs font-bold hidden md:inline">
                {selectedAudioTrack 
                  ? WORLDS.find(w => w.id === selectedAudioTrack)?.name || "Soundtrack"
                  : "Auto Sync"
                }
              </span>
              <ChevronDown size={12} className={`opacity-60 transition-transform duration-300 ${showMusicDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown List */}
            {showMusicDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMusicDropdown(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-slate-900/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-0.5 max-h-72 overflow-y-auto custom-scrollbar select-none">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-dark-400 tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
                    <span>Soundtracks</span>
                    <span className="text-amber-400 font-mono">{unlockedAudioCount} / {audioWorlds.length} unlocked</span>
                  </div>

                  {/* Auto Scroll Track */}
                  <button
                    onClick={() => {
                      setSelectedAudioTrack(null);
                      setShowMusicDropdown(false);
                      toast.success("Soundtrack set to Auto Scroll Sync");
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      !selectedAudioTrack 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      <span>Auto Scroll Sync</span>
                    </div>
                    {!selectedAudioTrack && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]" />}
                  </button>

                  {/* Individual Tracks */}
                  {audioWorlds.map((world) => {
                    const isUnlocked = unlockedWorlds.includes(world.id) || unlockedAudioTracks.includes(world.id);
                    const isSelected = selectedAudioTrack === world.id;

                    // Calculate early unlock coin cost: distance from highest unlocked world * 200
                    const highestUnlocked = unlockedWorlds[unlockedWorlds.length - 1] || 'arrays';
                    const highestUnlockedIdx = WORLDS.findIndex(w => w.id === highestUnlocked);
                    const targetIdx = WORLDS.findIndex(w => w.id === world.id);
                    const distance = targetIdx - highestUnlockedIdx;
                    const coinCost = Math.max(0, distance * 200);

                    return (
                      <div
                        key={world.id}
                        className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                          isSelected ? 'bg-amber-500/10 text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        {/* Unlocked -> Click to select track. Locked -> Display name greyed out */}
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              setSelectedAudioTrack(world.id);
                              setShowMusicDropdown(false);
                              toast.success(`Playing: ${world.name} Theme`);
                            }}
                            className="flex-1 text-left flex items-center gap-2 hover:text-white transition-colors"
                          >
                            <span>{world.emoji || '🎵'}</span>
                            <span className="truncate max-w-[110px]">{world.name}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 opacity-50 select-none">
                            <span>{world.emoji || '🎵'}</span>
                            <span className="truncate max-w-[100px]">{world.name}</span>
                          </div>
                        )}

                        {/* Status Marker / Purchase Button */}
                        {isSelected ? (
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                        ) : !isUnlocked ? (
                          <button
                            disabled={coins < coinCost}
                            onClick={() => {
                              unlockTrackWithCoins(world.id, coinCost);
                              toast.success(`Unlocked early: ${world.name} Theme for 🪙 ${coinCost}!`);
                            }}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 shrink-0 ${
                              coins >= coinCost
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 active:scale-95'
                                : 'bg-white/5 text-dark-500 border-white/5 cursor-not-allowed opacity-50'
                            }`}
                            title={coins >= coinCost ? `Unlock early for ${coinCost} coins` : `Requires ${coinCost} coins (You have ${coins})`}
                          >
                            <span>🪙</span>
                            <span>{coinCost}</span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Audio Mute/Unmute Control */}
          <button
            onClick={toggleAudioMute}
            title={isAudioMuted ? "Unmute Ambient Music" : "Mute Ambient Music"}
            className={`p-2 border rounded-2xl transition-all duration-300 shrink-0 ${
              isAudioMuted 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30' 
                : 'bg-white/5 hover:bg-white/10 text-dark-300 border-white/10'
            }`}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Developer Reset Action */}
          <button
            onClick={handleResetClick}
            title="Reset All Progress"
            className="p-2 bg-white/5 hover:bg-red-500/20 text-dark-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-2xl transition-all duration-300 shrink-0"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ── Custom Reset Confirmation Modal ── */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col items-center animate-slide-up">
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
              <RotateCcw size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            {/* Warning Message */}
            <h3 className="font-extrabold text-white text-lg mb-2">Reset All Progress?</h3>
            <p className="text-xs text-dark-400 leading-relaxed mb-6">
              Are you sure you want to reset all roadmap progress, XP, levels, and coins? This action is permanent and cannot be undone.
            </p>

            {/* Actions Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/15 hover:shadow-red-500/25 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgressHUD;
