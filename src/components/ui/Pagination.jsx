'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Premium Pagination Component
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.totalResults - Total number of items
 * @param {number} props.itemsPerPage - Items displayed per page
 * @param {string} props.className - Additional CSS classes
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalResults,
  itemsPerPage,
  className = '',
}) {
  if (totalPages <= 1 && !totalResults) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-gray-400"
          >
            <MoreHorizontal size={14} />
          </span>
        );
      }

      const isActive = currentPage === page;

      return (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`
            relative w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-md text-[11px] md:text-sm font-semibold transition-all duration-200
            ${isActive 
              ? 'bg-primary text-white shadow-md shadow-primary/20 z-10' 
              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-primary border border-gray-100 hover:border-primary/30'
            }
          `}
        >
          {isActive && (
            <motion.div
              layoutId="pagination-active"
              className="absolute inset-0 bg-primary rounded-md -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {page}
        </button>
      );
    });
  };

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className={`mt-0 pb-10 sm:pb-12 flex flex-row items-center justify-between gap-x-2 w-full border-t border-gray-100 pt-6 ${className}`}>
      {/* Results Info - Left Side */}
      {totalResults > 0 && (
        <p className="text-[10px] sm:text-[11px] md:text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px] xs:max-w-[160px] sm:max-w-none">
          Showing <span className="text-gray-900 font-semibold">{startIdx}</span> to{" "}
          <span className="text-gray-900 font-semibold">{endIdx}</span> of{" "}
          <span className="text-gray-900 font-semibold">{totalResults}</span> results
        </p>
      )}

      {/* Pagination Controls - Right Side */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 md:p-2 rounded-md bg-white border border-gray-100 text-gray-600 transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed shadow-sm md:shadow-md"
          title="Previous Page"
        >
          <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 md:gap-2">
          {renderPageNumbers()}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 md:p-2 rounded-md bg-white border border-gray-100 text-gray-600 transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed shadow-sm md:shadow-md"
          title="Next Page"
        >
          <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </div>
  );
}
