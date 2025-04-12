'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '../../types/project';
import { Github, ExternalLink } from 'lucide-react';

interface IcebergCardProps {
  project: Project;
  index: number;
}

const IcebergCard: React.FC<IcebergCardProps> = ({ project, index }) => {
  return (
    <div className="relative p-2">
      <div className="relative h-full overflow-hidden rounded-lg bg-gradient-to-b from-dark-200 to-dark-400 border border-dark-300 shadow-lg backdrop-blur-sm">
        {/* Main Content Container */}
        <div className="flex flex-col h-full p-6 text-white">
          {/* Top Section - Two Columns */}
          <div className="flex flex-col md:flex-row md:gap-6 mb-6">
            {/* Left Content - Title, Description, Features */}
            <div className="flex-1 flex flex-col mb-4 md:mb-0">
              {/* Project Title */}
              <h3 className="mb-2 text-2xl font-bold text-data">{project.title}</h3>
              
              {/* Project Description */}
              <p className="mb-4 text-gray-300">{project.description}</p>
              
              {/* Project Features */}
              <div>
                <h4 className="mb-1 text-sm font-semibold text-data">KEY FEATURES</h4>
                <ul className="list-disc pl-5 text-sm text-gray-300">
                  {project.features.map((feature, idx) => (
                    <li key={idx} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Right Content - Technology Pond */}
            <div className="md:w-64 shrink-0 rounded-lg bg-data/40 border border-data/30 p-4 self-start flex flex-col">
              <div className="mb-2 flex items-center">
                <h4 className="text-sm font-semibold text-dark-800">TECHNOLOGIES</h4>
                <img 
                  src="/icons/black_n_white_penguin.svg" 
                  alt="Penguin" 
                  className="ml-2 h-5 w-5"
                />
              </div>
              <div className="flex flex-wrap gap-2 flex-grow">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center rounded-md bg-white/80 px-3 py-1 text-xs font-medium text-dark-200 shadow-sm border border-data/20"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Links (Full Width) */}
          <div className="pt-2 flex justify-end gap-3 border-t border-dark-500/30">
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full bg-dark-800 p-2 shadow-md hover:bg-data/20"
              >
                <Github className="h-5 w-5 text-data" />
              </a>
            )}
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full bg-dark-800 p-2 shadow-md hover:bg-data/20"
              >
                <ExternalLink className="h-5 w-5 text-data" />
              </a>
            )}
            {!project.isExternal && (
              <Link 
                href={`/projects/${project.id}`}
                className="rounded-full bg-dark-800 p-2 shadow-md hover:bg-data/20"
              >
                <span className="flex h-5 w-5 items-center justify-center text-data">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebergCard; 