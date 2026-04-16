import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  totalItems: number;
  showPageSizeOptions?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  showPageSizeOptions = true
}) => {
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100">
      <div className="flex items-center gap-4">
        <p className="text-xs font-bold text-slate-500">
          Affichage de <span className="text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> à{' '}
          <span className="text-slate-900">{Math.min(currentPage * pageSize, totalItems)}</span> sur{' '}
          <span className="text-slate-900">{totalItems}</span> entrées
        </p>
        
        {showPageSizeOptions && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} par page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Première page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-8 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-all",
                currentPage === page
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-110"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Dernière page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
