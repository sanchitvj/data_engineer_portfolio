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
  gustFactor: number;
  gustPhase: number;
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
  gustFactor: number;
  gustPhase: number;
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
  'polygon(50% 0%, 100% 60%, 80% 100%, 20% 100%, 0% 60%)',
  'polygon(30% 0%, 100% 40%, 70% 100%, 20% 100%, 0% 30%)',
  'polygon(50% 0%, 85% 50%, 100% 80%, 70% 100%, 30% 100%, 0% 80%, 15% 50%)',
  'polygon(60% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 40% 0%)',
  'polygon(50% 0%, 90% 30%, 100% 70%, 75% 100%, 25% 100%, 0% 70%, 10% 30%)',
];

// Snowflake crystal shapes
const crystalShapes = [
  "polygon(50% 0%, 45% 15%, 30% 10%, 35% 25%, 20% 30%, 35% 35%, 30% 50%, 40% 45%, 50% 60%, 60% 45%, 70% 50%, 65% 35%, 80% 30%, 65% 25%, 70% 10%, 55% 15%)",
  "polygon(50% 0%, 47% 17%, 40% 10%, 43% 30%, 25% 25%, 40% 40%, 30% 50%, 50% 43%, 70% 50%, 60% 40%, 75% 25%, 57% 30%, 60% 10%, 53% 17%, 50% 0%, 50% 35%, 65% 50%, 50% 65%, 35% 50%, 50% 35%)",
  "polygon(50% 0%, 44% 19%, 35% 10%, 40% 22%, 20% 22%, 37% 30%, 30% 50%, 50% 37%, 70% 50%, 63% 30%, 80% 22%, 60% 22%, 65% 10%, 56% 19%, 50% 0%, 45% 25%, 55% 25%, 55% 40%, 45% 40%, 45% 25%)"
];

// Function to generate a random point either on screen or off screen
const getRandomPoint = (offScreen = false) => {
  if (offScreen) {
    const zone = Math.floor(Math.random() * 8);
    
    switch (zone) {
      case 0: return { x: Math.random() * 100, y: -20 };
      case 1: return { x: 120, y: -20 };
      case 2: return { x: 120, y: Math.random() * 100 };
      case 3: return { x: 120, y: 120 };
      case 4: return { x: Math.random() * 100, y: 120 };
      case 5: return { x: -20, y: 120 };
      case 6: return { x: -20, y: Math.random() * 100 };
      case 7: return { x: -20, y: -20 };
      default: return { x: 0, y: 0 };
    }
  } else {
    return { 
      x: Math.random() * 100,
      y: Math.random() * 100
    };
  }
};

