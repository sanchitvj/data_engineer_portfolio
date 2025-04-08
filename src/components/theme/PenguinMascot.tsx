import React from 'react';
import { motion } from 'framer-motion';

const PenguinMascot: React.FC = () => {
  return (
    <motion.div
      className="relative w-24 h-24"
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Penguin Body */}
      <div className="absolute w-20 h-24 bg-black rounded-full" />
      
      {/* Penguin Belly */}
      <div className="absolute w-16 h-20 bg-white rounded-full top-2 left-2" />
      
      {/* Penguin Eyes */}
      <div className="absolute w-3 h-3 bg-white rounded-full top-6 left-6" />
      <div className="absolute w-3 h-3 bg-white rounded-full top-6 right-6" />
      <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-6.5 left-6.5" />
      <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-6.5 right-6.5" />
      
      {/* Penguin Beak */}
      <div className="absolute w-6 h-3 bg-orange-400 rounded-full top-10 left-9" />
      
      {/* Penguin Flippers */}
      <div className="absolute w-6 h-12 bg-black rounded-full top-6 -left-2 rotate-45" />
      <div className="absolute w-6 h-12 bg-black rounded-full top-6 -right-2 -rotate-45" />
      
      {/* Penguin Feet */}
      <div className="absolute w-4 h-2 bg-orange-400 rounded-full bottom-0 left-4" />
      <div className="absolute w-4 h-2 bg-orange-400 rounded-full bottom-0 right-4" />
    </motion.div>
  );
};

export default PenguinMascot; 