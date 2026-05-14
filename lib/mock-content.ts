import { Tier } from './one-spirit-logic';

export interface DailyContent {
  day: number;
  tier: Tier;
  prayer: string;
  prompt: string;
  practiceCue: string;
  audioUrl?: string;
}

export const MOCK_CONTENT: Record<number, Record<Tier, DailyContent>> = {
  1: {
    BOP: {
      day: 1,
      tier: 'BOP',
      prayer: "I am the shard. I am the split. I return to the ground that holds the heat of the first fire.",
      prompt: "What shard of your former self are you still clutching so tightly that it bleeds?",
      practiceCue: "Humming Session: Focus on the base of the spine. Emit a 110Hz resonant hum for 3 minutes. Feel the vibration anchor you to the bedrock.",
      audioUrl: "https://example.com/audio/bop-d1.mp3"
    },
    BoP: {
      day: 1,
      tier: 'BoP',
      prayer: "Today I ground myself. I am here, present in the pulse of the earth.",
      prompt: "What is one thing you're ready to let go of to start this journey?",
      practiceCue: "Breathing Exercise: Slow, deep cycles. Visualize roots growing from your feet into the earth.",
      audioUrl: "https://example.com/audio/bop-d1.mp3"
    },
    bOp: {
      day: 1,
      tier: 'bOp',
      prayer: "I am safe. I am strong. I am part of the big beautiful world.",
      prompt: "Draw or describe a secret place in nature where you feel happy.",
      practiceCue: "Tapping: Gently tap your feet on the ground. One, two. One, two.",
      audioUrl: "https://example.com/audio/bop-d1.mp3"
    }
  },
  // Adding more days would be good, but I'll generate others dynamically for demo
};

export function getDailyContent(day: number, tier: Tier): DailyContent {
  return MOCK_CONTENT[day]?.[tier] || {
    day,
    tier,
    prayer: `[Day ${day}] The light descends. We find resonance in the middle of the silence.`,
    prompt: `What frequency is your heart beating at today?`,
    practiceCue: `Somatic Focus: 110Hz Resonant Humming. Focus on the heart gate.`,
    audioUrl: ""
  };
}
