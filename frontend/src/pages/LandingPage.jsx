import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Trophy, Target, BookOpen, Zap, Clock, Activity, ArrowUpRight,
  CheckCircle2, Flame, ExternalLink, ShieldCheck, Github, Lock, ChevronRight,
  Terminal, Sparkles, Star, Building2, Quote, Award, Heart,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ── ReactBits-Inspired: Spotlight Card Component ─────────────────────────────
// Tracks mouse cursor and renders a glowing radial gradient follow effect
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(57, 255, 20, 0.15)', ...props }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-xl transition-all duration-300 ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ── ReactBits-Inspired: Shiny Button Component ───────────────────────────────
const ShinyButton = ({ children, className = '', to, onClick, ...props }) => {
  const content = (
    <span className="relative z-10 flex items-center justify-center gap-2 font-bold">{children}</span>
  );

  const baseClasses = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3 font-medium text-dark-950 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 shadow-lg shadow-neon-green/20 ${className}`;

  if (to) {
    return (
      <Link to={to} className={baseClasses} {...props}>
        {content}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses} {...props}>
      {content}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
    </button>
  );
};

// ── Vector SVG Company Logo Helper ───────────────────────────────────────────
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
  { name: 'Google', logoText: 'G', color: '#4285F4', count: '500+ Qs', topProblems: ['1. Two Sum [Easy]', '2. LRU Cache [Medium]', '3. Merge k Sorted Lists [Hard]'] },
  { name: 'Meta', logoText: 'M', color: '#0668E1', count: '450+ Qs', topProblems: ['1. Subarray Sum Equals K [Medium]', '2. Valid Palindrome II [Easy]', '3. Alien Dictionary [Hard]'] },
  { name: 'Amazon', logoText: 'a', color: '#FF9900', count: '600+ Qs', topProblems: ['1. Number of Islands [Medium]', '2. Best Time to Buy/Sell Stock [Easy]', '3. Word Ladder [Hard]'] },
  { name: 'Microsoft', logoText: 'MS', color: '#00A4EF', count: '400+ Qs', topProblems: ['1. Reverse Linked List [Easy]', '2. Design In-Memory File System [Hard]', '3. Spiral Matrix [Medium]'] },
  { name: 'Apple', logoText: '', color: '#A2AAAD', count: '350+ Qs', topProblems: ['1. Add Two Numbers [Medium]', '2. Maximum Subarray [Medium]', '3. Median of Two Sorted Arrays [Hard]'] },
  { name: 'Netflix', logoText: 'N', color: '#E50914', count: '200+ Qs', topProblems: ['1. LFU Cache [Hard]', '2. Top K Frequent Elements [Medium]', '3. Valid Anagram [Easy]'] },
  { name: 'Uber', logoText: 'U', color: '#10b981', count: '300+ Qs', topProblems: ['1. Word Search II [Hard]', '2. Evaluate Reverse Polish Notation [Medium]', '3. Clone Graph [Medium]'] },
  { name: 'Adobe', logoText: 'Ad', color: '#FF0000', count: '250+ Qs', topProblems: ['1. Product of Array Except Self [Medium]', '2. Valid Parentheses [Easy]', '3. Trapping Rain Water [Hard]'] },
  { name: 'Flipkart', logoText: 'F', color: '#2874F0', count: '180+ Qs', topProblems: ['1. Coin Change [Medium]', '2. Binary Tree Maximum Path Sum [Hard]', '3. Next Permutation [Medium]'] },
  { name: 'Atlassian', logoText: 'At', color: '#0052CC', count: '220+ Qs', topProblems: ['1. Rank Teams by Votes [Medium]', '2. Design Hit Counter [Medium]', '3. All O`one Data Structure [Hard]'] },
  { name: 'Bloomberg', logoText: 'B', color: '#2800D7', count: '310+ Qs', topProblems: ['1. Decode String [Medium]', '2. Insert Delete GetRandom O(1) [Medium]', '3. Min Stack [Medium]'] },
  { name: 'Salesforce', logoText: 'SF', color: '#00A1E0', count: '240+ Qs', topProblems: ['1. Merge Intervals [Medium]', '2. Course Schedule [Medium]', '3. Serialize/Deserialize Binary Tree [Hard]'] },
];

