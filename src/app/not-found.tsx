'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Import the same background component used in home page
const BlogIcebergBackground = dynamic(() => import('@/components/blog/BlogIcebergBackground'), {
  ssr: true,
  loading: () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
    </div>
  )
});

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
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
      <BlogIcebergBackground />
      <DataPoints />
      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-8">
          <Image 
            src="/images/oops_penguin.png" 
            alt="Oops! Something went wrong" 
            width={200} 
            height={200}
            className="mx-auto"
          />
        </div>
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