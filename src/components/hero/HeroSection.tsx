'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiSubstack } from 'react-icons/si';

const HeroSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section 
        id="hero-section" 
        className="min-h-[80vh] pt-20 flex items-start justify-center relative overflow-hidden px-4 pb-10"
      >
        <div className="w-full max-w-4xl mx-auto bg-dark-100 rounded-lg shadow-xl border border-dark-200 p-6 relative z-10">
          <div className="font-mono">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              Sanchit Vijay
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="hero-section" 
      className="relative min-h-[80vh] pt-20 md:pt-24 flex items-start justify-center overflow-hidden px-4 pb-10"
    >
      {/* Terminal Window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl mx-auto bg-dark-100 rounded-lg shadow-xl border border-dark-200 p-6 relative z-10"
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-red-500" />
          <div className="w-3 h-3 bg-yellow-500" />
          <div className="w-3 h-3 bg-green-500" />
        </div>
        
        <div className="font-mono">
          <p className="text-data-light mb-2">$ <span className="text-white">who --am -i</span></p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Sanchit Vijay
          </h1>
          
          <p className="text-data-light mb-2">$ <span className="text-white">cat role.txt</span></p>
          <h2 className="text-2xl md:text-3xl text-data mb-6">
            Data Engineer
          </h2>
          
          <p className="text-data-light mb-2">$ <span className="text-white">cat description.txt</span></p>
          <div className="text-gray-300 font-mono text-sm">
            <p className="flex items-start mt-4">
              <span className="mr-2 text-data">🐧</span>
              <span>As penguins navigate icy waters, I transform raw data into structured insights.</span>
            </p>
            <p className="flex items-start mt-3">
              <span className="mr-2 text-data">🐧</span>
              <span>My portfolio reflects penguins' resilience—showcasing projects that turn data into intelligence.</span>
            </p>
            <p className="flex items-start mt-3">
              <span className="mr-2 text-data">🐧</span>
              <span>Like penguins adapt to environments, I build pipelines connecting diverse data to analytics.</span>
            </p>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <motion.a
              href="https://github.com/sanchitvj"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-2xl text-dark-400 hover:text-data transition-colors"
            >
              <FaGithub />
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/sanchit-vijay"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-2xl text-dark-400 hover:text-data transition-colors"
            >
              <FaLinkedin />
            </motion.a>
            <motion.a
              href="https://sanchitvj.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-2xl text-dark-400 hover:text-data transition-colors"
            >
              <SiSubstack />
            </motion.a>
          </div>
        </div>
      </motion.div>

      {/* Data Network Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Data Flow Particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const radius = 40;
          const startX = 50 + Math.cos(angle) * radius;
          const startY = 50 + Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-data-light/40"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                x: [0, 50 - startX],
                y: [0, 50 - startY],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 6 + Math.random(),
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Background Grid */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {[...Array(64)].map((_, i) => (
            <motion.div
              key={`grid-${i}`}
              className="border border-dark-200/10"
              animate={{
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 