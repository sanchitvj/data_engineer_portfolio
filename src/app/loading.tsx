import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/90">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Image 
          src="/images/loading_penguin.png" 
          alt="Loading..." 
          width={220} 
          height={220}
          className="animate-pulse mb-4"
          priority
        />
        <div className="text-sm text-data/80 animate-pulse">Loading...</div>
      </div>
    </div>
  );
} 