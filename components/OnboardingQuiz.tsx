'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archetype, Tier, ARCHETYPES, TIERS } from '@/lib/one-spirit-logic';
import { Button } from '@/components/ui/button'; // I need to create this or use a standard button
import { Card } from '@/components/ui/card'; // I'll use standard tailwind for now

interface OnboardingProps {
  onComplete: (profile: { archetype: Archetype; tier: Tier }) => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<{ archetype: Archetype; tier: Tier }>>({});

  const questions = [
    {
      title: "Select your Current Frequency",
      options: [
        { label: "Deep Trauma / Raw Seeking", tier: 'BOP' as Tier, sub: "BOP: Unfiltered & Visceral" },
        { label: "Seeking Depth / Mature", tier: 'BoP' as Tier, sub: "BoP: Accessible High-Depth" },
        { label: "Foundation / Beginners (10+)", tier: 'bOp' as Tier, sub: "bOp: Foundational Grounding" }
      ],
      field: 'tier'
    },
    {
      title: "Identify your Spiral Archetype",
      options: [
        { label: "The Witness", archetype: 'Witness' as Archetype, sub: "Vedic: Long-term cycles, patience" },
        { label: "The Warrior", archetype: 'Warrior' as Archetype, sub: "Gnostic: Boundaries, action, surrender" },
        { label: "The Orphan", archetype: 'Orphan' as Archetype, sub: "Sufi: Longing, resonance, permeability" },
        { label: "The Code-See-er", archetype: 'Code-See-er' as Archetype, sub: "Synthesis: Patterns, intellectual integration" }
      ],
      field: 'archetype'
    }
  ];

  const handleSelect = (val: any) => {
    const updatedProfile = { ...profile, [questions[step].field]: val };
    setProfile(updatedProfile);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(updatedProfile as { archetype: Archetype; tier: Tier });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-lg mx-auto bg-[#1a1a2e] text-[#f8f9fa] rounded-2xl border border-violet-900/40">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-medium tracking-tight text-violet-300">
              {questions[step].title}
            </h2>
            <p className="text-sm text-slate-400">Step {step + 1} of {questions.length}</p>
          </div>

          <div className="grid gap-4">
            {questions[step].options.map((opt: any, idx) => (
              <button
                key={idx}
                id={`onboarding-opt-${idx}`}
                onClick={() => handleSelect(opt[questions[step].field])}
                className="w-full p-4 text-left rounded-xl bg-violet-950/20 border border-violet-900/40 hover:bg-violet-900/30 hover:border-violet-500/50 transition-all group"
              >
                <div className="font-medium text-lg text-cream group-hover:text-white">{opt.label}</div>
                <div className="text-xs text-slate-400 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
