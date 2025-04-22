import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image 
          src="/images/loading_penguin.png" 
          alt="Loading..." 
          width={100} 
          height={100}
          className="animate-pulse"
        />
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    </div>
  );
} 