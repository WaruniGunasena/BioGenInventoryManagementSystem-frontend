import React from "react";

const PaginationComponent = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5, // configurable
}) => {
  if (totalPages <= 1) return null;

  // safety
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, safeCurrentPage - half);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const pageNumbers = [];
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="pagination-container" aria-label="Pagination Navigation">
      <button
        className="pagination-button"
        disabled={safeCurrentPage === 1}
        onClick={() => onPageChange(safeCurrentPage - 1)}
        aria-label="Previous Page"
      >
        &laquo; Prev
      </button>

      {start > 1 && (
        <>
          <button
            className="pagination-button"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {pageNumbers.map((number) => (
        <button
          key={number}
          className={`pagination-button ${
            safeCurrentPage === number ? "active" : ""
          }`}
          onClick={() => onPageChange(number)}
          aria-current={safeCurrentPage === number ? "page" : undefined}
        >
          {number}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button
            className="pagination-button"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="pagination-button"
        disabled={safeCurrentPage === totalPages}
        onClick={() => onPageChange(safeCurrentPage + 1)}
        aria-label="Next Page"
      >
        Next &raquo;
      </button>
    </nav>
  );
};

export default PaginationComponent;
