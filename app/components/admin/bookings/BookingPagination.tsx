"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface BookingPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onGoToPage: (page: number) => void;
  onGoToFirstPage: () => void;
  onGoToLastPage: () => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
}

export function BookingPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onGoToPage,
  onGoToFirstPage,
  onGoToLastPage,
  onGoToPreviousPage,
  onGoToNextPage,
}: BookingPaginationProps) {
  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
      {/* Mobile: Simple prev/next */}
      <div className="flex sm:hidden w-full justify-between items-center">
        <button
          onClick={onGoToPreviousPage}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-md border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={onGoToNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-md border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
        </button>
      </div>

      {/* Desktop: Full pagination */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onGoToFirstPage}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-border bg-card text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onGoToPreviousPage}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-border bg-card text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNumber;
          if (totalPages <= 5) {
            pageNumber = i + 1;
          } else if (currentPage <= 3) {
            pageNumber = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNumber = totalPages - 4 + i;
          } else {
            pageNumber = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNumber}
              onClick={() => onGoToPage(pageNumber)}
              className={`px-3 py-2 text-sm font-medium rounded-md border ${
                currentPage === pageNumber
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onGoToNextPage}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-border bg-card text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onGoToLastPage}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-border bg-card text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
