'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Save, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { DailyContent } from '@/lib/mock-content';
import { Tier, TIERS, ARCHETYPES, Archetype } from '@/lib/one-spirit-logic';

interface DailyCardProps {
  content: DailyContent;
  archetype: Archetype;
  cycle: number;
  onComplete: (journal: string) => void;
  isCompleted: boolean;
}

export function DailyCard({ content, archetype, cycle, onComplete, isCompleted }: DailyCardProps) {
  const [journal, setJournal] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const tierColors = TIERS[content.tier].colors;
  const archetypeInfo = ARCHETYPES[archetype];

  // Dynamically change copy tone based on archetype (simplifying for demo)
  const getGreeting = () => {
    switch(archetype) {
      case 'Witness': return "Observe the Great Year unfolding within.";
      case 'Warrior': return "Prepare for the shift. Boundaries are your vessel.";
      case 'Orphan': return "The Beloved calls from the silence.";
      case 'Code-See-er': return "Decoding the pattern of the shard.";
      default: return "Your daily resonance.";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-violet-900/30 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tighter text-white">Day {content.day}</h1>
          <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mt-1">
            Cycle {cycle} • {archetypeInfo.lineage} Path
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium italic text-violet-300/80">{getGreeting()}</p>
        </div>
      </div>

      {/* Prayer Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 p-8 rounded-3xl border border-violet-900/10 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Share2 className="w-4 h-4 text-violet-400 cursor-pointer" />
        </div>
        <p className="text-xl leading-relaxed italic text-cream text-center font-serif">
          &ldquo;{content.prayer}&rdquo;
        </p>
        <div className="mt-4 flex justify-center">
          <div className="w-12 h-0.5 bg-violet-500/30 rounded-full" />
        </div>
      </motion.section>

      {/* Practice Cue */}
      <section className="bg-violet-950/20 p-6 rounded-3xl border border-violet-900/30 space-y-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-violet-600 hover:bg-violet-500 transition-colors shadow-[0_0_15px_rgba(157,78,221,0.4)]"
          >
            {isPlaying ? <Pause className="text-white" /> : <Play className="ml-1 text-white" />}
          </button>
          <div>
            <h3 className="font-medium text-cream uppercase text-xs tracking-widest">Shard Protocol: 110Hz Practice</h3>
            <p className="text-sm text-slate-400">Marcus (Wounded/Rasp) • 4:20</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 border-l-2 border-violet-500/40 pl-4 py-1 italic">
          {content.practiceCue}
        </p>
      </section>

      {/* Reflection Prompt */}
      <section className="space-y-4">
        <label className="block text-sm font-medium text-violet-200">
           {content.prompt}
        </label>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="What arises from the shard..."
          disabled={isCompleted}
          className="w-full h-32 bg-black/40 border border-violet-900/50 rounded-2xl p-4 text-cream placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
        />
        {!isCompleted && (
          <button 
            onClick={() => onComplete(journal)}
            disabled={!journal.trim()}
            className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-white shadow-lg active:scale-[0.98]"
          >
            Complete Integration
          </button>
        )}
        {isCompleted && (
          <div className="w-full py-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Day Integrated
          </div>
        )}
      </section>
    </div>
  );
}