// ── Wall of Love: Industry Engineers Testimonials ────────────────────────────
const INDUSTRY_TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    role: 'Software Engineer II',
    company: 'Google',
    color: '#4285F4',
    avatar: 'AS',
    quote: 'Tracking 500+ problems across LeetCode and Google interview sheets used to be a mess. TrackAsap’s GitHub auto-sync saved me hours during my technical prep!',
    spotlight: 'rgba(66, 133, 244, 0.18)',
  },
  {
    name: 'Rhea Nair',
    role: 'SDE-2',
    company: 'Amazon',
    color: '#FF9900',
    avatar: 'RN',
    quote: 'The company-wise problem bucket picker is a cheat code. Solved 150+ Amazon LP & DSA questions seamlessly without juggling Notion tables.',
    spotlight: 'rgba(255, 153, 0, 0.18)',
  },
  {
    name: 'Kabir Verma',
    role: 'Senior Frontend Engineer',
    company: 'Atlassian',
    color: '#0052CC',
    avatar: 'KV',
    quote: 'Having my LeetCode, CodeChef, and Codeforces heatmaps in one non-cluttered command center is incredible. Highly recommend to every engineer.',
    spotlight: 'rgba(0, 82, 204, 0.18)',
  },
  {
    name: 'Sneha Gupta',
    role: 'Software Engineer',
    company: 'Microsoft',
    color: '#00A4EF',
    avatar: 'SG',
    quote: 'The TrackEx Chrome extension auto-logs time spent on problems from link open to solved. It is the single best productivity enhancement for CP.',
    spotlight: 'rgba(0, 164, 239, 0.18)',
  },
  {
    name: 'Dev Mehta',
    role: 'SDE-1',
    company: 'Flipkart',
    color: '#2874F0',
    avatar: 'DM',
    quote: 'The 75-Day Challenge tracker and GitHub repo sync pushed my streak to 45 days. Absolutely essential for placement and coding round prep.',
    spotlight: 'rgba(40, 116, 240, 0.18)',
  },
  {
    name: 'Ananya Iyer',
    role: 'Senior SWE',
    company: 'Uber',
    color: '#10b981',
    avatar: 'AI',
    quote: 'No more scattered spreadsheets or lost notes. TrackAsap is the developer command center that every serious software engineer deserves.',
    spotlight: 'rgba(16, 185, 129, 0.18)',
  },
];

