import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../ui/table';
import { Pagination } from './Pagination';
import { EmptyState } from '../ui/empty-state';
import { cn } from '../../../lib/utils';
import { Database, Maximize2, Minimize2 } from 'lucide-react';

interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  showCompactToggle?: boolean;
  initialCompact?: boolean;
  className?: string;
  zebra?: boolean;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyMessage = "Aucun résultat trouvé",
  showCompactToggle = true,
  initialCompact = false,
  className,
  zebra = true,
  stickyHeader = true
}: DataTableProps<T>) {
  const [isCompact, setIsCompact] = useState(initialCompact);

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col", className)}>
      {showCompactToggle && (
        <div className="flex justify-end px-4 py-2 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-primary transition-colors"
          >
            {isCompact ? (
              <>
                <Maximize2 className="w-3 h-3" /> Vue Standard
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3" /> Vue Compacte
              </>
            )}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table stickyHeader={stickyHeader} maxHeight="60vh">
          <TableHeader sticky={stickyHeader}>
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((col, idx) => (
                <TableHead 
                  key={idx} 
                  className={cn(
                    "bg-[#1E293B] h-12 px-6 text-[10px] font-black uppercase tracking-widest text-white border-none",
                    col.className
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className={cn(zebra && "[&_tr:nth-child(even)]:bg-[#008F3905]")}>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <EmptyState
                    icon={Database}
                    title="Aucun resultat"
                    description={emptyMessage}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow 
                  key={idx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-all hover:bg-primary/5 cursor-default border-b border-slate-50",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, j) => (
                    <TableCell 
                      key={j} 
                      className={cn(
                        "px-6 transition-all",
                        isCompact ? "py-2 text-[11px]" : "py-4 text-sm",
                        col.className
                      )}
                    >
                      {col.cell ? col.cell(item) : (item[col.accessorKey!] as any)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
