import { useState, useMemo } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiTool } from 'react-icons/fi';

const TableWithSearch = ({ columns, data, onRowClick, searchKeys = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return searchKeys.some(key => {
        const value = key.includes('.') 
          ? key.split('.').reduce((obj, k) => obj?.[k], row)
          : row[key];
        
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
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
    <div>
      {/* Search Bar - Only show when there's data */}
      {searchKeys.length > 0 && data.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Info - Only show when there's data */}
      {searchKeys.length > 0 && data.length > 0 && (
        <div className="mb-3 text-xs text-gray-600">
          Showing {currentData.length} of {filteredData.length} {searchTerm ? 'filtered' : ''} results
          {filteredData.length !== data.length && ` (${data.length} total)`}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    {searchTerm ? (
                      <div className="flex flex-col items-center">
                        <FiSearch className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No results found for "{searchTerm}"</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FiTool className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No data available</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                currentData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} group`}
                  >
                    <td className="px-3 sm:px-4 md:px-6 py-3 text-sm text-gray-500 font-medium">
                      {startIndex + rowIndex + 1}
                    </td>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-3 sm:px-4 md:px-6 py-3 text-sm">
                        {column.render ? column.render(row) : row[column.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Only show when there's data and multiple pages */}
      {totalPages > 1 && data.length > 0 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500'
              }`}
              aria-label="Previous page"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {renderPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-xs">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      currentPage === page
                        ? 'bg-primary-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>
            
            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500'
              }`}
              aria-label="Next page"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableWithSearch;

