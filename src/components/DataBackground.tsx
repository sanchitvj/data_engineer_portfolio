'use client';

import React from 'react';
import { motion } from 'framer-motion';

const DataBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />

      {/* Animated Pipeline Lines */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-pipeline-light to-transparent animate-pipeline"
            style={{
              top: `${15 + i * 20}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.3 + (i * 0.1),
            }}
          />
        ))} */}
        
        {/* Pipeline Particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-pipeline-light animate-pipeline"
            style={{
              top: `${15 + (i % 5) * 20}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Animated Database Icons */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            <svg
              className="w-8 h-8 text-data-light opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Data Flow Particles */}
      {/* <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-data-light rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div> */}

      {/* Circuit Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/images/circuit-pattern.svg')] opacity-5" />
    </div>
  );
};

export default DataBackground; 