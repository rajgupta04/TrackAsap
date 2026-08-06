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
    locked: { scale: 0.95, filter: 'grayscale(1) opacity(0.35) contrast(0.8)' },
    unlocked: { scale: 1, filter: 'grayscale(0) opacity(1) contrast(1)' },
    hover: { 
      scale: 1.12,
      filter: 'grayscale(0) opacity(1) drop-shadow(0 0 15px rgba(255,255,255,0.25))',
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center my-3 select-none ${
        isEven ? 'self-start sm:ml-[10%]' : 'self-end sm:mr-[10%]'
      }`}
    >
      {/* Interactive Island Wrapper */}
      <motion.div
        id={`node-world-${world.id}`}
        initial="locked"
        animate={isUnlocked ? 'unlocked' : 'locked'}
        whileHover={isUnlocked ? 'hover' : {}}
        variants={nodeVariants}
        onClick={isUnlocked ? onClick : undefined}
        className="relative w-64 h-48 sm:w-80 sm:h-60 flex items-center justify-center transition-all duration-500 cursor-pointer"
      >
        {/* Floating Island Image Asset */}
        <img
          src={`/assets/roadmap/${world.image || `island_${world.id}.png`}`}
          alt={world.name}
          className="max-w-full max-h-full object-contain pointer-events-none"
        />

        {/* Lock Overlay on top of the island */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 border border-white/10 p-2.5 rounded-2xl backdrop-blur-sm shadow-xl">
              <Lock className="w-5 h-5 text-dark-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Completion Checkmark Badge floating in the air */}
        {isCompleted && (
          <div className="absolute top-4 right-12 bg-yellow-500 text-dark-950 font-bold p-1 rounded-full border border-yellow-300 shadow-md transform rotate-12 scale-90 animate-bounce z-20">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </motion.div>

      {/* World Name Label Below the Island */}
      <div className={`mt-1 bg-black/40 border border-white/5 px-3 py-1 rounded-xl text-xs font-bold text-center z-10 backdrop-blur-sm transition-all ${
        isCompleted ? 'text-yellow-400 border-yellow-500/20' : isUnlocked ? 'text-white font-medium' : 'text-dark-500 font-medium'
      }`}>
        {world.name}
      </div>

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
