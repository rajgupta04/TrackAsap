import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

// Client-side SHA-1 calculation using browser crypto API
async function sha1(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Memory cache for HIBP range queries
const hibpCache = new Map();

export const PasswordStrengthMeter = ({ password = '', onScoreChange }) => {
  const [pwnedCount, setPwnedCount] = useState(null);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const checkTimeoutRef = useRef(null);

  // Criteria calculations
  const criteria = useMemo(() => {
    return [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
      { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
      { label: 'Number (0-9)', met: /[0-9]/.test(password) },
      { label: 'Special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  // Overall strength score (0 to 4)
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-dark-700' };

    const metCount = criteria.filter(c => c.met).length;

    if (password.length < 8) {
      return { score: 1, label: 'Too Short', color: 'bg-rose-500', text: 'text-rose-400' };
    }

    if (metCount <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    }
    if (metCount === 3) {
      return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    }
    if (metCount === 4) {
      return { score: 3, label: 'Good', color: 'bg-yellow-400', text: 'text-yellow-400' };
    }
    return { score: 4, label: 'Strong', color: 'bg-neon-green', text: 'text-neon-green' };
  }, [password, criteria]);

  // Notify parent of score change
  useEffect(() => {
    onScoreChange?.({
      score: strength.score,
      isPwned: Boolean(pwnedCount && pwnedCount > 0),
      isValid: password.length >= 8 && strength.score >= 2,
    });
  }, [strength.score, pwnedCount, password.length, onScoreChange]);

  // Debounced Have I Been Pwned check using k-Anonymity
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!password || password.length < 6) {
      setPwnedCount(null);
      setIsCheckingPwned(false);
      return;
    }

    setIsCheckingPwned(true);

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const hash = await sha1(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        let responseText = hibpCache.get(prefix);

        if (!responseText) {
          const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
              'Add-Padding': 'true', // Prevents response size analysis
            },
          });
          if (res.ok) {
            responseText = await res.text();
            hibpCache.set(prefix, responseText);
          }
        }

        if (responseText) {
          const lines = responseText.split('\n');
          let count = 0;
          for (const line of lines) {
            const [hashSuffix, occurences] = line.trim().split(':');
            if (hashSuffix === suffix) {
              count = parseInt(occurences, 10) || 0;
              break;
            }
          }
          setPwnedCount(count);
        }
      } catch (err) {
        // Fail silently if offline or blocked by adblockers
        setPwnedCount(null);
      } finally {
        setIsCheckingPwned(false);
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* 4-Segment Strength Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-dark-400">Password Strength</span>
          <span className={`font-bold transition-colors ${strength.text}`}>
            {strength.label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map(idx => (
            <div
              key={idx}
              className={`h-full rounded-full transition-all duration-300 ${
                idx <= strength.score ? strength.color : 'bg-dark-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              item.met ? 'text-neon-green' : 'text-dark-400'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-neon-green" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 text-dark-500" />
            )}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Have I Been Pwned Warning */}
      <AnimatePresence>
        {isCheckingPwned && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-dark-400 pt-1"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-dark-400" />
            <span>Checking security breaches...</span>
          </motion.div>
        )}

        {pwnedCount && pwnedCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-200">
                Pwned Password Detected!
              </p>
              <p className="text-[11px] text-rose-300/90 mt-0.5 leading-snug">
                This password has appeared in <strong className="text-white font-bold">{pwnedCount.toLocaleString()}</strong> data breaches. While not blocked, we strongly advise choosing a unique password.
              </p>
            </div>
          </motion.div>
        ) : pwnedCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>No breaches found — good security!</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default PasswordStrengthMeter;
