import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Dumbbell,
  User,
  LogOut,
  Target,
  Flame,
  BookOpen,
  Code,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Shield,
  Trophy,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/daily-tracker', icon: Calendar, label: 'Daily Tracker' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/sheets', icon: BookOpen, label: 'Sheets' },
  { path: '/problems', icon: Code, label: 'Problems' },
  { path: '/discussion', icon: MessageSquare, label: 'Discussion' },
  { path: '/physique', icon: Dumbbell, label: 'Physique' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { logout, user, githubStatus, fetchGitHubStatus } = useAuthStore();
  const location = useLocation();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    fetchGitHubStatus();
  }, [fetchGitHubStatus]);

  const avatarSrc =
    user?.profilePicture ||
    user?.googlePicture ||
    user?.avatarUrl ||
    (githubStatus?.connected && githubStatus?.username
      ? `https://github.com/${githubStatus.username}.png?size=80`
      : '');

  return (
    <>
      {/* Sidebar - Hidden on mobile, visible on desktop/tablet */}
      <aside
        className={`
          hidden md:flex flex-col
          fixed top-0 left-0 h-full z-50 
          bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50
          transition-all duration-300
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Logo */}
        <div 
          className="p-3.5 md:p-4 border-b border-dark-700/50 flex items-center justify-center min-h-[73px]"
        >
          {isCollapsed ? (
            <div className="relative group flex items-center justify-center">
              <button
                onClick={toggleCollapse}
                className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-all shadow-sm"
              >
                <PanelLeftOpen size={20} />
              </button>
              {/* Tooltip */}
              <div className="absolute left-14 px-3 py-1.5 bg-[#e5e5e5] text-black text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium shadow-md">
                Open sidebar
              </div>
            </div>
          ) : (
            <img
              src="/logodefault.png"
              alt="TrackAsap Logo"
              className="h-10 md:h-11 w-auto max-w-full object-contain brightness-[1.4] contrast-110 drop-shadow-[0_0_12px_rgba(57,255,20,0.45)] transition-all duration-300 cursor-pointer"
            />
          )}
        </div>

        {/* Collapse button - Tablet and Desktop */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-800 border border-dark-600 items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700 transition-all z-50 shadow-lg"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 md:p-4 space-y-1.5 md:space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => {
              if (item.path === '/physique' && !user?.enablePhysique) {
                return false;
              }
              return true;
            })
            .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ''}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isCollapsed ? 'md:justify-center md:px-3' : ''}
                  ${
                    isActive
                      ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                      : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                  }
                `}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? 'text-neon-green' : ''}`}
                />
                {!isCollapsed && <span className="font-medium hidden md:inline">{item.label}</span>}
                <span className="font-medium md:hidden">{item.label}</span>
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-green hidden md:block"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin link - only shown for admin users */}
        {user?.role === 'admin' && (
          <div className="px-2 md:px-4 pb-2">
            <NavLink
              to="/admin"
              title={isCollapsed ? 'Admin Panel' : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isCollapsed ? 'md:justify-center md:px-3' : ''
                } ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                }`
              }
            >
              <Shield size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium hidden md:inline">Admin Panel</span>}
              <span className="font-medium md:hidden">Admin Panel</span>
            </NavLink>
          </div>
        )}

        {/* User section */}
        <div className="p-2 md:p-4 border-t border-dark-700/50">
          <NavLink
            to="/profile"
            title={isCollapsed ? 'Profile' : ''}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 mb-2 rounded-xl transition-all duration-300 hover:bg-dark-800/50 ${
              isCollapsed ? 'md:justify-center' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50 flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-neon-green font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 hidden md:block">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-1 text-xs text-dark-400">
                  <Flame size={12} className="text-orange-500" />
                  <span>Day {user?.currentDay || 1}</span>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0 md:hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1 text-xs text-dark-400">
                <Flame size={12} className="text-orange-500" />
                <span>Day {user?.currentDay || 1}</span>
              </div>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title={isCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ${isCollapsed ? 'md:justify-center md:px-3' : ''}`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium hidden md:inline">Logout</span>}
            <span className="font-medium md:hidden">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
