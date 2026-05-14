'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SPIRAL_NODES_19, Tier, TIERS } from '@/lib/one-spirit-logic';

interface SpiralMandalaProps {
  currentDay: number;
  tier: Tier;
  onNodeClick?: (day: number) => void;
}

export function SpiralMandala({ currentDay, tier, onNodeClick }: SpiralMandalaProps) {
  const tierColors = TIERS[tier].colors;

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto overflow-visible p-8">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(157,78,221,0.2)]">
        {/* Background spiral path */}
        <motion.path
          d={`M 50 50 ${SPIRAL_NODES_19.map(n => `L ${n.x} ${n.y}`).join(' ')}`}
          fill="none"
          stroke="rgba(157,78,221,0.1)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Nodes */}
        {SPIRAL_NODES_19.map((node) => {
          const isCompleted = node.day <= currentDay;
          const isCurrent = node.day === currentDay;

          return (
            <motion.circle
              key={node.day}
              cx={node.x}
              cy={node.y}
              r={isCurrent ? 2.5 : 1.5}
              fill={isCompleted ? tierColors.primary : '#2d2d44'}
              stroke={isCompleted ? tierColors.secondary : '#4a4a6a'}
              strokeWidth={isCurrent ? 1 : 0.5}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                opacity: isCompleted ? 1 : 0.4
              }}
              whileHover={{ scale: 1.5, opacity: 1 }}
              onClick={() => onNodeClick?.(node.day)}
              className="cursor-pointer transition-colors duration-300"
              style={{
                filter: isCurrent ? `drop-shadow(0 0 8px ${tierColors.primary})` : 'none'
              }}
            />
          );
        })}
      </svg>
      
      {/* Central Pulsing Source */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 bg-violet-500 rounded-full blur-xl"
        />
      </div>
    </div>
  );
}
