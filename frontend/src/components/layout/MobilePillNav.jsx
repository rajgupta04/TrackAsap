import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Code,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const navPiles = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sheets', icon: BookOpen, label: 'Sheets' },
  { path: '/problems', icon: Code, label: 'Problems' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/daily-tracker', icon: Calendar, label: 'Daily Tracker' },
];

const MobilePillNav = () => {
  const location = useLocation();

  return (
    <>
      {/* Top Right Floating Message / Discussion Pile (Visible on mobile) */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <Link
          to="/discussion"
          aria-label="Discussion"
          className="w-11 h-11 rounded-xl bg-dark-800/95 backdrop-blur-xl border border-white/10 hover:border-neon-green/40 text-gray-300 hover:text-neon-green shadow-lg active:scale-95 transition-all flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
        </Link>
      </div>

      {/* Bottom Center Floating Navigation Pile Bar (Visible on mobile) */}
      <nav
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]"
        aria-label="Mobile bottom navigation"
      >
        <div className="bg-dark-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/80 rounded-2xl p-1.5 flex items-center gap-1.5">
          {navPiles.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                title={item.label}
                className={`relative flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'w-12 h-12 rounded-xl bg-neon-green/20 border-2 border-neon-green text-neon-green shadow-lg shadow-neon-green/20 scale-105'
                    : 'w-11 h-11 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobilePillNav;
