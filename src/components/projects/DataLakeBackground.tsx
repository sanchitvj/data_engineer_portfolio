'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

const DataLakeBackground: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);
  const rippleCount = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Generate data particles
  useEffect(() => {
    const particleCount = 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 40 + 10,
    }));
    
    setParticles(newParticles);
  }, []);
  
  // Handle mouse movement for ripple effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
      
      // Only create ripples occasionally based on movement distance
      if (Math.random() > 0.97) {
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
  
  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-dark to-dark-100"
    >
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Data Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            x: ['-20vw', '20vw'],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'mirror',
              duration: particle.speed,
              ease: 'linear',
            },
            opacity: {
              repeat: Infinity,
              duration: particle.speed / 2,
              ease: 'easeInOut',
            },
          }}
        />
      ))}
      
      {/* Mouse Ripples */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.key}
          className="absolute border border-data/30 rounded-full"
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
      
      {/* Bottom Wave Effect */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-data/20"
          style={{ 
            maskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 1200 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z\' opacity=\'.25\'%3E%3C/path%3E%3Cpath d=\'M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z\' opacity=\'.5\'%3E%3C/path%3E%3Cpath d=\'M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z\'%3E%3C/path%3E%3C/svg%3E")',
            maskSize: '100% 100%',
          }}
          animate={{
            x: ['-25%', '0%', '-25%'],
          }}
          transition={{
            x: { repeat: Infinity, duration: 20, ease: 'linear' },
          }}
        />
        <motion.div 
          className="absolute inset-0 bg-data/20"
          style={{ 
            maskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 1200 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z\' opacity=\'.25\'%3E%3C/path%3E%3Cpath d=\'M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z\' opacity=\'.5\'%3E%3C/path%3E%3Cpath d=\'M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z\'%3E%3C/path%3E%3C/svg%3E")',
            maskSize: '100% 100%',
          }}
          animate={{
            x: ['0%', '-25%', '0%'],
          }}
          transition={{
            x: { repeat: Infinity, duration: 15, ease: 'linear' },
          }}
        />
      </div> */}

      {/* Additional ambient lighting effects */}
      <div className="absolute top-1/4 left-1/3 w-1/3 h-1/3 bg-data/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-1/4 h-1/4 bg-data/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default DataLakeBackground; 