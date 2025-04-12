'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FilterControlsProps {
  categories: string[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  categories, 
  activeFilter, 
  setActiveFilter 
}) => {
  return (
    <motion.div 
      className="container mx-auto mb-6 bg-[#0A2540]/80 backdrop-blur-sm p-3 rounded-xl border border-[#25B7D3]/30 shadow-lg max-w-fit"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[#25B7D3] font-bold text-sm">Project Filter:</h3>
          <button
            className={`px-5 py-1.5 text-xs rounded-full transition-all duration-200 ${
              activeFilter === 'all' 
                ? 'bg-[#25B7D3] text-white shadow-lg shadow-[#25B7D3]/20' 
                : 'bg-transparent text-gray-300 hover:bg-[#25B7D3]/10 border border-[#25B7D3]/30'
            }`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              className={`px-5 py-1.5 text-xs rounded-full transition-all duration-200 ${
                activeFilter === category 
                  ? 'bg-[#25B7D3] text-white shadow-lg shadow-[#25B7D3]/20' 
                  : 'bg-transparent text-gray-300 hover:bg-[#25B7D3]/10 border border-[#25B7D3]/30'
              }`}
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FilterControls; 