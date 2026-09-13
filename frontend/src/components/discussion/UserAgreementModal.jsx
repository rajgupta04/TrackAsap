import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  X,
  Heart,
  MessageSquare,
  Users,
  Ban,
} from 'lucide-react';

const guidelines = [
  {
    icon: Heart,
    title: 'Be Respectful & Supportive',
    description: 'Treat every member with kindness. Encourage others on their journey and celebrate their progress.',
    color: '#FF6B6B',
  },
  {
    icon: MessageSquare,
    title: 'No Misleading Content',
    description: 'Share only genuine experiences and accurate information. Do not post misleading advice or fake progress.',
    color: '#4ECDC4',
  },
  {
    icon: Users,
    title: 'No Harassment or Hate',
    description: 'Bullying, discrimination, hate speech, or personal attacks of any kind are strictly prohibited.',
    color: '#45B7D1',
  },
  {
    icon: Ban,
    title: 'No Harmful or Inappropriate Content',
    description: 'Do not share NSFW, violent, spam, or any content that could harm the community environment.',
    color: '#F7DC6F',
  },
];

const UserAgreementModal = ({ isOpen, onAccept, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    setIsSubmitting(true);
    await onAccept();
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-dark-900/95 backdrop-blur-xl border border-dark-700/60 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto"
          >
            {/* Top accent gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 shrink-0" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all z-20 cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2 pr-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-emerald-500/20 flex items-center justify-center border border-neon-green/30 shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-neon-green" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                    Community Agreement
                  </h2>
                  <p className="text-xs sm:text-sm text-dark-400">Please review before joining</p>
                </div>
              </div>

              <p className="text-dark-300 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed">
                Our discussion board is a safe space for sharing your 75-day journey. To keep it positive
                and productive, we ask everyone to follow these guidelines:
              </p>

              {/* Guidelines List */}
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                {guidelines.map((guideline, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl bg-dark-800/60 border border-dark-700/40 hover:border-dark-600/60 transition-colors"
                  >
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${guideline.color}15`,
                        border: `1px solid ${guideline.color}30`,
                      }}
                    >
                      <guideline.icon size={15} style={{ color: guideline.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-white">
                        {guideline.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-dark-400 mt-0.5 leading-relaxed">
                        {guideline.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warning Box */}
              <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-4 sm:mb-5">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300">Violation of these guidelines</span> may
                  result in your account being{' '}
                  <span className="font-bold text-red-400">permanently banned</span> from the community and
                  the platform.
                </p>
              </div>

              {/* Checkbox Agreement */}
              <label
                onClick={() => setAgreed(!agreed)}
                className="flex items-start gap-2.5 sm:gap-3 cursor-pointer group mb-4 sm:mb-5 select-none"
              >
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5 ${
                    agreed
                      ? 'bg-neon-green border-neon-green shadow-sm shadow-neon-green/30'
                      : 'border-dark-500 group-hover:border-dark-400 bg-dark-800/50'
                  }`}
                >
                  {agreed && <CheckCircle2 size={13} className="text-dark-950 stroke-[2.5]" />}
                </div>
                <span className="text-xs sm:text-sm text-dark-300 group-hover:text-white transition-colors leading-snug">
                  I agree to follow the community guidelines and understand that violations may lead to
                  account suspension.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-1 mt-auto shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs sm:text-sm font-medium transition-all text-center cursor-pointer active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!agreed || isSubmitting}
                  className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer ${
                    agreed && !isSubmitting
                      ? 'bg-gradient-to-r from-neon-green to-emerald-500 text-dark-950 hover:shadow-lg hover:shadow-neon-green/25 active:scale-[0.98]'
                      : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                      <span>Joining...</span>
                    </div>
                  ) : (
                    'Accept & Join Community'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserAgreementModal;
