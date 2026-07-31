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

          // Resolve color overrides specifically matching user PRD
          let nodeFill = '#2d2d44';
          let nodeStroke = '#4a4a6a';
          let glowColor = tierColors.primary;

          if (isCompleted) {
            if (tier === 'BOP') {
              // Black and Royal Purple
              nodeFill = '#000000';
              nodeStroke = '#4b0082';
              glowColor = '#4b0082';
            } else if (tier === 'BoP') {
              // Violet and Soft Gray
              nodeFill = '#9d4edd';
              nodeStroke = '#708090';
              glowColor = '#9d4edd';
            } else {
              // Soft Lavender and Cream
              nodeFill = '#e6e6fa';
              nodeStroke = '#f8f9fa';
              glowColor = '#e6e6fa';
            }
          }

          return (
            <motion.circle
              key={node.day}
              cx={node.x}
              cy={node.y}
              r={isCurrent ? 2.8 : 1.8}
              fill={nodeFill}
              stroke={nodeStroke}
              strokeWidth={isCurrent ? 1.2 : 0.6}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                opacity: isCompleted ? 1 : 0.4
              }}
              whileHover={{ scale: 1.6, opacity: 1 }}
              onClick={() => onNodeClick?.(node.day)}
              className="cursor-pointer transition-colors duration-300"
              style={{
                filter: isCurrent ? `drop-shadow(0 0 10px ${glowColor})` : 'none'
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
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 rounded-full blur-xl"
          style={{
            backgroundColor: tier === 'BOP' ? '#4b0082' : tier === 'BoP' ? '#9d4edd' : '#e6e6fa'
          }}
        />
      </div>
    </div>
  );
}
