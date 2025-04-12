'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Snowflake {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
}

const ArcticBackground: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  
  useEffect(() => {
    // Generate random snowflakes on component mount
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Random x position (%)
      size: Math.random() * 0.3 + 0.1, // Random size between 0.1 and 0.4rem
      delay: Math.random() * 5, // Random delay
      duration: Math.random() * 5 + 10, // Random duration between 10-15s
    }));
    
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Ocean Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-900" />
      
      {/* Aurora Effect */}
      <motion.div 
        className="absolute inset-0 opacity-30 bg-gradient-to-r from-green-300 via-purple-400 to-blue-500"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.02, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      />
      
      {/* Ocean Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-blue-800 to-transparent">
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i} 
            className="absolute bottom-0 left-0 right-0 h-[15vh] bg-blue-700 opacity-20"
            style={{ bottom: `${(i - 1) * 5}vh` }}
            animate={{
              x: ['-5%', '0%', '5%', '0%', '-5%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 10 + i * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${flake.x}%`,
            width: `${flake.size}rem`,
            height: `${flake.size}rem`,
            top: '-1rem',
          }}
          animate={{
            y: ['0vh', '100vh'],
            opacity: [0, 1, 0.7, 0],
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: flake.duration,
              ease: "linear",
              delay: flake.delay,
            },
            opacity: {
              repeat: Infinity,
              duration: flake.duration,
              ease: "easeInOut",
              delay: flake.delay,
              times: [0, 0.1, 0.9, 1],
            },
          }}
        />
      ))}
    </div>
  );
};

export default ArcticBackground; 