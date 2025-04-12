'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  delay: number;
}

interface IceCrystal {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  delay: number;
  rotation: number;
  variant: number;
}

interface Iceberg {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  rotation: number;
  shape: number;
  duration: number;
}

// Array of different iceberg shapes (clip-path polygons)
const icebergShapes = [
  'polygon(50% 0%, 100% 60%, 80% 100%, 20% 100%, 0% 60%)', // Original shape
  'polygon(30% 0%, 100% 40%, 70% 100%, 20% 100%, 0% 30%)', // More asymmetric
  'polygon(50% 0%, 85% 50%, 100% 80%, 70% 100%, 30% 100%, 0% 80%, 15% 50%)', // More complex
  'polygon(60% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 40% 0%)', // Hexagonal
  'polygon(50% 0%, 90% 30%, 100% 70%, 75% 100%, 25% 100%, 0% 70%, 10% 30%)', // Diamond-like
];

// Snowflake crystal shapes
const crystalShapes = [
  // Traditional 6-pointed snowflake
  "polygon(50% 0%, 45% 15%, 30% 10%, 35% 25%, 20% 30%, 35% 35%, 30% 50%, 40% 45%, 50% 60%, 60% 45%, 70% 50%, 65% 35%, 80% 30%, 65% 25%, 70% 10%, 55% 15%)",
  
  // Classic 6-armed snowflake with holes
  "polygon(50% 0%, 47% 17%, 40% 10%, 43% 30%, 25% 25%, 40% 40%, 30% 50%, 50% 43%, 70% 50%, 60% 40%, 75% 25%, 57% 30%, 60% 10%, 53% 17%, 50% 0%, 50% 35%, 65% 50%, 50% 65%, 35% 50%, 50% 35%)",
  
  // Intricate 6-pointed snowflake
  "polygon(50% 0%, 44% 19%, 35% 10%, 40% 22%, 20% 22%, 37% 30%, 30% 50%, 50% 37%, 70% 50%, 63% 30%, 80% 22%, 60% 22%, 65% 10%, 56% 19%, 50% 0%, 45% 25%, 55% 25%, 55% 40%, 45% 40%, 45% 25%)"
];

// Function to generate a random point either on screen or off screen
const getRandomPoint = (offScreen = false) => {
  if (offScreen) {
    // Choose a random position off-screen
    // Randomly select one of 8 zones: top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
    const zone = Math.floor(Math.random() * 8);
    
    switch (zone) {
      case 0: // top
        return { x: Math.random() * 100, y: -20 };
      case 1: // top-right
        return { x: 120, y: -20 };
      case 2: // right
        return { x: 120, y: Math.random() * 100 };
      case 3: // bottom-right
        return { x: 120, y: 120 };
      case 4: // bottom
        return { x: Math.random() * 100, y: 120 };
      case 5: // bottom-left
        return { x: -20, y: 120 };
      case 6: // left
        return { x: -20, y: Math.random() * 100 };
      case 7: // top-left
        return { x: -20, y: -20 };
      default:
        return { x: 0, y: 0 };
    }
  } else {
    // Return a random point within the viewport
    return { 
      x: Math.random() * 100,
      y: Math.random() * 100
    };
  }
};

