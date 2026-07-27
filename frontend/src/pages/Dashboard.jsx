import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Clock,
  Activity,
  ArrowRight,
  ExternalLink,
  FolderOpen,
  Code,
  GitBranch,
  Heart,
  MessageSquare,
  Sparkles,
  Building2,
  ChevronRight,
  Share2,
  Layers,
  Award,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import useProblemStore from '../store/problemStore';
import useSheetStore from '../store/sheetStore';
import discussionService from '../services/discussionService';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CompanyLogo = ({ name, fallback }) => {
  const svgProps = {
    viewBox: '0 0 24 24',
    className: 'w-5 h-5 fill-current text-white',
  };
  switch (name) {
    case 'Google':
      return (
        <svg {...svgProps}>
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      );
    case 'Meta':
      return (
        <svg {...svgProps}>
          <path d="M16.92 6.08c-2.3 0-4.14 1.25-5.27 3.18-1.13-1.93-2.97-3.18-5.27-3.18C2.86 6.08 0 8.96 0 12.5c0 3.56 2.88 6.42 6.38 6.42 2.3 0 4.14-1.25 5.27-3.18 1.13 1.93 2.97 3.18 5.27 3.18 3.52 0 6.38-2.86 6.38-6.42 0-3.54-2.86-6.42-6.38-6.42zm0 10.32c-2.05 0-3.7-1.36-4.52-3.38l-.75-1.82.75-1.82c.82-2.02 2.47-3.38 4.52-3.38 2.3 0 4.12 1.82 4.12 4.12 0 2.3-1.82 4.28-4.12 4.28zM6.38 16.4c-2.3 0-4.12-1.98-4.12-4.28 0-2.3 1.82-4.12 4.12-4.12 2.05 0 3.7 1.36 4.52 3.38l.75 1.82-.75 1.82C10.08 15.04 8.43 16.4 6.38 16.4z" />
        </svg>
      );
    case 'Amazon':
      return (
        <svg {...svgProps}>
          <path d="M13.952 11.233c-.088 1.244-.702 2.222-1.842 2.934-1.14.712-2.482 1.068-4.026 1.068-1.404 0-2.58-.356-3.528-1.068-.948-.712-1.422-1.734-1.422-3.066 0-1.422.548-2.518 1.644-3.288 1.096-.77 2.58-1.156 4.452-1.156 1.316 0 2.44.208 3.372.624v-.712c0-.986-.25-1.748-.75-2.286-.5-.538-1.246-.808-2.238-.808-1.2 0-2.186.384-2.958 1.152l-1.36-1.52c1.176-1.052 2.654-1.578 4.434-1.578 1.622 0 2.872.432 3.75 1.296.878.864 1.316 2.056 1.316 3.576v6.864H13.56v-2.034zm-1.04-1.396v-1.638c-.736-.364-1.638-.546-2.706-.546-1.14 0-2.006.216-2.598.648-.592.432-.888 1.056-.888 1.872 0 .684.228 1.226.684 1.626.456.4 1.074.6 1.854.6 1.052 0 1.93-.326 2.634-.978.704-.652 1.056-1.522 1.056-2.61v1.026zM20.25 18.06c-2.96 2.18-6.7 3.49-10.74 3.49-4.52 0-8.68-1.54-11.89-4.14-.24-.19-.04-.51.24-.34 3.44 2.04 7.6 3.26 11.97 3.26 3.73 0 7.22-1.05 10.16-2.92.36-.23.63.38.26.65zM21.75 16.94c-.42-.55-2.79-.27-3.86-.14-.33.04-.39-.24-.09-.45 1.89-1.33 4.97-0.95 5.34-0.45.38.5-0.12 3.65-2.22 5.07-.29.2-.55-.02-.38-.3 0.54-0.97 1.63-3.18 1.21-3.73z" />
        </svg>
      );
    case 'Microsoft':
      return (
        <svg {...svgProps}>
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
        </svg>
      );
    case 'Apple':
      return (
        <svg {...svgProps}>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.86.96-2.95-.94.04-2.07.63-2.73 1.4-.59.68-1.11 1.78-.97 2.85 1.05.08 2.11-.53 2.74-1.3" />
        </svg>
      );
    case 'Netflix':
      return (
        <svg {...svgProps}>
          <path d="M15.228 0v24l-6.456-11.808v11.808H3V0h5.772l6.456 11.808V0h5.772z" />
        </svg>
      );
    case 'Uber':
      return (
        <svg {...svgProps}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.844 16.516h-7.688V7.484h7.688v9.032zM12 9.497v3.006H9.313v-3.006h2.687z" />
        </svg>
      );
    case 'Adobe':
      return (
        <svg {...svgProps}>
          <path d="M15.1 2H24v20L15.1 2zM8.9 2H0v20L8.9 2zM12 9.4L17.6 22h-3.8l-1.8-4.5H9.4L12 9.4z" />
        </svg>
      );
    case 'Flipkart':
      return (
        <svg {...svgProps}>
          <path d="M14.33 2.012h-3.899L9.42 1.02a.498.498 0 00-.77.382v3.743L5.433 3.428a.5.5 0 00-.756.41v16.15a.5.5 0 00.756.41l8.897-6.262v3.85a.5.5 0 00.77.382L20.25 12.39a.5.5 0 000-.81L15.1 6.598a.5.5 0 00-.77.382v-4.968z" />
        </svg>
      );
    case 'Atlassian':
      return (
        <svg {...svgProps}>
          <path d="M11.53 2c0 2.4 1.97 4.35 4.38 4.35h1.25V2h-5.63zM5.58 8.12c0 2.4 1.97 4.35 4.38 4.35h1.25V8.12H5.58zm-5.58 6.13c0 2.4 1.97 4.35 4.38 4.35H5.63v-4.35H0zm17.9 0v4.35h5.63c0-2.4-1.97-4.35-4.38-4.35h-1.25zM11.53 14.25v8.7c2.41 0 4.38-1.95 4.38-4.35v-4.35h-4.38z" />
        </svg>
      );
    case 'Bloomberg':
      return (
        <svg {...svgProps}>
          <path d="M4.095 2.143v19.714H9.62V2.143H4.095zm5.524 0v19.714h5.524V2.143H9.619zm5.524 0v19.714h4.762V2.143h-4.762z" />
        </svg>
      );
    case 'Salesforce':
      return (
        <svg {...svgProps}>
          <path d="M10.093 3.03C7.464 3.03 5.3 4.96 4.982 7.5A4.5 4.5 0 000 12c0 2.485 2.015 4.5 4.5 4.5h15c2.485 0 4.5-2.015 4.5-4.5 0-2.316-1.751-4.234-4.004-4.475C19.467 5.01 17.182 3.03 14.5 3.03c-1.895 0-3.565 1.01-4.407 2.525z" />
        </svg>
      );
    default:
      return <span>{fallback}</span>;
  }
};

