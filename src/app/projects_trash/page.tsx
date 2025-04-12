'use client';

import React, { useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import IcebergCard from '../../components/projects_old/IcebergCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import { projects } from '../../data/projects';

export default function ProjectsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <MainLayout>
      <div ref={containerRef} className="relative min-h-screen pt-20 pb-32">
        {/* Hero Title */}
        <motion.div 
          className="container mx-auto mb-16 text-center"
          style={{ opacity, scale, y }}
        >
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            My <span className="text-data">Projects</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Explore my latest work in data science, machine learning, and software development.
            Each card showcases key features and technologies used.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            {projects.map((project, index) => (
              <IcebergCard 
                key={project.id} 
                project={project} 
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 