const IcebergBackground: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [iceCrystals, setIceCrystals] = useState<IceCrystal[]>([]);
  const [icebergs, setIcebergs] = useState<Iceberg[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);
  const rippleCount = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Generate snowflakes, ice crystals, and icebergs
  useEffect(() => {
    // Regular snowflakes - smaller and more numerous
    const snowflakeCount = 40;
    const newSnowflakes = Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50, // Start above the screen
      size: Math.random() * 3 + 1, // Smaller size: 1-4px
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 25 + 5, // Slower speed: 5-10
      delay: Math.random() * 7, // More varied delays
    }));
    
    // Ice crystals - larger, shaped like snowflakes, fewer
    const crystalCount = 18;
    const newCrystals = Array.from({ length: crystalCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100, // Start further above the screen
      size: Math.random() * 15 + 10, // Larger: 10-25px
      opacity: Math.random() * 0.3 + 0.4, // More opaque: 0.4-0.7
      speed: Math.random() * 3 + 3, // Even slower: 3-6
      delay: Math.random() * 30, // More spaced out
      rotation: Math.random() * 360, // Random initial rotation
      variant: Math.floor(Math.random() * crystalShapes.length), // Choose a random shape
    }));
    
    setSnowflakes(newSnowflakes);
    setIceCrystals(newCrystals);
    
    // Create initial icebergs
    createIcebergs();
  }, []);
  
  // Function to create a new set of icebergs
  const createIcebergs = () => {
    const icebergCount = 12;
    const newIcebergs = Array.from({ length: icebergCount }, (_, i) => {
      let startPoint, endPoint;
      
      if (i < 5) {
        // First few icebergs - some start within viewport to be immediately visible
        startPoint = getRandomPoint(false); // On screen
        endPoint = getRandomPoint(true);    // Off screen
      } else if (i < 10) {
        // Next set - all start off screen but go to on-screen points before exiting
        startPoint = getRandomPoint(true);   // Off screen
        endPoint = getRandomPoint(false);    // On screen
      } else {
        // Last set - completely random paths (could be off-to-off or diagonally across)
        startPoint = Math.random() > 0.5 ? getRandomPoint(true) : getRandomPoint(false);
        endPoint = Math.random() > 0.5 ? getRandomPoint(true) : getRandomPoint(false);
      }
      
      return {
        id: i,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        size: Math.random() * 5 + 4, // Slightly larger: 4-11% of screen
        rotation: Math.random() * 20 - 10, // Rotation range: -10 to +10 degrees
        shape: Math.floor(Math.random() * icebergShapes.length), // Random shape index
        duration: Math.random() * 50 + 30, // 30-60 seconds
      };
    });
    
    setIcebergs(newIcebergs);
  };
  
  // Handle mouse movement for ripple effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
      
      // Create ripples occasionally based on movement
      if (Math.random() > 0.70) {
        rippleCount.current += 1;
        const newRipple = { x, y, key: rippleCount.current };
        setRipples(prev => [...prev, newRipple]);
        
        // Remove ripple after animation completes
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.key !== newRipple.key));
        }, 2000);
      }
    };
    
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);
  
  // Regenerate icebergs periodically
  useEffect(() => {
    const regenerateInterval = setInterval(() => {
      // Add a new iceberg with completely random path
      const useOffscreenStart = Math.random() > 0.3; // 70% chance of starting offscreen
      const startPoint = getRandomPoint(useOffscreenStart);
      const endPoint = getRandomPoint(Math.random() > 0.5); // 50% chance of ending offscreen
      
      const newIceberg = {
        id: Date.now(), // Use timestamp for unique ID
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 20 - 10,
        shape: Math.floor(Math.random() * icebergShapes.length),
        duration: Math.random() * 40 + 30,
      };
      
      setIcebergs(prev => [...prev.slice(-14), newIceberg]); // Keep only the last 15 icebergs
    }, 4000); // Add a new iceberg every 7 seconds
    
    return () => clearInterval(regenerateInterval);
  }, []);
  
  // Regenerate occasional ice crystals
  useEffect(() => {
    const regenerateCrystals = setInterval(() => {
      const newCrystal = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -20, // Start just above the screen
        size: Math.random() * 15 + 10,
        opacity: Math.random() * 0.3 + 0.4,
        speed: Math.random() * 3 + 3,
        delay: 0, // No delay for regenerated crystals
        rotation: Math.random() * 360,
        variant: Math.floor(Math.random() * crystalShapes.length),
      };
      
      setIceCrystals(prev => [...prev.slice(-7), newCrystal]); // Keep only the last 8 crystals
    }, 5000); // Add a new crystal every 5 seconds
    
    return () => clearInterval(regenerateCrystals);
  }, []);
  
  // Regenerate occasional regular snowflakes
  useEffect(() => {
    const regenerateSnowflakes = setInterval(() => {
      const newSnowflake = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -10, // Start just above the screen
        size: Math.random() * 5 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 12 + 5,
        delay: 0, // No delay for regenerated snowflakes
      };
      
      setSnowflakes(prev => [...prev.slice(-29), newSnowflake]); // Keep only the last 30 snowflakes
    }, 1000); // Add a new snowflake every second
    
    return () => clearInterval(regenerateSnowflakes);
  }, []);
  
  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#0a192f] to-[#112240]"
    >
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Icebergs in Background */}
      {icebergs.map(iceberg => (
        <motion.div
          key={iceberg.id}
          className="absolute opacity-20" // Increased opacity for better visibility
          style={{
            left: `${iceberg.startX}%`,
            top: `${iceberg.startY}%`,
            width: `${iceberg.size}%`,
            height: `${iceberg.size * 0.6}%`,
            clipPath: icebergShapes[iceberg.shape],
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(194, 240, 254, 0.3) 70%, rgba(37, 183, 211, 0.15) 100%)',
            boxShadow: '0 4px 30px rgba(37, 183, 211, 0.4)',
            zIndex: -1, // Higher z-index to ensure visibility
          }}
          initial={{ 
            rotate: iceberg.rotation,
          }}
          animate={{
            left: `${iceberg.endX}%`,
            top: `${iceberg.endY}%`,
            rotate: [iceberg.rotation - 2, iceberg.rotation + 2, iceberg.rotation - 1],
          }}
          transition={{
            left: {
              duration: iceberg.duration,
              ease: "easeInOut",
            },
            top: {
              duration: iceberg.duration,
              ease: "easeInOut",
            },
            rotate: {
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }
          }}
        />
      ))}
      
      {/* Ice Crystals - Decorative snowflake shapes */}
      {iceCrystals.map(crystal => (
        <motion.div
          key={crystal.id}
          className="absolute"
          style={{
            left: `${crystal.x}%`,
            width: `${crystal.size}px`,
            height: `${crystal.size}px`,
            opacity: crystal.opacity,
            clipPath: crystalShapes[crystal.variant],
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(194, 240, 254, 0.8) 60%, rgba(37, 183, 211, 0.5) 100%)',
            zIndex: -2,
          }}
          initial={{ 
            y: `${-crystal.size}px`,
            rotate: crystal.rotation,
          }}
          animate={{
            y: `${window.innerHeight + crystal.size}px`,
            rotate: crystal.rotation + 360,
            x: [
              `-${crystal.size / 2}px`, 
              `${crystal.size / 2}px`, 
              `-${crystal.size}px`, 
              `${crystal.size / 3}px`
            ],
          }}
          transition={{
            y: {
              repeat: 0,
              duration: 200 / crystal.speed,
              ease: 'linear',
              delay: crystal.delay,
            },
            rotate: {
              repeat: 0,
              duration: 200 / crystal.speed,
              ease: 'linear',
            },
            x: {
              repeat: Infinity,
              duration: 8,
              ease: 'easeInOut',
              times: [0, 0.3, 0.7, 1],
            }
          }}
        />
      ))}
      
      {/* Snowflakes */}
      {snowflakes.map(snowflake => (
        <motion.div
          key={snowflake.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${snowflake.x}%`,
            width: `${snowflake.size}px`,
            height: `${snowflake.size}px`,
            opacity: snowflake.opacity,
            zIndex: -2,
          }}
          initial={{ 
            y: `-${snowflake.size}px`,
          }}
          animate={{
            y: `${window.innerHeight + snowflake.size}px`,
            x: [
              `-${snowflake.size / 2}px`, 
              `${snowflake.size / 2}px`, 
              `-${snowflake.size / 1.5}px`, 
              `${snowflake.size / 3}px`
            ],
          }}
          transition={{
            y: {
              repeat: 0,
              duration: 200 / snowflake.speed,
              ease: 'linear',
              delay: snowflake.delay,
            },
            x: {
              repeat: Infinity,
              duration: 6,
              ease: 'easeInOut',
              times: [0, 0.3, 0.7, 1],
            }
          }}
        />
      ))}
      
      {/* Mouse Ripples */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.key}
          className="absolute border border-[#25B7D3]/40 rounded-full"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ 
            width: ['0px', '200px'], 
            height: ['0px', '200px'], 
            opacity: [0.8, 0], 
            borderWidth: ['2px', '0.5px'],
          }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      ))}
      
      {/* Additional ambient lighting effects */}
      <div className="absolute top-1/4 left-1/3 w-1/3 h-1/3 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-1/4 h-1/4 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default IcebergBackground; 