const COMPANY_SHEETS = [
  { name: 'Google', logoText: 'G', color: '#4285F4', count: '500+ Qs' },
  { name: 'Meta', logoText: 'M', color: '#0668E1', count: '450+ Qs' },
  { name: 'Amazon', logoText: 'a', color: '#FF9900', count: '600+ Qs' },
  { name: 'Microsoft', logoText: 'MS', color: '#00A4EF', count: '400+ Qs' },
  { name: 'Apple', logoText: '', color: '#A2AAAD', count: '350+ Qs' },
  { name: 'Netflix', logoText: 'N', color: '#E50914', count: '200+ Qs' },
  { name: 'Uber', logoText: 'U', color: '#10b981', count: '300+ Qs' },
  { name: 'Adobe', logoText: 'Ad', color: '#FF0000', count: '250+ Qs' },
  { name: 'Flipkart', logoText: 'F', color: '#2874F0', count: '180+ Qs' },
  { name: 'Atlassian', logoText: 'At', color: '#0052CC', count: '220+ Qs' },
  { name: 'Bloomberg', logoText: 'B', color: '#2800D7', count: '310+ Qs' },
  { name: 'Salesforce', logoText: 'SF', color: '#00A1E0', count: '240+ Qs' },
];

const QUICK_ACTIONS = [
  {
    title: 'Continue Sheets',
    description: 'Resume active DSA & study plans',
    icon: BookOpen,
    color: '#39FF14',
    bg: 'rgba(57, 255, 20, 0.1)',
    border: 'rgba(57, 255, 20, 0.25)',
    to: '/sheets',
  },
  {
    title: 'Daily Tracker',
    description: 'Log today\'s coding time & tasks',
    icon: Clock,
    color: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.1)',
    border: 'rgba(34, 211, 238, 0.25)',
    to: '/daily-tracker',
  },
  {
    title: 'Code Playground',
    description: 'Multi-language online compiler',
    icon: Code2,
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.25)',
    to: '/playground',
  },
  {
    title: 'Analytics Platform',
    description: 'CP ratings, stats & heatmaps',
    icon: Activity,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.25)',
    to: '/analytics',
  },
  {
    title: 'Leaderboard',
    description: 'Check global ranks & peers',
    icon: Trophy,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.25)',
    to: '/leaderboard',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Import Sheets & Buckets',
    description: 'Import pre-built DSA sheets (Striver, NeetCode), interview company sheets, or create your own custom study plans.',
    icon: FolderOpen,
    color: '#39FF14',
  },
  {
    step: '02',
    title: 'Solve, Code & Attach Notes',
    description: 'Use our online compiler to run multi-language code, attach personalized revision notes, and track your speed automatically.',
    icon: Code,
    color: '#22d3ee',
  },
  {
    step: '03',
    title: 'Connect Your GitHub Account',
    description: 'Connect your GitHub account to enable automatic repository backup and push your solutions directly to your GitHub repo.',
    icon: GitBranch,
    color: '#a78bfa',
  },
  {
    step: '04',
    title: 'TrackEx Extension & GitSync',
    description: '(Optional) Download and use our TrackEx Chrome extension to automatically sync LeetCode, CodeChef, and Codeforces, and share problem sheets with peers.',
    icon: Share2,
    color: '#f97316',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { dashboard, fetchDashboard, isLoading } = useAnalyticsStore();
  const { problems, fetchProblems } = useProblemStore();
  const { sheets, fetchSheets } = useSheetStore();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchProblems({ limit: 5000 });
    fetchSheets(true);
    const loadCommunityPosts = async () => {
      try {
        setPostsLoading(true);
        const res = await discussionService.getPosts(1, 5);
        const postsList = res?.posts || res?.data || (Array.isArray(res) ? res : []);
        setPosts(postsList);
      } catch (error) {
        console.error('Failed to load community posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };
    loadCommunityPosts();
  }, [fetchDashboard, fetchProblems, fetchSheets]);

  const handleCompanyClick = (companyName) => {
    navigate('/sheets', {
      state: {
        openBuckets: true,
        category: 'company-wise',
        search: companyName,
      },
    });
  };

  const totalSolved = problems?.length || dashboard?.problems?.total || 0;
  const totalSheets = sheets?.length || dashboard?.sheets?.total || 0;

  const computedStreak = (() => {
    if (user?.streak && user.streak > 0) return user.streak;
    if (dashboard?.user?.streak && dashboard.user.streak > 0) return dashboard.user.streak;
    if (!problems || problems.length === 0) return 0;
    const solvedDates = new Set(
      problems
        .filter(p => p.solvedAt || p.createdAt)
        .map(p => new Date(p.solvedAt || p.createdAt).toISOString().split('T')[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (solvedDates.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  })();

  const userStreak = computedStreak;
  const displayName = user?.handle ? `@${user.handle}` : user?.name || 'Developer';

  return (
    <div className="space-y-8 pb-12">
      {/* Inline Keyframes for Marquee */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          display: flex;
          width: max-content;
          animation: marquee-scroll 40s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── Section 1: Hero Welcome & Quick Action Command Center ─────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <GlassCard padding="p-6 md:p-8" className="relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neon-green mb-1">
              <Sparkles className="w-4 h-4" /> Developer Command Center
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-cyan-400 to-purple-400">{displayName}</span>!
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              Stay consistent, crush your interview sheets, and sync your solutions seamlessly.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Streak</div>
                <div className="text-base font-bold text-white">{userStreak} Days</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center text-neon-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Solved</div>
                <div className="text-base font-bold text-white">{totalSolved} Qs</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Sheets</div>
                <div className="text-base font-bold text-white">{totalSheets} Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 Quick Action Link Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                to={action.to}
                className="group flex flex-col justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-98"
                style={{ borderColor: action.border }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: action.bg, color: action.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </GlassCard>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── Section 2: Company-Wise Sheet Marquee Banner ──────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <GlassCard padding="p-6" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Company-Wise Problem Sheets</h2>
              <p className="text-xs text-gray-400">
                Click any company below to directly import their curated interview question sheets
              </p>
            </div>
          </div>
          <Link
            to="/sheets"
            state={{ openBuckets: true, category: 'company-wise' }}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View All Companies <ExternalLink size={14} />
          </Link>
        </div>

        {/* Infinite Scrolling Marquee Banner */}
        <div className="relative w-full overflow-hidden py-2 -mx-2 px-2">
          {/* Left/Right Fade Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0d131f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0d131f] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-scroll gap-4">
            {[...COMPANY_SHEETS, ...COMPANY_SHEETS].map((company, idx) => (
              <button
                key={idx}
                onClick={() => handleCompanyClick(company.name)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/25 transition-all shadow-md group cursor-pointer shrink-0"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-inner group-hover:scale-110 transition-transform shrink-0"
                  style={{ backgroundColor: company.color }}
                >
                  <CompanyLogo name={company.name} fallback={company.logoText} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">
                    {company.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    {company.count}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── Section 3 & 4: Two-Column Workflow Guide + Community Chatter ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: TrackAsap Superpower Workflow Guide (7 Cols) */}
        <GlassCard padding="p-6 md:p-8" className="lg:col-span-7 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              <Zap className="w-4 h-4" /> Platform Superpowers
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              How TrackAsap Accelerates Your Growth
            </h2>
            <p className="text-xs text-gray-400">
              A frictionless workflow built for developers aiming for top tech companies and competitive programming mastery.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3.5 my-4">
            {WORKFLOW_STEPS.map((stepItem, index) => {
              const Icon = stepItem.icon;
              return (
                <div
                  key={index}
                  className="group relative flex-1 flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/10 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${stepItem.color}15`, color: stepItem.color }}
                  >
                    <span className="text-[10px] font-extrabold uppercase opacity-60 leading-none">Step</span>
                    <span className="text-sm font-extrabold leading-none mt-0.5">{stepItem.step}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">
                        {stepItem.title}
                      </h3>
                      <Icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-gray-400">
              Ready to import a sheet or jump into your playground?
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/sheets"
                className="px-4 py-2 rounded-xl bg-neon-green text-dark-900 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-neon-green/20"
              >
                Explore Sheets
              </Link>
              <Link
                to="/playground"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all"
              >
                Open IDE
              </Link>
            </div>
          </div>
        </GlassCard>

        {/* Right Column: Community Chatter — "What Peeps Are Talking" (5 Cols) */}
        <GlassCard padding="p-6 md:p-8" className="lg:col-span-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Community Chatter</h2>
                  <p className="text-xs text-gray-400">What peeps are talking...</p>
                </div>
              </div>
              <Link
                to="/discussions"
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                title="Open Community Discussions"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4 my-2">
              {postsLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-gray-500 space-y-2">
                  <MessageSquare size={32} className="opacity-30" />
                  <p className="text-sm">No recent community posts yet</p>
                  <Link
                    to="/discussions"
                    className="text-xs text-cyan-400 hover:underline mt-1 font-semibold"
                  >
                    Start a discussion ➔
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.slice(0, 4).map((post, index) => {
                    const authorName = post.author?.name || post.author?.handle || 'Anonymous Developer';
                    const likeCount = post.likesCount || post.likes?.length || 0;
                    const commentCount = post.commentsCount || post.comments?.length || 0;
                    const contentSnippet = post.content
                      ? post.content.length > 120
                        ? post.content.substring(0, 120) + '...'
                        : post.content
                      : '';

                    return (
                      <Link
                        key={post._id || index}
                        to="/discussions"
                        className="group block p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {authorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                          {contentSnippet}
                        </p>

                        {post.sharedSheet && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-semibold">
                            <Share2 className="w-3 h-3" /> Shared Sheet: {post.sharedSheet.name}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" /> {likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-cyan-400" /> {commentCount}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-white/10">
            <Link
              to="/discussions"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-white/15 text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-all"
            >
              Join Community Discussions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
