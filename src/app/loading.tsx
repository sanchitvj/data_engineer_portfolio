'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Array of fun facts about penguins
const penguinFacts = [
  "Penguin feathers glow under UV.",
  "There are 18 different species of penguins.",
  "Waddle - group of penguins on land.",
  "Raft - group of penguins in water.",
  "Some penguins build rock nests.",
  "Penguin couples propose with pebbles.",
];

export default function Loading() {
  // Start with a stable fact (first one) for server rendering
  const [fact, setFact] = useState(penguinFacts[0]);
  
  // Only randomize on the client after mounting
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * penguinFacts.length);
    setFact(penguinFacts[randomIndex]);
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/90">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Image 
          src="/images/loading_penguin.png" 
          alt="Loading..." 
          width={190} 
          height={190}
          className="animate-pulse mb-4"
          priority
        />
        <div className="text-sm text-data/80 animate-pulse">Loading...</div>
        
        <div className="mt-8 max-w-m text-center">
          <div className="text-white/70 text-m mb-1">Did you know?</div>
          <div className="text-data font-medium text-lg">{fact}</div>
        </div>
      </div>
    </div>
  );
} 