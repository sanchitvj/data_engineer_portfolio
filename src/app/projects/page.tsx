'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../../components/layout/MainLayout';
import DataIsland from '../../components/projects/DataIsland';
import IcebergBackground from '../../components/projects/IcebergBackground';
import FilterControls from '../../components/projects/FilterControls';
import Header from '../../components/layout/Header';
import { projects } from '../../data/projects';
import Image from 'next/image';

// Define project categories
const projectCategories = [
  'Data Engineering',
  'AI',
  'Deep Learning', 
  'Research'
];

// Assign categories to projects
const categorizedProjects = [
  {
    ...projects[0], // Betflow
    category: 'Data Engineering',
  },
  {
    ...projects[1], // GRAG
    category: 'AI',
  },
  {
    ...projects[2], // rsppUnet
    category: ['Deep Learning', 'Research'],
  },
  {
    ...projects[3], // Image-Dehazing
    category: ['Deep Learning'],
  },
  // {
  //   ...projects[4], // Confidential Project
  //   category: 'Data Engineering',
  // }
];

export default function Projects2Page() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState(categorizedProjects);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter projects based on active filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredProjects(categorizedProjects);
    } else {
      setFilteredProjects(
        categorizedProjects.filter(project => {
          if (Array.isArray(project.category)) {
            return project.category.includes(activeFilter);
          }
          return project.category === activeFilter;
        })
      );
    }
  }, [activeFilter]);
  
  // Set loaded state after initial render
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Use IcebergBackground instead of DataLakeBackground */}
      <IcebergBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-6 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Project <span className="text-data">Island</span>
              <Image 
                src="/images/right_mac_penguin.png" 
                alt="Penguin" 
                width={50} 
                height={50}
                className="inline-block ml-4 animate-float"
              />
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Explore my data engineering projects, each represented as an island in the data lake.
              Click on any island to discover more about the project.
            </p>
          </motion.div>

          {/* Filter Controls */}
          <FilterControls 
            categories={projectCategories} 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter} 
          />

          {/* Data Lake Visualization */}
          <div className="relative w-full max-w-7xl mx-auto">
            {/* Featured Project (Betflow) */}
            <div className="mb-12">
              {filteredProjects.find(p => p.id === 'betflow') && (
                <div className="max-w-3xl mx-auto">
                  <DataIsland 
                    project={filteredProjects.find(p => p.id === 'betflow')!} 
                    index={0}
                    isFeatured={true}
                  />
                </div>
              )}
            </div>

            {/* Other Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects
                .filter(p => p.id !== 'betflow')
                .map((project, index) => (
                  <div key={project.id} className="h-full">
                    <DataIsland project={project} index={index} />
                  </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 