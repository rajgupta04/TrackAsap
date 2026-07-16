import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Save,
  Code2,
  Target,
  Loader2,
  Github,
  RefreshCw,
  Dumbbell,
  Unlink,
  ExternalLink,
  Puzzle,
  Download,
  Timer,
  Zap,
  Shield,
  ChevronRight,
  X,
  CheckCircle2,
  Copy,
  Check,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import githubService from '../services/githubService';
import GlassCard from '../components/ui/GlassCard';
import NumberInput from '../components/ui/NumberInput';

const TRACKEX_DOWNLOAD_URL = '/track-ex.zip';

const SETUP_STEPS = [
  {
    title: 'Download the Extension',
    desc: 'Download the track-ex.zip file and extract it on your computer.',
    icon: Download,
  },
  {
    title: 'Open Chrome Extensions',
    desc: 'Go to chrome://extensions/ in your browser and enable Developer Mode (toggle in the top-right corner).',
    icon: Puzzle,
  },
  {
    title: 'Load Unpacked',
    desc: 'Click "Load unpacked" and select the extracted track-ex folder.',
    icon: CheckCircle2,
  },
  {
    title: 'Sign In',
    desc: 'Click the TrackEx icon in your toolbar, enter your TrackAsap email & password, and your API URL.',
    icon: Shield,
  },
  {
    title: 'Start Solving!',
    desc: 'Open any LeetCode problem — the timer starts automatically. Submit a solution and it syncs to your account.',
    icon: Zap,
  },
];

