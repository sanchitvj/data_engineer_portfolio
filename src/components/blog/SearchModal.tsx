'use client';

import React, { SetStateAction, Dispatch, RefObject, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { X } from 'lucide-react';

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: string;
  activeSearchTerms: string[];
  blogCategories: { id: string; label: string }[];
  searchInputRef: RefObject<HTMLInputElement>;
  showSuggestions: boolean;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  searchSuggestions: { value: string; display: string; type: string }[];
  suggestionsRef: RefObject<(HTMLButtonElement | null)[]>;
  focusedSuggestionIndex: number;
  handleSearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleFilterButtonClick: (categoryId: string) => void;
  handleSuggestionClick: (suggestion: { value: string; display: string; type: string }) => void;
  removeSearchTerm: (termToRemove: string) => void;
  resetAllFilters: () => void;
  showSearchModal: boolean;
  setShowSearchModal: Dispatch<SetStateAction<boolean>>;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  activeSearchTerms,
  blogCategories,
  searchInputRef,
  showSuggestions,
  setShowSuggestions,
  searchSuggestions,
  suggestionsRef,
  focusedSuggestionIndex,
  handleSearchEnter,
  handleFilterButtonClick,
  handleSuggestionClick,
  removeSearchTerm,
  resetAllFilters,
  showSearchModal,
  setShowSearchModal,
  handleSearchInputChange,
}) => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Check for mobile device
  useEffect(() => {
    setIsMobileDevice(window.innerWidth < 640);
    
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AnimatePresence>
      {showSearchModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[12vh] bg-black/80 backdrop-blur-sm"
          onClick={() => setShowSearchModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl max-h-[80vh] sm:max-h-[85vh] overflow-auto bg-dark-200/95 rounded-xl border border-data/30 shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-data/10 sticky top-0 bg-dark-200/95 z-10">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FaSearch className="text-data mr-3" />
                Research Terminal
              </h2>
              <button
                className="p-1 rounded-full hover:bg-dark-300 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowSearchModal(false)}
                aria-label="Close search modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="flex flex-col gap-6">
                {/* Category Filters */}
                <div className="w-full">
                  <div className="flex items-center mb-3">
                    <FaFilter className="text-data mr-3" />
                    <h3 className="text-lg font-semibold text-white">Filter by Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Add "All" Button */}
                    <button
                      key="all"
                      onClick={() => handleFilterButtonClick('all')}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-300 font-poppins ${
                        activeFilter === 'all'
                          ? 'bg-data text-dark-300 font-medium'
                          : 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      All
                    </button>
                    {['humor', 'data_engineering', 'open_source', 'ai', 'learning', 'achievement'].map((id) => {
                      const category = blogCategories.find(cat => cat.id === id) || 
                                     { id, label: id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ') };
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleFilterButtonClick(category.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-300 font-poppins ${
                            activeFilter === category.id
                              ? 'bg-data text-dark-300 font-medium'
                              : 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full h-px bg-data/10"></div>

                {/* Keyword Search */}
                <div className="w-full">
                  <div className="flex items-center mb-3">
                    <FaSearch className="text-data mr-3" />
                    <h3 className="text-lg font-semibold text-white">Search in Tags</h3>
                  </div>
                  <div className="relative">
                    {/* Input Area */}
                    <div className="flex items-center bg-dark-300/50 rounded-lg border border-data/30 pr-2 focus-within:border-data/50 focus-within:ring-1 focus-within:ring-data/30 transition-all">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={isMobileDevice ? "Add up to 3 keywords..." : "Add up to 3 keywords (e.g., humor, learning, ai)..."}
                        className="bg-transparent border-none focus:outline-none text-white w-full font-poppins px-3 py-2 sm:py-3 text-sm sm:text-base"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onFocus={() => !isMobileDevice && setShowSuggestions(true)}
                        onKeyDown={handleSearchEnter}
                        disabled={activeSearchTerms.length >= 3}
                        aria-label="Search keywords"
                        autoComplete="off"
                      />
                      {/* Clear Input Button */}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-gray-400 hover:text-white p-1"
                          aria-label="Clear search input"
                        >
                          <X size={16} />
                        </button>
                      )}
                      {/* Penguin Icon */}
                      <div className="bg-dark-300/70 rounded-full p-1 ml-1">
                        <Image
                          src="/images/blog/search_penguin.png"
                          alt=""
                          width={24}
                          height={24}
                          className="animate-wave"
                        />
                      </div>
                    </div>

                    {/* Mobile search helper text */}
                    {isMobileDevice && searchQuery && (
                      <p className="text-xs text-data/80 mt-2 italic">
                        Type your keyword and press Enter to add it to your search.
                      </p>
                    )}

                    {/* Suggestions Dropdown - Only show on larger screens */}
                    {showSuggestions && searchSuggestions.length > 0 && !isMobileDevice && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-dark-300/95 backdrop-blur-md rounded-lg border border-data/20 shadow-lg overflow-hidden"
                        style={{ maxHeight: '180px' }}
                      >
                        <ul className="py-2">
                          {searchSuggestions.map((suggestion, index) => (
                            <li key={`${suggestion.value}-${index}`} className="px-1">
                              <button
                                ref={(el) => {
                                  if (suggestionsRef.current) {
                                    suggestionsRef.current[index] = el;
                                  }
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-data/10 text-gray-300 hover:text-white flex items-center text-sm ${
                                  focusedSuggestionIndex === index ? 'bg-data/10 text-white' : ''
                                }`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={() => {}}
                                role="option"
                                aria-selected={focusedSuggestionIndex === index}
                              >
                                <FaSearch className="text-data mr-2 opacity-70 shrink-0" size={12} />
                                <span className="truncate">{suggestion.display}</span>
                                {suggestion.type === 'category' && (
                                  <span className="text-xs text-data ml-auto pl-2 shrink-0">(category)</span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                  {/* Display Active Search Terms in Modal */}
                  {activeSearchTerms.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-300">
                      <span className="mr-1 font-medium text-gray-400">Active keywords:</span>
                      {activeSearchTerms.map((term) => (
                        <span key={term} className="bg-data/20 text-data px-2 py-1 rounded-full flex items-center text-xs">
                          {term}
                          <button
                            onClick={() => removeSearchTerm(term)}
                            className="ml-1.5 text-gray-400 hover:text-white"
                            aria-label={`Remove keyword ${term}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {activeSearchTerms.length >= 3 && (
                    <p className="text-xs text-yellow-400 mt-2">Maximum of 3 keywords reached.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-data/10 sticky bottom-0 bg-dark-200/95 z-10 flex justify-between items-center">
              <button
                onClick={resetAllFilters}
                className="text-sm text-data hover:text-data-light transition-colors"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setShowSearchModal(false)}
                className="bg-data hover:bg-data-light text-dark-300 px-5 py-1.5 rounded-lg font-medium transition-colors text-sm"
              >
                Apply & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal; 