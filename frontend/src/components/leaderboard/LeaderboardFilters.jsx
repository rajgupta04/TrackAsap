import { Search, Trophy, Calendar, Clock } from 'lucide-react';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { useState, useEffect } from 'react';

const LeaderboardFilters = () => {
  const { activeTab, setActiveTab, setSearchQuery, isLoading } = useLeaderboardStore();
  const [localSearch, setLocalSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const tabs = [
    { id: 'global', label: 'Global Rank', icon: <Trophy className="w-4 h-4" /> },
    { id: 'monthly', label: 'Monthly', icon: <Calendar className="w-4 h-4" /> },
    { id: 'weekly', label: 'Weekly', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      {/* Tabs */}
      <div className="flex bg-dark-800/50 p-1 rounded-xl backdrop-blur-sm border border-dark-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full md:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-dark-400" />
        </div>
        <input
          type="text"
          placeholder="Search competitors..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-dark-800/50 border border-dark-700/50 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-dark-400"
        />
      </div>
    </div>
  );
};

export default LeaderboardFilters;