// ── Sneak-Peek Curiosity Gap Modal ───────────────────────────────────────────
const SneakPeekModal = ({ company, onClose }) => {
  const navigate = useNavigate();
  if (!company) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-dark-900/95 p-6 shadow-2xl overflow-hidden"
        >
          {/* Company Brand Glow Banner */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: company.color }}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                style={{ backgroundColor: company.color }}
              >
                <CompanyLogo name={company.name} fallback={company.logoText} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{company.name} Interview Sheet</h3>
                <p className="text-xs text-gray-400">{company.count} Curated Problems</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-4">
            Sample top frequency questions from <span className="font-bold text-white">{company.name}</span> interview rounds:
          </p>

          {/* Sample Top Questions */}
          <div className="space-y-2 mb-6">
            {company.topProblems.map((prob, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5 text-sm font-medium text-gray-200"
              >
                <span>{prob}</span>
                <span className="text-xs text-neon-green font-mono">Top Frequency</span>
              </div>
            ))}
            {/* Locked Rows */}
            <div className="relative p-4 rounded-xl bg-gradient-to-t from-dark-950/90 to-white/[0.02] border border-white/5 text-center">
              <Lock className="w-5 h-5 text-yellow-400 mx-auto mb-1 opacity-80" />
              <p className="text-xs font-bold text-gray-300">
                + {parseInt(company.count, 10) - 3} more questions locked
              </p>
            </div>
          </div>

          {/* Call To Action */}
          <div className="text-center">
            <ShinyButton
              onClick={() => navigate(`/login?redirect=/sheets`)}
              className="w-full text-sm py-3.5"
            >
              Sign In to Import All {company.name} Problems ➔
            </ShinyButton>
            <p className="text-[11px] text-gray-500 mt-2">
              Free forever • Instant GitHub Sync • No credit card required
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Mock Dashboard Widgets for Hero Section ───────────────────────────────
const MockLeetCodeWidget = () => (
  <div className="w-72 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-white/10 p-5 shadow-[0_0_40px_rgba(57,255,20,0.1)] transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#FFA116]/20 flex items-center justify-center">
        <Code2 className="w-5 h-5 text-[#FFA116]" />
      </div>
      <div>
        <h3 className="font-semibold text-white leading-tight">LeetCode Stats</h3>
        <p className="text-[11px] text-gray-400">Synced via GitHub</p>
      </div>
    </div>
    <div className="text-center mb-5">
      <div className="text-4xl font-black text-[#FFA116]">582</div>
      <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mt-1">Problems Solved</div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-green-500/10 rounded-lg p-2 text-center border border-green-500/20">
        <div className="text-sm font-bold text-green-400">210</div>
        <div className="text-[10px] text-gray-400">Easy</div>
      </div>
      <div className="bg-yellow-500/10 rounded-lg p-2 text-center border border-yellow-500/20">
        <div className="text-sm font-bold text-yellow-500">290</div>
        <div className="text-[10px] text-gray-400">Medium</div>
      </div>
      <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
        <div className="text-sm font-bold text-red-500">82</div>
        <div className="text-[10px] text-gray-400">Hard</div>
      </div>
    </div>
  </div>
);

const MockHeatmapWidget = () => (
  <div className="w-[340px] rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-white/10 p-5 shadow-[0_0_40px_rgba(34,211,238,0.1)] transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Solving Activity</h3>
      </div>
      <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Last 3 Months</span>
    </div>
    <div className="grid grid-cols-12 gap-1.5">
      {Array.from({ length: 48 }).map((_, i) => {
        // Deterministic pseudo-random pattern that looks like a real heatmap
        const val = (Math.sin(i * 1.5) + Math.cos(i * 0.5)) * 0.5 + 0.5;
        let intensity = 'bg-white/5';
        if (val > 0.8) intensity = 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]';
        else if (val > 0.5) intensity = 'bg-cyan-500/70';
        else if (val > 0.2) intensity = 'bg-cyan-500/30';
        return <div key={i} className={`w-full aspect-square rounded-[3px] ${intensity}`} />
      })}
    </div>
    <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 font-medium">
      <span>Less</span>
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-[3px] bg-white/5"></div>
        <div className="w-3 h-3 rounded-[3px] bg-cyan-500/30"></div>
        <div className="w-3 h-3 rounded-[3px] bg-cyan-500/70"></div>
        <div className="w-3 h-3 rounded-[3px] bg-cyan-400"></div>
      </div>
      <span>More</span>
    </div>
  </div>
);

const MockStreakWidget = () => (
  <div className="w-64 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/20 p-5 shadow-[0_0_40px_rgba(249,115,22,0.15)] transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-500 blur-lg opacity-40 animate-pulse"></div>
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-b from-orange-400 to-red-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center">
            <Flame className="w-7 h-7 text-orange-500" />
          </div>
        </div>
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">75<span className="text-base text-gray-400 font-medium ml-1">Days</span></div>
        <div className="text-[11px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">Current Streak</div>
      </div>
    </div>
  </div>
);

