'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Simple Penguin Component (Can be replaced with a more complex SVG or image)
const ConfusedPenguin = () => (
  <div className="relative w-32 h-40 mx-auto my-8">
    {/* Body */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-32 bg-gray-800 rounded-t-full"></div>
    {/* Belly */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-20 bg-white rounded-t-lg"></div>
    {/* Eyes */}
    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex space-x-4">
      <div className="w-4 h-4 bg-black rounded-full relative">
        {/* Confused squiggle for eye */}
        <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-1 h-2 bg-white transform rotate-12"></div>
      </div>
      <div className="w-4 h-4 bg-black rounded-full relative">
        {/* Confused squiggle for eye */}
        <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-1 h-2 bg-white transform -rotate-12"></div>
      </div>
    </div>
    {/* Beak */}
    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-6 h-3 bg-orange-400 rounded-b-full"></div>
    {/* Flippers - raised in confusion */}
    <div className="absolute top-16 left-0 w-8 h-10 bg-gray-800 rounded-lg transform -rotate-45 origin-top-right"></div>
    <div className="absolute top-16 right-0 w-8 h-10 bg-gray-800 rounded-lg transform rotate-45 origin-top-left"></div>
    {/* Question Mark */}
    <motion.div
      className="absolute -top-4 right-0 text-4xl text-blue-400 font-bold"
      animate={{ y: [-3, 3, -3], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      ?
    </motion.div>
  </div>
);

// Scattered Data Points Component
const DataPoints = () => (
  <div className="absolute inset-0 overflow-hidden z-0">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, Math.random() * 20 - 10, 0],
          x: [0, Math.random() * 20 - 10, 0],
          scale: [0.8, 1.2, 0.8],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: Math.random() * 5 + 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
);

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative p-4">
      <DataPoints />
      <div className="relative z-10 text-center">
        <ConfusedPenguin />
        <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
        <p className="text-2xl text-gray-300 mb-8">
          Oops! This data seems to have slipped on the ice.
        </p>
        <Link href="/">
          <span className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-lg">
            Return to Solid Ground (Home)
          </span>
        </Link>
      </div>
    </div>
  );
} 