import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Copy, Check, Star, Target, Zap, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ElectricBorder from './ElectricBorder';
import toast from 'react-hot-toast';

// ─── The actual card UI (rendered both on-screen & captured for PNG) ──────────
const ShareCardContent = ({ user, avatarSrc, currentUserRanks, totalSolved, streak, aggregateContests, platformRatings, topSheets }) => (
  <div
    id="profile-share-card-inner"
    style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #0d1117 0%, #161b2e 60%, #0d1117 100%)' }}
    className="p-6 rounded-2xl space-y-5 w-full relative overflow-hidden"
  >
    {/* Background glow blobs */}
    <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-[#FFA116]/5 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-neon-green/5 blur-3xl pointer-events-none" />

    {/* Header: avatar + name + rank + logo */}
    <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative z-10">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FFA116]/60 shrink-0 shadow-lg shadow-[#FFA116]/20">
        {avatarSrc ? (
          <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full bg-[#1a2540] flex items-center justify-center text-[#FFA116] font-bold text-xl">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-white truncate leading-tight">{user?.name || 'User'}</h3>
        <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
          🏆 TrackAsap Rank:
          <span className="text-[#39FF14] font-bold ml-1">#{currentUserRanks?.global || '--'}</span>
        </p>
      </div>
      <img src="/logoSmall.png" alt="TrackAsap" className="w-8 h-8 opacity-60 shrink-0" crossOrigin="anonymous" />
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-3 relative z-10">
      {[
        { val: totalSolved, label: 'SOLVED', color: '#FFA116' },
        { val: streak?.longestStreak || 0, label: 'STREAK', color: '#f97316' },
        { val: aggregateContests, label: 'CONTESTS', color: '#a78bfa' },
      ].map(({ val, label, color }) => (
        <div key={label} className="bg-white/5 border border-white/8 p-3 rounded-xl text-center">
          <div className="text-2xl font-black leading-none" style={{ color }}>{val}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-1">{label}</div>
        </div>
      ))}
    </div>

    {/* Platform ratings */}
    {platformRatings.length > 0 && (
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5 relative z-10">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-white/5 pb-2">
          <Star className="w-3.5 h-3.5" /> Best Contest Ratings
        </div>
        {platformRatings.map(({ name, rating, color }) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{name}</span>
            <span className="text-sm font-bold" style={{ color }}>⭐ {rating}</span>
          </div>
        ))}
      </div>
    )}

    {/* Top sheets */}
    {topSheets.length > 0 && (
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5 relative z-10">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-white/5 pb-2">
          <Target className="w-3.5 h-3.5" /> Top Sheets
        </div>
        {topSheets.map((sheet, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white truncate pr-2">{sheet.name}</span>
              <span className="text-xs font-bold text-[#39FF14] shrink-0">{sheet.completionPercentage || 0}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#39FF14] rounded-full transition-all" style={{ width: `${sheet.completionPercentage || 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Footer watermark */}
    <div className="flex items-center justify-center gap-2 pt-1 relative z-10">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[10px] text-gray-600 font-semibold tracking-widest uppercase">trackasap.in</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  </div>
);

// ─── Share Modal ─────────────────────────────────────────────────────────────
const ShareModal = ({ onClose, cardRef }) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'trackasap-profile.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch (e) {
      toast.error('Download failed, try again');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://trackasap.in');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'trackasap-profile.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My TrackAsap Profile',
            text: '🚀 Check out my coding stats on TrackAsap – your all-in-one competitive programming tracker!\n\nhttps://trackasap.in',
            files: [file],
          });
        } else {
          handleDownload();
        }
      });
    } catch (e) {
      // user cancelled or error
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
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Modal header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFA116]/15 border border-[#FFA116]/20 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-[#FFA116]" />
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

          {/* Ad / promo section */}
          <div className="p-5 space-y-4">
            <div className="bg-gradient-to-br from-[#FFA116]/10 to-[#39FF14]/5 border border-[#FFA116]/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <img src="/logoSmall.png" alt="TrackAsap" className="w-6 h-6" />
                <span className="text-sm font-bold text-white">TrackAsap</span>
                <span className="text-[10px] bg-[#39FF14]/15 text-[#39FF14] px-2 py-0.5 rounded-full font-semibold">FREE</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Track LeetCode, Codeforces & CodeChef all in one place. Contests, streaks, ratings, sheets — everything on one dashboard.
              </p>
              <a
                href="https://trackasap.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#FFA116] font-semibold hover:underline"
              >
                🔗 trackasap.in
              </a>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFA116]/15 hover:bg-[#FFA116]/25 border border-[#FFA116]/30 text-[#FFA116] rounded-xl transition-all text-sm font-semibold disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Saving…' : 'Download'}
              </button>
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/25 text-[#39FF14] rounded-xl transition-all text-sm font-semibold"
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
const ProfileShareCard = ({ user, avatarSrc, currentUserRanks, totalSolved, streak, aggregateContests, platformRatings, topSheets }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef(null);

  return (
    <>
      <div className="space-y-3">
        <ElectricBorder
          color="#FFA116"
          speed={1}
          chaos={0.15}
          thickness={2}
          style={{ borderRadius: 16 }}
        >
          <div ref={cardRef}>
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
          </div>
        </ElectricBorder>

        {/* Share button below the card */}
        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FFA116]/10 hover:bg-[#FFA116]/20 border border-[#FFA116]/25 text-[#FFA116] rounded-xl transition-all text-sm font-semibold group"
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