const BlogIcebergBackground: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [iceCrystals, setIceCrystals] = useState<IceCrystal[]>([]);
  const [icebergs, setIcebergs] = useState<Iceberg[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);
  const [windGustTime, setWindGustTime] = useState(0);
  const rippleCount = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for tablets/mobile
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Generate snowflakes, ice crystals, and icebergs
  useEffect(() => {
    // Adjust counts based on device
    const snowflakeCount = isMobile ? 15 : 60;
    const crystalCount = isMobile ? 5 : 20;
    const icebergInitialCount = isMobile ? 4 : 12;
    
    // Regular snowflakes - smaller and more numerous with faster speed
    const newSnowflakes = Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 40 + 20,
      delay: Math.random() * 5,
      gustFactor: Math.random() * 10 + 5,
      gustPhase: Math.random() * Math.PI * 2,
    }));
    
    // Ice crystals - larger, shaped like snowflakes, with gust effect
    const newCrystals = Array.from({ length: crystalCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100,
      size: Math.random() * 15 + 10,
      opacity: Math.random() * 0.3 + 0.4,
      speed: Math.random() * 10 + 6,
      delay: Math.random() * 15,
      rotation: Math.random() * 360,
      variant: Math.floor(Math.random() * crystalShapes.length),
      gustFactor: Math.random() * 15 + 10,
      gustPhase: Math.random() * Math.PI * 2,
    }));
    
    setSnowflakes(newSnowflakes);
    setIceCrystals(newCrystals);
    
    // Create initial icebergs
    createIcebergs(icebergInitialCount);

    // Set up wind gust timing - not needed on mobile
    if (!isMobile) {
    const windInterval = setInterval(() => {
      setWindGustTime(prev => prev + 0.05);
    }, 50);

    return () => clearInterval(windInterval);
    }
  }, [isMobile]);
  
  // Function to create a new set of icebergs
  const createIcebergs = (count: number = 12) => {
    const newIcebergs = Array.from({ length: count }, (_, i) => {
      let startPoint, endPoint;
      
      if (i < Math.floor(count/3)) {
        startPoint = getRandomPoint(false);
        endPoint = getRandomPoint(true);
      } else if (i < Math.floor(count*2/3)) {
        startPoint = getRandomPoint(true);
        endPoint = getRandomPoint(false);
      } else {
        startPoint = Math.random() > 0.5 ? getRandomPoint(true) : getRandomPoint(false);
        endPoint = Math.random() > 0.5 ? getRandomPoint(true) : getRandomPoint(false);
      }
      
      return {
        id: i,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        size: Math.random() * 5 + 4,
        rotation: Math.random() * 20 - 10,
        shape: Math.floor(Math.random() * icebergShapes.length),
        duration: Math.random() * 50 + 30,
      };
    });
    
    setIcebergs(newIcebergs);
  };
  
  // Handle mouse movement for ripple effect - only on desktop
  useEffect(() => {
    if (isMobile) return; // Skip ripple effects on mobile
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
      
      if (Math.random() > 0.70) {
        rippleCount.current += 1;
        const newRipple = { x, y, key: rippleCount.current };
        setRipples(prev => [...prev, newRipple]);
        
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
  }, [isMobile]);
  
  // Regenerate icebergs periodically - less frequently on mobile
  useEffect(() => {
    if (isMobile) {
      // Simplified iceberg regeneration for mobile - less frequent
      const regenerateInterval = setInterval(() => {
        const useOffscreenStart = Math.random() > 0.3;
        const startPoint = getRandomPoint(useOffscreenStart);
        const endPoint = getRandomPoint(Math.random() > 0.5);
        
        const newIceberg = {
          id: Date.now(),
          startX: startPoint.x,
          startY: startPoint.y,
          endX: endPoint.x,
          endY: endPoint.y,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 20 - 10,
          shape: Math.floor(Math.random() * icebergShapes.length),
          duration: Math.random() * 40 + 30,
        };
        
        // Keep only a few icebergs on mobile
        setIcebergs(prev => [...prev.slice(-3), newIceberg]);
      }, 8000); // Twice as slow on mobile
      
      return () => clearInterval(regenerateInterval);
    } else {
      // Original desktop behavior
    const regenerateInterval = setInterval(() => {
      const useOffscreenStart = Math.random() > 0.3;
      const startPoint = getRandomPoint(useOffscreenStart);
      const endPoint = getRandomPoint(Math.random() > 0.5);
      
      const newIceberg = {
        id: Date.now(),
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 20 - 10,
        shape: Math.floor(Math.random() * icebergShapes.length),
        duration: Math.random() * 40 + 30,
      };
      
      setIcebergs(prev => [...prev.slice(-14), newIceberg]);
    }, 4000);
    
    return () => clearInterval(regenerateInterval);
    }
  }, [isMobile]);
  
  // Regenerate occasional ice crystals - fewer and slower on mobile
  useEffect(() => {
    if (isMobile) {
      // Simplified crystal regeneration for mobile
      const regenerateCrystals = setInterval(() => {
        const newCrystal = {
          id: Date.now(),
          x: Math.random() * 100,
          y: -20,
          size: Math.random() * 15 + 10,
          opacity: Math.random() * 0.3 + 0.4,
          speed: Math.random() * 10 + 6,
          delay: 0,
          rotation: Math.random() * 360,
          variant: Math.floor(Math.random() * crystalShapes.length),
          gustFactor: Math.random() * 15 + 10,
          gustPhase: Math.random() * Math.PI * 2,
        };
        
        // Keep only a few crystals on mobile
        setIceCrystals(prev => [...prev.slice(-4), newCrystal]);
      }, 4000); // Twice as slow on mobile
      
      return () => clearInterval(regenerateCrystals);
    } else {
      // Original desktop behavior
    const regenerateCrystals = setInterval(() => {
      const newCrystal = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -20,
        size: Math.random() * 15 + 10,
        opacity: Math.random() * 0.3 + 0.4,
        speed: Math.random() * 10 + 6,
        delay: 0,
        rotation: Math.random() * 360,
        variant: Math.floor(Math.random() * crystalShapes.length),
        gustFactor: Math.random() * 15 + 10,
        gustPhase: Math.random() * Math.PI * 2,
      };
      
      setIceCrystals(prev => [...prev.slice(-19), newCrystal]);
    }, 2000);
    
    return () => clearInterval(regenerateCrystals);
    }
  }, [isMobile]);
  
  // Regenerate occasional snowflakes - fewer and slower on mobile
  useEffect(() => {
    if (isMobile) {
      // Simplified snowflake regeneration for mobile
      const regenerateSnowflakes = setInterval(() => {
        const newSnowflake = {
          id: Date.now(),
          x: Math.random() * 100,
          y: -10,
          size: Math.random() * 4 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 40 + 20,
          delay: 0,
          gustFactor: Math.random() * 10 + 5,
          gustPhase: Math.random() * Math.PI * 2,
        };
        
        // Keep only a few snowflakes on mobile
        setSnowflakes(prev => [...prev.slice(-14), newSnowflake]);
      }, 1500); // 3x slower on mobile
      
      return () => clearInterval(regenerateSnowflakes);
    } else {
      // Original desktop behavior
    const regenerateSnowflakes = setInterval(() => {
      const newSnowflake = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -10,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 40 + 20,
        delay: 0,
        gustFactor: Math.random() * 10 + 5,
        gustPhase: Math.random() * Math.PI * 2,
      };
      
      setSnowflakes(prev => [...prev.slice(-59), newSnowflake]);
    }, 500);
    
    return () => clearInterval(regenerateSnowflakes);
    }
  }, [isMobile]);
  
  // Calculate gust effect for x positions
  const getGustXAnimation = (gustFactor: number, gustPhase: number) => {
    // Simplified for mobile
    if (isMobile) {
      return [0, 0]; // No gust effect on mobile
    }
    
    // Original desktop behavior
    return [0, 
      `${10 * Math.cos(gustPhase)}vw`, 
      `${-5 * Math.cos(gustPhase + 0.5)}vw`, 
      `${15 * Math.cos(gustPhase + 1)}vw`, 
      `${-10 * Math.cos(gustPhase + 1.5)}vw`, 
      `${5 * Math.cos(gustPhase + 2)}vw`, 
      0
    ];
  };
  
  // Render a simplified mobile background
  if (isMobile) {
    return (
      <div 
        ref={canvasRef}
        className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#05101c] via-[#062447] to-[#04152d] z-0"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-[#04152d]/70" />
        
        {/* Background grid lines - static on mobile */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
            backgroundSize: '100px 100px' 
          }}
        />

        {/* Minimal Icebergs for mobile - use CSS transitions instead of motion for better performance */}
        {icebergs.slice(0, 4).map(iceberg => (
          <div
            key={iceberg.id}
            className="absolute opacity-20 transition-all duration-[40000ms] ease-in-out"
            style={{
              left: `${iceberg.startX}%`,
              top: `${iceberg.startY}%`,
              width: `${iceberg.size}%`,
              height: `${iceberg.size * 0.6}%`,
              clipPath: icebergShapes[iceberg.shape],
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(194, 240, 254, 0.3) 70%, rgba(37, 183, 211, 0.15) 100%)',
              transform: `translateX(${iceberg.endX - iceberg.startX}%) translateY(${iceberg.endY - iceberg.startY}%) rotate(${iceberg.rotation}deg)`,
            }}
          />
        ))}
        
        {/* Minimal Snowflakes for mobile - CSS animation for better performance */}
        {snowflakes.slice(0, 15).map(snowflake => (
          <div
            key={snowflake.id}
            className="absolute rounded-full bg-white animate-snow-fall"
            style={{
              left: `${snowflake.x}%`,
              width: `${snowflake.size}px`,
              height: `${snowflake.size}px`,
              opacity: snowflake.opacity,
              '--fall-duration': `${100 / snowflake.speed}s`,
              '--fall-delay': `${snowflake.delay}s`,
            } as React.CSSProperties}
          />
        ))}
        
        {/* Static light effects instead of animated ones */}
        <div className="absolute top-1/4 left-1/3 w-1/3 h-1/3 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
      </div>
    );
  }
  
  // Original desktop version (unchanged)
  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#05101c] via-[#062447] to-[#04152d] z-0"
    >
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
      {icebergs.map(iceberg => (
        <motion.div
          key={iceberg.id}
          className="absolute opacity-20"
          style={{
            left: `${iceberg.startX}%`,
            top: `${iceberg.startY}%`,
            width: `${iceberg.size}%`,
            height: `${iceberg.size * 0.6}%`,
            clipPath: icebergShapes[iceberg.shape],
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(194, 240, 254, 0.3) 70%, rgba(37, 183, 211, 0.15) 100%)',
            boxShadow: '0 4px 30px rgba(37, 183, 211, 0.4)',
            zIndex: -1,
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
            x: getGustXAnimation(crystal.gustFactor, crystal.gustPhase),
          }}
          transition={{
            y: {
              repeat: 0,
              duration: 100 / crystal.speed,
              ease: 'linear',
              delay: crystal.delay,
            },
            rotate: {
              repeat: 0,
              duration: 100 / crystal.speed,
              ease: 'linear',
            },
            x: {
              repeat: Infinity,
              duration: 8,
              ease: 'easeInOut',
              times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
            }
          }}
        />
      ))}
      
      {/* Snowflakes with gust effect */}
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
            x: getGustXAnimation(snowflake.gustFactor, snowflake.gustPhase),
          }}
          transition={{
            y: {
              repeat: 0,
              duration: 100 / snowflake.speed,
              ease: 'linear',
              delay: snowflake.delay,
            },
            x: {
              repeat: Infinity,
              duration: 6,
              ease: 'easeInOut',
              times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
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
      
      {/* Wind gust visualization - subtle hint of direction */}
      <motion.div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: 'easeInOut',
        }}
      />
      
      {/* Additional ambient lighting effects */}
      <div className="absolute top-1/4 left-1/3 w-1/3 h-1/3 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 bg-[#25B7D3]/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default BlogIcebergBackground; 