const Profile = () => {
  const { user, updateUser, isLoading, githubStatus, fetchGitHubStatus, setGitHubStatus, uploadProfilePicture } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [showTrackExGuide, setShowTrackExGuide] = useState(false);
  const avatarSrc =
    user?.profilePicture ||
    user?.googlePicture ||
    user?.avatarUrl ||
    (githubStatus?.connected && githubStatus?.username
      ? `https://github.com/${githubStatus.username}.png?size=120`
      : '');
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    codeforcesHandle: user?.codeforcesHandle || '',
    codechefHandle: user?.codechefHandle || '',
    leetcodeHandle: user?.leetcodeHandle || '',
    targetWeight: user?.targetWeight || '',
    enablePhysique: Boolean(user?.enablePhysique),
    startDate: user?.startDate
      ? format(new Date(user.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle hash scrolling
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          const firstInput = element.querySelector('input');
          if (firstInput) firstInput.focus();
        }, 100);
      }
    }
  }, []);

  // GitHub integration
  useEffect(() => {
    fetchGitHubStatus();

    // Handle OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const githubParam = params.get('github');
    if (githubParam === 'connected') {
      toast.success('GitHub connected successfully!');
      fetchGitHubStatus();
      window.history.replaceState({}, '', '/profile');
    } else if (githubParam === 'error') {
      toast.error(`GitHub connection failed: ${params.get('reason') || 'Unknown error'}`);
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  const handleConnectGithub = async () => {
    setConnectingGithub(true);
    try {
      const { url } = await githubService.getAuthUrl();
      window.location.href = url;
    } catch {
      toast.error('Failed to get GitHub auth URL');
      setConnectingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!window.confirm('Disconnect GitHub? Your repo will remain, but syncing will stop.')) return;
    try {
      await githubService.disconnect();
      setGitHubStatus({ connected: false, username: '', lastSync: null });
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect GitHub');
    }
  };

  const handleSyncGithub = async () => {
    setSyncing(true);
    try {
      const result = await githubService.sync();
      toast.success(`Synced ${result.filesCount} files to GitHub!`);
      fetchGitHubStatus();
    } catch (error) {
      const msg = error.response?.data?.message || 'Sync failed';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading('Uploading profile picture...');
    const result = await uploadProfilePicture(file);
    if (result.success) {
      toast.success('Profile picture updated!', { id: toastId });
    } else {
      toast.error(result.error || 'Upload failed', { id: toastId });
    }
    setUploadingImage(false);
  };

  const handleInitRepo = async () => {
    setCreatingRepo(true);
    try {
      const result = await githubService.initRepo();
      toast.success('Repository is ready on GitHub!');
      if (result.repoUrl) {
        window.open(result.repoUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create repo';
      toast.error(msg);
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await updateUser({
      ...formData,
      targetWeight: formData.targetWeight ? Number(formData.targetWeight) : null,
    });

    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  // Calculate days since start
  const startDate = new Date(user?.startDate || new Date());
  const today = new Date();
  const currentDay = Math.min(
    75,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 px-4 py-4 md:px-6 md:py-6">
      {/* Profile Header */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-2 md:p-0">
          <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50 flex-shrink-0 overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl sm:text-4xl font-bold text-neon-green">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
              {uploadingImage ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </label>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.name || 'User'}</h2>
            <p className="text-dark-400 text-sm sm:text-base break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
              <div className="flex items-center gap-2 bg-neon-green/10 px-3 py-1.5 rounded-full">
                <span className="text-xs sm:text-sm text-neon-green font-semibold">Day {currentDay}</span>
                <span className="text-xs text-dark-400">of 75</span>
              </div>
              <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                <span className="text-xs sm:text-sm text-cyan-400 font-semibold">{75 - currentDay}</span>
                <span className="text-xs text-dark-400">days left</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <GlassCard>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Personal Information</h3>

          <div className="space-y-4 md:space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input-field pl-12"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-field pl-12 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Challenge Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>

            {/* Enable Physique Tracking Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl mt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neon-green/10 rounded-lg text-neon-green">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Physique & Fitness Tracking</h4>
                  <p className="text-xs text-dark-400">Enable gym workouts, diet tracking, and body weight logs</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enablePhysique}
                  onChange={(e) => handleChange('enablePhysique', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
              </label>
            </div>

            {/* Target Weight */}
            {formData.enablePhysique && (
              <NumberInput
                label="Target Weight (kg)"
                value={formData.targetWeight}
                onChange={(val) => handleChange('targetWeight', val)}
                min={20}
                max={300}
                step={0.1}
                placeholder="Your goal weight"
              />
            )}
          </div>
        </GlassCard>

        {/* Platform Handles */}
        <GlassCard id="platform-handles" className="mt-4 md:mt-6 scroll-mt-24">
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Platform Handles</h3>
          <p className="text-dark-400 text-xs md:text-sm mb-4">
            Add your competitive programming handles (optional)
          </p>

          <div className="space-y-4 md:space-y-5">
            {/* LeetCode */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                LeetCode Username
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFA116]" />
                <input
                  type="text"
                  value={formData.leetcodeHandle}
                  onChange={(e) => handleChange('leetcodeHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="leetcode_username"
                />
              </div>
            </div>

            {/* CodeChef */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                CodeChef Username
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B4638]" />
                <input
                  type="text"
                  value={formData.codechefHandle}
                  onChange={(e) => handleChange('codechefHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="codechef_username"
                />
              </div>
            </div>

            {/* Codeforces */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Codeforces Handle
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F8ACB]" />
                <input
                  type="text"
                  value={formData.codeforcesHandle}
                  onChange={(e) => handleChange('codeforcesHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="codeforces_handle"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* GitHub Integration */}
        <GlassCard className="mt-4 md:mt-6">
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Sync
          </h3>
          <p className="text-dark-400 text-xs md:text-sm mb-4">
            Connect your GitHub account to automatically push your code solutions and notes to a repository.
          </p>

          {githubStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <Github className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-400 font-medium">Connected as @{githubStatus.username}</p>
                  {githubStatus.lastSync && (
                    <p className="text-xs text-dark-400 mt-0.5">
                      Last synced: {format(new Date(githubStatus.lastSync), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
                <a
                  href={`https://github.com/${githubStatus.username}/TrackAsap-Activity`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  onClick={handleInitRepo}
                  disabled={creatingRepo}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/20 rounded-lg transition-all text-neon-green disabled:opacity-50"
                >
                  <Github className={`w-4 h-4 ${creatingRepo ? 'animate-pulse' : ''}`} />
                  {creatingRepo ? 'Creating Repo...' : 'Create Repo'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSyncGithub}
                  disabled={syncing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync to GitHub'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleDisconnectGithub}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all text-red-400"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={handleConnectGithub}
              disabled={connectingGithub}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#24292e] hover:bg-[#2f363d] border border-white/10 rounded-lg transition-all text-white disabled:opacity-50"
            >
              {connectingGithub ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              Connect GitHub
            </motion.button>
          )}
        </GlassCard>

        {/* TrackEx Chrome Extension */}
        <GlassCard className="mt-4 md:mt-6 relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/8 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Puzzle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  TrackEx Extension
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-md tracking-wider">
                    NEW
                  </span>
                </h3>
                <p className="text-dark-400 text-xs mt-0.5">Auto-track your LeetCode submissions</p>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { icon: Timer, label: 'Solve Timer', color: 'text-emerald-400' },
              { icon: Code2, label: 'Code Capture', color: 'text-cyan-400' },
              { icon: Zap, label: 'Auto Sync', color: 'text-amber-400' },
              { icon: Shield, label: 'Track Results', color: 'text-purple-400' },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-2 bg-white/3 rounded-lg px-3 py-2">
                <feat.icon className={`w-3.5 h-3.5 ${feat.color} flex-shrink-0`} />
                <span className="text-[11px] text-gray-400 font-medium">{feat.label}</span>
              </div>
            ))}
          </div>

          <p className="text-dark-400 text-xs md:text-sm mb-4">
            Install the TrackEx Chrome extension to automatically capture your LeetCode solve time, submitted code, runtime, and memory — all synced to your TrackAsap account with a <span className="text-purple-400 font-semibold">track-Ex</span> badge.
          </p>

          <div className="flex flex-wrap gap-3">
            <motion.a
              href={TRACKEX_DOWNLOAD_URL}
              download="track-ex.zip"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 rounded-lg transition-all text-purple-400 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Download Extension
            </motion.a>
            <motion.button
              type="button"
              onClick={() => setShowTrackExGuide(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-gray-300 text-sm"
            >
              Setup Guide
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </GlassCard>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full mt-4 md:mt-6 flex items-center justify-center gap-2 py-3 md:py-4"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </motion.button>

        {/* Privacy Policy Link */}
        <div className="mt-6 pt-5 border-t border-dark-800 flex items-center justify-center gap-2 text-sm text-dark-400">
          <Shield className="w-4 h-4 text-dark-500" />
          <span>By using TrackAsap, you agree to our</span>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-green hover:underline font-medium transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </form>


      {/* TrackEx Setup Guide Modal */}
      <AnimatePresence>
        {showTrackExGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTrackExGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-5 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Puzzle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Setup Guide</h2>
                      <p className="text-xs text-dark-400">Get TrackEx running in 2 minutes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTrackExGuide(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {SETUP_STEPS.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Step number + line */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-purple-400">{i + 1}</span>
                        </div>
                        {i < SETUP_STEPS.length - 1 && (
                          <div className="w-px flex-1 bg-gradient-to-b from-purple-500/20 to-transparent mt-2" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <step.icon className="w-4 h-4 text-purple-400" />
                          <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                        </div>
                        <p className="text-xs text-dark-400 leading-relaxed">{step.desc}</p>
                        {i === 1 && (
                          <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <code className="text-xs text-purple-300 flex-1 select-all">chrome://extensions/</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('chrome://extensions/');
                                toast.success('Copied!');
                              }}
                              className="text-gray-500 hover:text-white transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                  <a
                    href={TRACKEX_DOWNLOAD_URL}
                    download="track-ex.zip"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 rounded-lg transition-all text-purple-400 font-medium text-sm flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Get Extension Files
                  </a>
                  <button
                    onClick={() => setShowTrackExGuide(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-gray-300 text-sm flex-1"
                  >
                    Got It
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