// ── Landing Page Main Component ──────────────────────────────────────────────
const LandingPage = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('sheets');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-neon-green selection:text-dark-950">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-green/20 via-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">TrackAsap</span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-400">
                v2.0 Beta
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <ShinyButton to="/login" className="text-xs px-5 py-2.5">
              Launch Command Center ➔
            </ShinyButton>
          </div>
        </div>
      </header>

      {/* ── Hero Section (Split Layout) ── */}
      <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-32">
        {/* Ambient Neon Background Glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-neon-green/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Text Content */}
          <div className="lg:w-[55%] text-center lg:text-left flex flex-col items-center lg:items-start z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold text-neon-green mb-6 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Developer Command Center for Competitive Programmers</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4rem] font-black tracking-tight text-white leading-[1.1] mb-6"
            >
              Master Coding Interviews with{' '}
              <span className="bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 bg-clip-text text-transparent inline-block pb-1">
                One Command Center
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed mb-10"
            >
              Track your DSA progress, sync LeetCode & CodeChef ratings, write code in our embedded playground, and log time automatically. Stop juggling spreadsheets and start gamifying your prep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <ShinyButton to="/login" className="w-full sm:w-auto text-base px-8 py-4 shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                Get Started Free — No Credit Card ➔
              </ShinyButton>
              <button
                onClick={() => {
                  const el = document.getElementById('company-marquee');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-200 transition-all shadow-sm"
              >
                Explore 12+ Company Sheets
              </button>
            </motion.div>
          </div>

          {/* Right Floating Dashboards Composition */}
          <div className="lg:w-[45%] relative h-[450px] w-full hidden md:block mt-12 lg:mt-0 perspective-1000">
            <motion.div 
              initial={{ opacity: 0, x: 40, y: -20, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, y: 0, rotateY: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 20 }}
              className="absolute top-4 right-4 z-20"
            >
              <MockLeetCodeWidget />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -40, y: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, y: 0, rotateY: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 80, damping: 20 }}
              className="absolute bottom-4 left-4 z-30"
            >
              <MockHeatmapWidget />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 100, damping: 15 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 mt-12"
            >
              <MockStreakWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 2: ReactBits Infinite Marquee — Company Sheets Showcase ── */}
      <section id="company-marquee" className="py-12 border-y border-white/10 bg-dark-900/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Company-Wise Problem Sheets</h2>
              <p className="text-xs text-gray-400">
                Click any company below to inspect real interview problems & import their curated sheets
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
            Click any badge to preview <ChevronRight size={14} />
          </span>
        </div>

        {/* Infinite CSS Marquee Banner */}
        <div className="relative w-full overflow-hidden py-2 -mx-2 px-2">
          {/* Fade Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-scroll flex gap-4 w-max">
            {[...COMPANY_SHEETS, ...COMPANY_SHEETS].map((company, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCompany(company)}
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
      </section>

      {/* ── Section 3: "Wall of Love" — Industry Engineers Testimonial Grid ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 mb-3">
            <Heart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wall of Love</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Loved by Engineers at Top Tech Companies
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            See why competitive programmers and software engineers rely on TrackAsap for technical interviews and daily problem tracking.
          </p>
        </div>

        {/* 3-Column Masonry / Spotlight Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRY_TESTIMONIALS.map((friend, i) => (
            <SpotlightCard
              key={i}
              spotlightColor={friend.spotlight}
              className="p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Role + Company Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg shrink-0 border border-white/20"
                      style={{ backgroundColor: friend.color }}
                    >
                      {friend.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{friend.name}</h3>
                      <p className="text-xs text-gray-400">{friend.role}</p>
                    </div>
                  </div>

                  {/* SVG Company Badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-md shrink-0"
                    style={{ backgroundColor: friend.color }}
                  >
                    <CompanyLogo name={friend.company} fallback={friend.company[0]} />
                    <span>{friend.company}</span>
                  </div>
                </div>

                {/* Verified Pill */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[11px] font-semibold text-cyan-400 mb-4">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Industry Engineer</span>
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                  “{friend.quote}”
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>TrackAsap User</span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ── Section 4: Interactive Command Center Feature Showcase ── */}
      <section className="py-20 border-t border-white/10 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Everything You Need in One Unified Dashboard
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mt-2">
              No draggable clutter. Pure focus. Click any feature below to explore:
            </p>

            {/* Interactive Feature Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {[
                { id: 'sheets', label: '12+ Company Sheets', icon: BookOpen },
                { id: 'cp', label: 'CP Heatmaps & Ratings', icon: Trophy },
                { id: 'pipeline', label: '4-Step Superpower Workflow', icon: Zap },
                { id: 'tracker', label: 'Daily Tracker & 75-Day Plan', icon: Clock },
              ].map(tab => {
                const IconComp = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-neon-green text-dark-950 shadow-lg shadow-neon-green/20'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <IconComp size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="max-w-5xl mx-auto">
            {activeTab === 'sheets' && (
              <SpotlightCard className="p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Direct Import from Top 12 Tech Companies</h3>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-2">
                    Import interview problem sets from Google (500+ Qs), Amazon (600+ Qs), Meta (450+ Qs), Microsoft, Apple, and more. Track easy/medium/hard completion and attach notes.
                  </p>
                </div>
                <ShinyButton onClick={() => navigate('/login?redirect=/sheets')} className="text-sm">
                  Sign In to Open Sheets Bucket Picker ➔
                </ShinyButton>
              </SpotlightCard>
            )}

            {activeTab === 'cp' && (
              <SpotlightCard className="p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto">
                  <Trophy className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">LeetCode, CodeChef & Codeforces Live Sync</h3>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-2">
                    View rating trajectories, contest rankings, and your live submission heatmaps inside structured 2-column rows without leaving your dashboard.
                  </p>
                </div>
                <ShinyButton onClick={() => navigate('/login?redirect=/analytics')} className="text-sm">
                  Connect Your Platform Handles ➔
                </ShinyButton>
              </SpotlightCard>
            )}

            {activeTab === 'pipeline' && (
              <SpotlightCard className="p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
                  <Zap className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">4-Step Superpower Workflow</h3>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-2">
                    1. Import Sheet ➔ 2. Solve & Code in Online Playground ➔ 3. Connect GitHub Account ➔ 4. Sync with TrackEx Chrome Extension for auto time tracking.
                  </p>
                </div>
                <ShinyButton onClick={() => navigate('/login?redirect=/dashboard')} className="text-sm">
                  Experience the Superpower Workflow ➔
                </ShinyButton>
              </SpotlightCard>
            )}

            {activeTab === 'tracker' && (
              <SpotlightCard className="p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Daily Tracker & 75-Day Challenge Plan</h3>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-2">
                    Log daily solving time, maintain coding streaks, and complete the 75-Day structured placement challenge with daily problem quotas.
                  </p>
                </div>
                <ShinyButton onClick={() => navigate('/login?redirect=/daily-tracker')} className="text-sm">
                  Start Day 1 of Your Journey ➔
                </ShinyButton>
              </SpotlightCard>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 5: CTA Footer Banner ── */}
      <section className="py-16 border-t border-white/10 bg-gradient-to-b from-dark-950 to-dark-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 md:p-12 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to Upgrade Your Technical Interview Prep?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto mt-3">
              Join competitive programmers and engineers from Google, Amazon, Atlassian, and Microsoft using TrackAsap today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ShinyButton to="/login" className="w-full sm:w-auto px-8 py-4 text-base">
                Create Free Account ➔
              </ShinyButton>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-200 transition-all"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>© 2026 TrackAsap. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sneak-Peek Curiosity Modal */}
      {selectedCompany && (
        <SneakPeekModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
};

export default LandingPage;
