'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Snowfall() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[#25B7D3]/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: window.innerHeight + 20,
            x: [null, Math.random() * 100 - 50],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        >
          ❄
        </motion.div>
      ))}
    </div>
  );
} 