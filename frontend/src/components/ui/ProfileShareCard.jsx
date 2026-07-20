import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Copy, Check, Star, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ElectricBorder from './ElectricBorder';
import toast from 'react-hot-toast';

// ─── Card content (used both on-screen & captured for PNG) ───────────────────
const ShareCardContent = ({
  user, avatarSrc, currentUserRanks,
  totalSolved, streak, aggregateContests,
  platformRatings, topSheets,
}) => (
  <div
    style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: 'linear-gradient(160deg, #0b0f1a 0%, #0d1421 50%, #0b0f1a 100%)',
      width: '100%',
      padding: '24px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
    }}
  >
    {/* Subtle glow blobs */}
    <div style={{
      position: 'absolute', top: '-40px', left: '-40px',
      width: '200px', height: '200px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(57,255,20,0.06) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: '-40px', right: '-40px',
      width: '180px', height: '180px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    {/* ── HEADER ── */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      paddingBottom: '18px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '18px',
      position: 'relative', zIndex: 1,
    }}>
      {/* Avatar */}
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: '2px solid rgba(57,255,20,0.4)',
        boxShadow: '0 0 16px rgba(57,255,20,0.15)',
      }}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar" crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: '#1a2540',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#39FF14', fontWeight: 700, fontSize: '20px',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Name + rank */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#ffffff', fontWeight: 700, fontSize: '17px',
          lineHeight: 1.2, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '4px',
        }}>
          {user?.name || 'User'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>TrackAsap Rank</span>
          <span style={{
            fontSize: '13px', fontWeight: 700, color: '#39FF14',
            background: 'rgba(57,255,20,0.08)',
            padding: '1px 8px', borderRadius: '20px',
            border: '1px solid rgba(57,255,20,0.2)',
          }}>
            #{currentUserRanks?.global || '--'}
          </span>
        </div>
      </div>

      {/* Logo */}
      <img
        src="/logoSmall.png"
        alt="TrackAsap"
        crossOrigin="anonymous"
        style={{ width: '32px', height: '32px', opacity: 0.7, flexShrink: 0, objectFit: 'contain' }}
      />
    </div>

    {/* ── STATS ROW ── */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px', marginBottom: '14px', position: 'relative', zIndex: 1,
    }}>
      {[
        { val: totalSolved,               label: 'SOLVED',   color: '#39FF14' },
        { val: streak?.longestStreak || 0, label: 'STREAK',   color: '#f97316' },
        { val: aggregateContests,          label: 'CONTESTS', color: '#a78bfa' },
      ].map(({ val, label, color }) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '12px 8px', textAlign: 'center',
        }}>
          <div style={{ color, fontSize: '24px', fontWeight: 900, lineHeight: 1 }}>{val}</div>
          <div style={{
            color: '#4b5563', fontSize: '8px', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px',
          }}>{label}</div>
        </div>
      ))}
    </div>

    {/* ── PLATFORM RATINGS ── */}
    {platformRatings.length > 0 && (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '14px',
        marginBottom: '14px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#6b7280', fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          paddingBottom: '10px', marginBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          ⭐ Best Contest Ratings
        </div>
        {platformRatings.map(({ name, rating, color }) => (
          <div key={name} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '8px',
          }}>
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>{name}</span>
            <span style={{ color, fontSize: '14px', fontWeight: 700 }}>⭐ {rating}</span>
          </div>
        ))}
      </div>
    )}

    {/* ── TOP SHEETS ── */}
    {topSheets.length > 0 && (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '14px',
        marginBottom: '16px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#6b7280', fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          paddingBottom: '10px', marginBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          🎯 Top Sheets
        </div>
        {topSheets.map((sheet, idx) => (
          <div key={idx} style={{ marginBottom: idx < topSheets.length - 1 ? '10px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{
                color: '#e5e7eb', fontSize: '12px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '75%',
              }}>{sheet.name}</span>
              <span style={{ color: '#39FF14', fontSize: '12px', fontWeight: 700 }}>
                {sheet.completionPercentage || 0}%
              </span>
            </div>
            <div style={{
              width: '100%', height: '4px',
              background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${sheet.completionPercentage || 0}%`,
                background: 'linear-gradient(90deg, #39FF14, #22c55e)',
                borderRadius: '4px',
              }} />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ── FOOTER ── */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      <span style={{
        color: '#374151', fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        track-asap.vercel.app
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
    </div>
  </div>
);

// ─── PNG capture helper ───────────────────────────────────────────────────────
const captureCard = async (element) => {
  return html2canvas(element, {
    backgroundColor: '#0b0f1a',
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 15000,
    onclone: (doc, cloned) => {
      // Make sure the cloned element has no transforms that would misplace it
      cloned.style.transform = 'none';
      cloned.style.position = 'static';
    },
  });
};

// ─── Share Modal ─────────────────────────────────────────────────────────────
const ShareModal = ({ onClose, cardRef }) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await captureCard(cardRef.current);
      const link = document.createElement('a');
      link.download = 'trackasap-profile.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch {
      toast.error('Download failed, try again');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://track-asap.vercel.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await captureCard(cardRef.current);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'trackasap-profile.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My TrackAsap Profile',
            text: '🚀 Check out my coding stats on TrackAsap – your all-in-one competitive programming tracker!\n\nhttps://track-asap.vercel.app',
            files: [file],
          });
        } else {
          handleDownload();
        }
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Share Your Profile</h3>
                <p className="text-xs text-gray-500">Flex your stats with friends</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/8 rounded-xl transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Promo card */}
            <div className="bg-gradient-to-br from-[#39FF14]/8 to-transparent border border-[#39FF14]/15 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <img src="/logoSmall.png" alt="TrackAsap" className="w-6 h-6" />
                <span className="text-sm font-bold text-white">TrackAsap</span>
                <span className="text-[10px] bg-[#39FF14]/15 text-[#39FF14] px-2 py-0.5 rounded-full font-semibold border border-[#39FF14]/20">FREE</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Track LeetCode, Codeforces & CodeChef all in one place. Contests, streaks, ratings, sheets — everything on one dashboard.
              </p>
              <a
                href="https://track-asap.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#39FF14] font-semibold hover:underline"
              >
                🔗 track-asap.vercel.app
              </a>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/25 text-[#39FF14] rounded-xl transition-all text-sm font-semibold disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Saving…' : 'Download'}
              </button>
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all text-sm font-semibold"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-[#39FF14]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Website Link'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main exported component ──────────────────────────────────────────────────
const ProfileShareCard = ({
  user, avatarSrc, currentUserRanks,
  totalSolved, streak, aggregateContests,
  platformRatings, topSheets,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  // Ref on the OUTER wrapper — captures full card including electric border
  const cardRef = useRef(null);

  return (
    <>
      <div className="space-y-3">
        {/* cardRef wraps ElectricBorder so PNG includes the glowing border */}
        <div ref={cardRef} className="rounded-2xl">
          <ElectricBorder color="#39FF14" speed={1} chaos={0.12} thickness={2} style={{ borderRadius: 16 }}>
            <ShareCardContent
              user={user}
              avatarSrc={avatarSrc}
              currentUserRanks={currentUserRanks}
              totalSolved={totalSolved}
              streak={streak}
              aggregateContests={aggregateContests}
              platformRatings={platformRatings}
              topSheets={topSheets}
            />
          </ElectricBorder>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#39FF14]/8 hover:bg-[#39FF14]/15 border border-[#39FF14]/20 text-[#39FF14] rounded-xl transition-all text-sm font-semibold group"
        >
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Share / Download Card
        </button>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal onClose={() => setShowShareModal(false)} cardRef={cardRef} />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileShareCard;

