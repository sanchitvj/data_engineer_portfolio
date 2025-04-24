'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import DataIsland from '@/components/projects/DataIsland';
import IcebergBackground from '@/components/projects/IcebergBackground';
import FilterControls from '@/components/projects/FilterControls';
import { Project } from '@/types/project';

// Define the props type expected from the Server Component
interface ProjectsClientContentProps {
  initialProjects: Array<Project & { category: string | string[] }>;
  initialProjectCategories: string[];
}

const ProjectsClientContent: React.FC<ProjectsClientContentProps> = ({ 
  initialProjects, 
  initialProjectCategories 
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredProjects, setFilteredProjects] = useState(initialProjects);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter projects based on active filter
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredProjects(initialProjects);
    } else {
      setFilteredProjects(
        initialProjects.filter(project => {
          if (Array.isArray(project.category)) {
            return project.category.includes(activeFilter);
          }
          return project.category === activeFilter;
        })
      );
    }
  }, [activeFilter, initialProjects]);
  
  // Set loaded state after initial render
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <>
      {/* Background */}
      <IcebergBackground />

      {/* Content */}
      <div className="container mx-auto px-4 pt-20 z-10 relative">
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
          categories={initialProjectCategories} 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
        />

        {/* Data Lake Visualization */}
        <div className="relative w-full max-w-7xl mx-auto pb-16">
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
      </div>
    </>
  );
}

export default ProjectsClientContent; 