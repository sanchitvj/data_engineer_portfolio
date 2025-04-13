'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const IcebergBackground: React.FC = () => {
  // Generate random positions for icebergs
  const icebergPositions = [
    { id: 1, left: '5%', top: '15%', size: 80, rotate: -5, delay: 0 },
    { id: 2, left: '15%', top: '70%', size: 60, rotate: 8, delay: 0.2 },
    { id: 3, left: '75%', top: '25%', size: 100, rotate: -10, delay: 0.4 },
    { id: 4, left: '85%', top: '80%', size: 70, rotate: 15, delay: 0.6 },
    { id: 5, left: '45%', top: '60%', size: 50, rotate: -8, delay: 0.8 },
  ];

  // Generate random positions for penguins
  const penguinPositions = [
    { id: 1, left: '10%', top: '30%', size: 30, delay: 1.0 },
    { id: 2, left: '70%', top: '40%', size: 25, delay: 1.2 },
    { id: 3, left: '30%', top: '80%', size: 35, delay: 1.4 },
    { id: 4, left: '50%', top: '50%', size: 40, delay: 1.6 },
    { id: 5, left: '90%', top: '20%', size: 30, delay: 1.8 },
    { id: 6, left: '60%', top: '70%', size: 35, delay: 2.0 },
  ];

  // Generate snow particles
  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 20,
    size: Math.random() * 5 + 2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#05101c] via-[#062447] to-[#04152d] z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-[#04152d]/70" />
      
      {/* Background grid lines (research grid) */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{ 
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
          backgroundSize: '100px 100px' 
        }}
      />

      {/* Icebergs */}
      {icebergPositions.map((iceberg) => (
        <motion.div
          key={iceberg.id}
          className="absolute"
          style={{
            left: iceberg.left,
            top: iceberg.top,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.3, y: 0 }}
          transition={{ duration: 1, delay: iceberg.delay }}
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [iceberg.rotate, iceberg.rotate + 2, iceberg.rotate] }}
            transition={{ 
              y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 7, ease: "easeInOut" }
            }}
          >
            <div 
              className="bg-white/20 backdrop-blur-sm rounded-md"
              style={{ 
                width: iceberg.size * 1.5, 
                height: iceberg.size, 
                clipPath: 'polygon(0% 30%, 20% 0%, 80% 0%, 100% 30%, 85% 100%, 15% 100%)',
                boxShadow: '0 0 40px rgba(134, 238, 255, 0.2)'
              }}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Penguins */}
      {penguinPositions.map((penguin) => (
        <motion.div
          key={penguin.id}
          className="absolute z-10"
          style={{
            left: penguin.left,
            top: penguin.top,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: penguin.delay }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            {/* <Image
              src="/images/small_penguin.png"
              alt="Penguin"
              width={penguin.size}
              height={penguin.size}
              className="select-none pointer-events-none"
            /> */}
          </motion.div>
        </motion.div>
      ))}

      {/* Snowflakes */}
      {/* {snowflakes.map((snowflake) => (
        <motion.div
          key={snowflake.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: snowflake.left,
            top: -10,
            width: snowflake.size,
            height: snowflake.size,
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.random() > 0.5 ? 20 : -20],
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: snowflake.duration,
              ease: 'linear',
              delay: snowflake.delay,
            },
            x: {
              repeat: Infinity,
              duration: snowflake.duration / 2,
              ease: 'easeInOut',
              repeatType: 'reverse',
              delay: snowflake.delay,
            },
          }}
        />
      ))} */}

      {/* Data visualizations in background (research equipment) */}
      <div className="absolute bottom-10 left-10 w-20 h-40 bg-data/5 rounded-lg border border-data/10 backdrop-blur-sm opacity-30 hidden md:block">
        <div className="h-full flex flex-col justify-evenly p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div 
              key={i}
              className="w-full h-2 bg-data/30 rounded-full"
              animate={{ width: ['30%', '70%', '50%', '30%'] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>
      </div>

      <div className="absolute top-20 right-10 w-40 h-20 bg-data/5 rounded-lg border border-data/10 backdrop-blur-sm opacity-30 hidden md:block">
        <div className="h-full flex items-center justify-center">
          <motion.div 
            className="w-12 h-12 border-2 border-data/40 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              borderColor: ['rgba(0, 255, 163, 0.2)', 'rgba(0, 255, 163, 0.5)', 'rgba(0, 255, 163, 0.2)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Polar lights effect */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-500/10 to-transparent opacity-30" />
    </div>
  );
}; 