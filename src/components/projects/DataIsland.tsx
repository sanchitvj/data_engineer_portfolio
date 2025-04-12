'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Project } from '../../types/project';
import { Github, ExternalLink, Info, X, Youtube, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataIslandProps {
  project: Project;
  index: number;
  isFeatured?: boolean;
}

const DataIsland: React.FC<DataIslandProps> = ({ project, index, isFeatured = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Add global animations to the document head
  useEffect(() => {
    // Create style element for animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes ripple {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      @keyframes ping-slow {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        50% {
          transform: scale(1.5);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }
      
      @keyframes wave {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }
      
      .animate-ripple {
        animation: ripple 2s infinite;
      }
      
      .animate-ping-slow {
        animation: ping-slow 2s infinite;
      }
      
      .animate-wave {
        animation: wave 2s ease-in-out infinite;
      }
    `;
    
    // Add to document head
    document.head.appendChild(styleEl);
    
    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Determine island size based on featured status
  const islandSize = 'col-span-1 md:col-span-1 row-span-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative group cursor-pointer ${isFeatured ? 'scale-110' : ''}`}
    >
      <div className="h-full">
        <div className="relative h-full overflow-hidden rounded-xl backdrop-blur-sm bg-gradient-to-br from-white/10 to-[#25B7D3]/10 border-2 border-[#25B7D3]/30 shadow-lg shadow-[#25B7D3]/20 group transition-all duration-300 hover:shadow-[#25B7D3]/30 hover:shadow-xl">
          {/* Glowing border effect */}
          <div className="absolute inset-0 border-2 border-[#25B7D3]/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Content Container */}
          <div className="relative z-10 flex flex-col h-full p-6 text-[#25B7D3]">
            {/* Project Title */}
            <h3 className="mb-2 text-2xl font-bold text-[#25B7D3]">{project.title}</h3>
            
            {/* Project Description */}
            <p className="mb-4 text-white/70">{project.description}</p>
            
            {/* Technology Tags */}
            <div className="mt-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-sm border-2 border-[#25B7D3]/30"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Links and Details Button */}
            <div className="pt-2 flex justify-between items-center border-t border-white/20">
              {/* Details Button */}
              <button
                onClick={() => setShowDetails(true)}
                className="relative rounded-full bg-white/10 p-2 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                <Info className="h-5 w-5 text-white relative z-10" />
              </button>
              
              {/* External Links */}
              <div className="flex gap-3">
                {project.githubUrl && (
                  <a 
                    href={project.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-full bg-white/10 p-2 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    <Github className="h-5 w-5 text-white relative z-10" />
                  </a>
                )}
                
                {project.demoUrl && (
                  <a 
                    href={project.demoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-full bg-white/10 p-2 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    <ExternalLink className="h-5 w-5 text-white relative z-10" />
                  </a>
                )}

                {project.publicationUrl && (
                  <a 
                    href={project.publicationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-full bg-white/10 p-2 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    <FileText className="h-5 w-5 text-white relative z-10" />
                  </a>
                )}
                
                {!project.isExternal && (
                  <Link 
                    href={`/projects/${project.id}`}
                    className="relative rounded-full bg-white/10 p-2 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    <span className="flex h-5 w-5 items-center justify-center text-white relative z-10">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Details Modal */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[80vh] overflow-auto bg-gradient-to-br from-white/10 to-[#25B7D3]/10 rounded-xl border-2 border-[#25B7D3]/30 shadow-lg shadow-[#25B7D3]/20 mt-20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#25B7D3] transition-colors"
                  onClick={() => setShowDetails(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="relative z-20 p-6 md:p-8">
                  {/* Project Header */}
                  <div className="mb-6 md:mb-8 border-b border-[#25B7D3]/30 pb-4 md:pb-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#25B7D3] mb-3 md:mb-4">{project.title}</h2>
                    <p className="text-lg md:text-xl text-white/80">{project.description}</p>
                  </div>
                  
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {/* Project Image */}
                    {project.imageUrl && (
                      <div className="overflow-hidden rounded-xl border-2 border-[#25B7D3]/30 w-full">
                        <div className="relative aspect-video w-full">
                          <Image 
                            src={project.imageUrl} 
                            alt={project.title}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                      {/* Left Column - Project Overview */}
                      <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        {/* Project Overview */}
                        <div className="bg-white/10 p-4 md:p-6 rounded-xl border-2 border-[#25B7D3]/30 shadow-md shadow-[#25B7D3]/10">
                          <h3 className="text-xl md:text-2xl font-semibold text-[#25B7D3] mb-3 md:mb-4 flex items-center">
                            <span className="w-2 h-6 md:h-8 bg-[#25B7D3]/50 mr-3 rounded-sm"></span>
                            Project Overview
                          </h3>
                          <div className="space-y-3 md:space-y-4">
                            <div>
                              <h4 className="text-base md:text-lg font-medium text-[#25B7D3] mb-2">Objective</h4>
                              <p className="text-white/80 text-sm md:text-base">{project.objective || 'No objective provided'}</p>
                            </div>
                            <div>
                              <h4 className="text-base md:text-lg font-medium text-[#25B7D3] mb-2">Key Features</h4>
                              <ul className="list-disc list-inside text-white/80 text-sm md:text-base space-y-2">
                                {project.features?.map((feature, idx) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        {/* Technical Details */}
                        <div className="bg-white/10 p-4 md:p-6 rounded-xl border-2 border-[#25B7D3]/30 shadow-md shadow-[#25B7D3]/10">
                          <h3 className="text-xl md:text-2xl font-semibold text-[#25B7D3] mb-3 md:mb-4 flex items-center">
                            <span className="w-2 h-6 md:h-8 bg-[#25B7D3]/50 mr-3 rounded-sm"></span>
                            Technical Details
                          </h3>
                          <div className="space-y-3 md:space-y-4">
                            <div>
                              <h4 className="text-base md:text-lg font-medium text-[#25B7D3] mb-2">Architecture</h4>
                              <p className="text-white/80 text-sm md:text-base">{project.architecture || 'No architecture details provided'}</p>
                            </div>
                            <div>
                              <h4 className="text-base md:text-lg font-medium text-[#25B7D3] mb-2">Challenges</h4>
                              <p className="text-white/80 text-sm md:text-base">{project.challenges || 'No challenges provided'}</p>
                            </div>
                            {/* <div>
                              <h4 className="text-base md:text-lg font-medium text-[#25B7D3] mb-2">Solutions</h4>
                              <ul className="list-disc list-inside text-white/80 text-sm md:text-base space-y-2">
                                {project.solutions?.map((solution, idx) => (
                                  <li key={idx}>{solution}</li>
                                ))}
                              </ul>
                            </div> */}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column - Project Info */}
                      <div className="space-y-6 md:space-y-8">
                        {/* Technologies */}
                        <div className="bg-white/10 p-4 md:p-6 rounded-xl border-2 border-[#25B7D3]/30 shadow-md shadow-[#25B7D3]/10">
                          <h3 className="text-xl md:text-2xl font-semibold text-[#25B7D3] mb-3 md:mb-4 flex items-center">
                            <span className="w-2 h-6 md:h-8 bg-[#25B7D3]/50 mr-3 rounded-sm"></span>
                            Technologies
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center justify-center rounded-md bg-white/10 px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-white shadow-sm border-2 border-[#25B7D3]/30"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Metrics */}
                        <div className="bg-white/10 p-3 md:p-4 rounded-xl border-2 border-[#25B7D3]/30 shadow-md shadow-[#25B7D3]/10">
                          <h3 className="text-lg md:text-xl font-semibold text-[#25B7D3] mb-2 md:mb-3 flex items-center">
                            <span className="w-2 h-5 md:h-6 bg-[#25B7D3]/50 mr-2 rounded-sm"></span>
                            Metrics & Impact
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {project.metrics?.map((metric, idx) => (
                              <div key={idx} className="bg-white/5 px-2 py-1 rounded border border-[#25B7D3]/20 min-w-[120px]">
                                <p className="text-white/60 text-s leading-tight inline">{metric.label}: </p>
                                <p className="text-[#25B7D3] text-s font-medium leading-tight inline">{metric.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Links */}
                        <div className="bg-white/10 p-4 md:p-6 rounded-xl border-2 border-[#25B7D3]/30 shadow-md shadow-[#25B7D3]/10">
                          <h3 className="text-xl md:text-2xl font-semibold text-[#25B7D3] mb-3 md:mb-4 flex items-center">
                            <span className="w-2 h-6 md:h-8 bg-[#25B7D3]/50 mr-3 rounded-sm"></span>
                            Links
                          </h3>
                          <div className="space-y-2 md:space-y-3">
                            {project.githubUrl && (
                              <a 
                                href={project.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 md:gap-3 rounded-lg bg-white/10 px-3 md:px-4 py-2 md:py-3 text-[#25B7D3] hover:bg-white/20 transition-colors text-sm md:text-base border border-[#25B7D3]/30"
                              >
                                <Github className="h-4 w-4 md:h-5 md:w-5" />
                                <span>GitHub Repository</span>
                              </a>
                            )}
                            {project.demoUrl && (
                              <a 
                                href={project.demoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 md:gap-3 rounded-lg bg-white/10 px-3 md:px-4 py-2 md:py-3 text-[#25B7D3] hover:bg-white/20 transition-colors text-sm md:text-base border border-[#25B7D3]/30"
                              >
                                {project.demoUrl.includes('youtube.com') || project.demoUrl.includes('youtu.be') ? (
                                  <>
                                    <Youtube className="h-4 w-4 md:h-5 md:w-5" />
                                    <span>Demo Video</span>
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                                    <span>Documentation</span>
                                  </>
                                )}
                              </a>
                            )}
                            {project.publicationUrl && (
                              <a 
                                href={project.publicationUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 md:gap-3 rounded-lg bg-white/10 px-3 md:px-4 py-2 md:py-3 text-[#25B7D3] hover:bg-white/20 transition-colors text-sm md:text-base border border-[#25B7D3]/30"
                              >
                                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                <span>Research Paper</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DataIsland; 