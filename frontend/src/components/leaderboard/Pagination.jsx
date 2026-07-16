import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLeaderboardStore } from '../../store/leaderboardStore';

const Pagination = () => {
  const { currentPage, totalPages, setPage, isLoading } = useLeaderboardStore();

  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) setPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setPage(currentPage + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:text-white disabled:opacity-50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && setPage(page)}
          disabled={page === '...' || isLoading}
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all duration-200 ${
            page === currentPage
              ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
              : page === '...'
              ? 'text-dark-400 cursor-default'
              : 'bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:text-white hover:border-dark-500'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages || isLoading}
        className="p-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:text-white disabled:opacity-50 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
