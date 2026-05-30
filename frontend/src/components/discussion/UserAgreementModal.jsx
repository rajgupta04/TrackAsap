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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-dark-900/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Gradient accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all z-10"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-emerald-500/20 flex items-center justify-center border border-neon-green/30">
                  <Shield className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Community Agreement</h2>
                  <p className="text-sm text-dark-400">Please review before joining</p>
                </div>
              </div>

              <p className="text-dark-300 text-sm mb-5 leading-relaxed">
                Our discussion board is a safe space for sharing your 75-day journey. 
                To keep it positive and productive, we ask everyone to follow these guidelines:
              </p>

              {/* Guidelines */}
              <div className="space-y-3 mb-6">
                {guidelines.map((guideline, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/30"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${guideline.color}15`, border: `1px solid ${guideline.color}30` }}
                    >
                      <guideline.icon size={16} style={{ color: guideline.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{guideline.title}</h3>
                      <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">{guideline.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  <span className="font-semibold">Violation of these guidelines</span> may result in your account being{' '}
                  <span className="font-semibold text-red-400">permanently banned</span> from the community and the platform.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mb-5">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    agreed
                      ? 'bg-neon-green border-neon-green'
                      : 'border-dark-500 group-hover:border-dark-400'
                  }`}
                >
                  {agreed && <CheckCircle2 size={14} className="text-dark-950" />}
                </div>
                <span className="text-sm text-dark-300 group-hover:text-white transition-colors">
                  I agree to follow the community guidelines and understand that violations may lead to account suspension.
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!agreed || isSubmitting}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
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
