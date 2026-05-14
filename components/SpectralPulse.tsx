'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';

export function SpectralPulse() {
  const [count, setCount] = useState(124); // Starting with a base number

  useEffect(() => {
    // Simulate real-time pulses
    const interval = setInterval(() => {
      setCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intensity increases with count (logarithmic relative to base)
  const intensity = Math.min(Math.max((count - 100) / 100, 0.2), 1);

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-violet-950/20 border border-violet-900/30 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3 * intensity, 0.6 * intensity, 0.3 * intensity]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-4 h-4 rounded-full bg-violet-400 blur-[4px]"
        />
        <div className="relative w-2 h-2 rounded-full bg-violet-400" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-medium text-violet-300/80 font-mono">
        {count} RESONATING NOW
      </span>
    </div>
  );
}
