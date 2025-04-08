import React from 'react';
import { motion } from 'framer-motion';

const PenguinLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative w-32 h-32">
        {/* Penguin */}
        <motion.div
          className="absolute bottom-0 left-0 w-16 h-16"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Penguin Body */}
          <div className="absolute w-12 h-16 bg-white rounded-full" />
          {/* Penguin Belly */}
          <div className="absolute w-8 h-12 bg-white rounded-full top-2 left-2" />
          {/* Penguin Eyes */}
          <div className="absolute w-2 h-2 bg-black rounded-full top-4 left-4" />
          <div className="absolute w-2 h-2 bg-black rounded-full top-4 right-4" />
          {/* Penguin Beak */}
          <div className="absolute w-4 h-2 bg-orange-400 rounded-full top-6 left-6" />
          {/* Penguin Flippers */}
          <div className="absolute w-4 h-8 bg-white rounded-full top-4 -left-2 rotate-45" />
          <div className="absolute w-4 h-8 bg-white rounded-full top-4 -right-2 -rotate-45" />
        </motion.div>
      </div>
    </div>
  );
};

export default PenguinLoader; 