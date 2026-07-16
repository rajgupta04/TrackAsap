import { useEffect } from 'react';
import { useLeaderboardStore } from '../store/leaderboardStore';
import LeaderboardFilters from '../components/leaderboard/LeaderboardFilters';
import Podium from '../components/leaderboard/Podium';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Pagination from '../components/leaderboard/Pagination';
import CurrentUserBanner from '../components/leaderboard/CurrentUserBanner';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Leaderboard = () => {
  const { fetchLeaderboard, fetchCurrentUserRank, leaderboardData, currentPage, isLoading } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
    fetchCurrentUserRank();
  }, [fetchLeaderboard, fetchCurrentUserRank]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 relative">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
        <p className="text-dark-300">See how you stack up against the competition.</p>
      </div>

      <LeaderboardFilters />

      {isLoading && leaderboardData.length === 0 ? (
        <div className="flex justify-center items-center py-32">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {currentPage === 1 && <Podium topUsers={leaderboardData.slice(0, 3)} />}
          
          <GlassCard className="p-0 overflow-hidden border border-dark-700/50">
            <LeaderboardTable />
          </GlassCard>

          <Pagination />
        </>
      )}

      <CurrentUserBanner />
    </div>
  );
};

export default Leaderboard;
