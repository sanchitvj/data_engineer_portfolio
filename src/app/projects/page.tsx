'use client';

import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProjectCard from '../../components/projects/ProjectCard';
import { projects } from '../../data/projects';

export default function ProjectsPage() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 