import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Dumbbell,
  User,
  LogOut,
  Menu,
  X,
  Target,
  Flame,
  BookOpen,
  Code,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/daily-tracker', icon: Calendar, label: 'Daily Tracker' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/sheets', icon: BookOpen, label: 'Sheets' },
  { path: '/problems', icon: Code, label: 'Problems' },
  { path: '/physique', icon: Dumbbell, label: 'Physique' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-dark-800/90 backdrop-blur-xl border border-dark-700/50 text-white shadow-lg active:scale-95 transition-transform"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 
          bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50
          flex flex-col
          transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        {/* Logo */}
        <div className="p-4 md:p-5 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-dark-950" />
            </div>
            {!isCollapsed && (
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white">TrackAsap</h1>
                <p className="text-xs text-dark-400">75 Day Challenge</p>
              </div>
            )}
            <div className="md:hidden">
              <h1 className="text-xl font-bold text-white">TrackAsap</h1>
              <p className="text-xs text-dark-400">75 Day Challenge</p>
            </div>
          </div>
        </div>

        {/* Collapse button - Tablet and Desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-800 border border-dark-600 items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700 transition-all z-50 shadow-lg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-2 md:p-4 space-y-1.5 md:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
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

        {/* User section */}
        <div className="p-2 md:p-4 border-t border-dark-700/50">
          <div className={`flex items-center gap-3 px-3 md:px-4 py-3 mb-2 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50 flex-shrink-0">
              <span className="text-neon-green font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
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
          </div>
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
