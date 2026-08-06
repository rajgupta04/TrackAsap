import { motion } from 'framer-motion';
import { Lock, Check, Star } from 'lucide-react';

const WorldNode = ({ 
  world, 
  index, 
  isUnlocked, 
  isCompleted, 
  progress, 
  onClick 
}) => {
  const { solved, total, percentage } = progress;
  const isEven = index % 2 === 0;

  // Circular progress settings for the node edge
  const radius = 46;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animation variants
  const nodeVariants = {
    locked: { scale: 0.95, opacity: 0.4 },
    unlocked: { scale: 1, opacity: 1 },
    hover: { 
      scale: 1.08,
      boxShadow: `0 0 25px ${world.theme.glowColor}`,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center my-6 select-none ${
        isEven ? 'self-start sm:ml-[25%]' : 'self-end sm:mr-[25%]'
      }`}
    >
      {/* Interactive Node Wrapper */}
      <motion.div
        initial="locked"
        animate={isUnlocked ? 'unlocked' : 'locked'}
        whileHover={isUnlocked ? 'hover' : {}}
        variants={nodeVariants}
        onClick={isUnlocked ? onClick : undefined}
        className={`relative w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-500 cursor-pointer ${
          isCompleted 
            ? 'border-yellow-400/90 shadow-[0_0_20px_rgba(251,191,36,0.35)]' 
            : isUnlocked 
              ? 'border-white/20' 
              : 'border-white/5 cursor-not-allowed bg-black/40'
        }`}
        style={{
          background: isUnlocked 
            ? `radial-gradient(circle, ${world.theme.nodeColor}33 0%, #1e1f31dd 100%)`
            : 'rgba(15, 23, 42, 0.6)'
        }}
      >
        {/* Pulsing Active Highlight */}
        {isUnlocked && !isCompleted && (
          <div 
            className="absolute -inset-2 rounded-full border border-dashed animate-spin" 
            style={{ 
              borderColor: world.theme.nodeColor,
              animationDuration: '20s',
              filter: `drop-shadow(0 0 6px ${world.theme.nodeColor})`
            }}
          />
        )}

        {/* SVG Progress Ring */}
        {isUnlocked && (
          <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none">
            <circle
              cx="54"
              cy="54"
              r={radius}
              className="stroke-white/5 fill-none"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="54"
              cy="54"
              r={radius}
              className="fill-none transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                stroke: isCompleted ? '#fbbf24' : world.theme.nodeColor,
                filter: isCompleted 
                  ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' 
                  : `drop-shadow(0 0 4px ${world.theme.nodeColor})`
              }}
            />
          </svg>
        )}

        {/* World Emoji or Lock Overlay */}
        <div className="flex flex-col items-center justify-center text-center z-10">
          {!isUnlocked ? (
            <Lock className="w-7 h-7 text-dark-500 animate-pulse" />
          ) : (
            <span className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>
              {world.emoji}
            </span>
          )}

          {/* Miniature Completion Badge */}
          {isCompleted && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-dark-950 font-bold p-1 rounded-full border border-yellow-300 shadow-md transform rotate-12 scale-90 animate-bounce">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Floating Info Tooltip on Hover */}
      {isUnlocked && (
        <div 
          className={`absolute top-0 opacity-0 hover:opacity-100 peer-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 invisible hover:visible bg-dark-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-20 w-72 backdrop-blur-xl pointer-events-none ${
            isEven ? 'left-32' : 'right-32'
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-1.5">
            <h4 className="font-bold text-white text-sm">{world.name}</h4>
            <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-dark-400">
              {world.estimatedTime}
            </span>
          </div>

          <p className="text-xs text-dark-400 leading-relaxed mb-3">{world.description}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-white/5 pt-2.5">
            <div>
              <span className="text-dark-500 block">SOLVED</span>
              <span className="text-white font-bold">{solved} / {total} levels</span>
            </div>
            <div>
              <span className="text-dark-500 block">DIFFICULTY</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${
                      i < world.difficulty 
                        ? 'fill-amber-400 stroke-amber-400' 
                        : 'stroke-dark-600'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldNode;
