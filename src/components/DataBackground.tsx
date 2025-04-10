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
          <motion.div
            key={i}
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-pipeline-light to-transparent"
            style={{
              top: `${15 + i * 20}%`,
            }}
            animate={{
              x: [-100, 100],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear"
            }}
          />
        ))} */}
        
        {/* Pipeline Particles */}
        {/* {[...Array(3)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-pipeline-light"
            style={{
              top: `${15 + (i % 5) * 20}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [-100, 100],
              opacity: [0.9, 0.8, 0.9],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
          />
        ))} */}
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

      {/* Animated Penguin Icons */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`penguin-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              x: [0, 100],
              rotate: [0, 360],
              opacity: [0, 0.8, 0],
              scale: [0.4, 1.1, 0.4],
            }}
            transition={{
              y: {
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              },
              x: {
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              },
              opacity: {
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              },
              scale: {
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <img
              src="/icons/bg_penguin.svg"
              alt="Penguin"
              className="w-8 h-8"
            />
          </motion.div>
        ))}
      </div>

      {/* Data Flow Particles */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-data-light rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.8, 0],
              scale: [0.4, 1.1, 0.4],
            }}
            transition={{
              duration: 100,
              repeat: Infinity,
              delay: Math.random() * 50,
              ease: "easeInOut"
            }}
          />
        ))} */}
      </div>

      {/* Circuit Pattern Overlay */}
      {/* <div className="absolute inset-0 bg-[url('/images/circuit-pattern.svg')] opacity-10" /> */}
    </div>
  );
};

export default DataBackground; 