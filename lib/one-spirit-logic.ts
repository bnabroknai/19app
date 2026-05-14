export type Archetype = 'Witness' | 'Warrior' | 'Orphan' | 'Code-See-er';
export type Tier = 'BOP' | 'BoP' | 'bOp';

export interface SpiralProfile {
  archetype: Archetype;
  tier: Tier;
}

export const ARCHETYPES: Record<Archetype, { lineage: string; description: string }> = {
  Witness: { 
    lineage: 'Vedic', 
    description: 'Focuses on long-term orientation and patience. Evolutionary Great Year cycles.' 
  },
  Warrior: { 
    lineage: 'Hebrew/Gnostic', 
    description: 'Focuses on boundaries and action. Targets rigidity vs surrender.' 
  },
  Orphan: { 
    lineage: 'Sufi', 
    description: 'Focuses on longing and resonance. Finding containers for permeability.' 
  },
  'Code-See-er': { 
    lineage: 'Synthesis', 
    description: 'Focuses on pattern recognition. Targets the intellectual leak of analysis-paralysis.' 
  }
};

export const TIERS = {
  BOP: { name: 'Root/Adult', colors: { primary: '#000000', secondary: '#4b0082' } },
  BoP: { name: 'Teen/Mature', colors: { primary: '#9d4edd', secondary: '#708090' } },
  bOp: { name: 'Kids 10+', colors: { primary: '#e6e6fa', secondary: '#f8f9fa' } }
};

export function getDayTitle(day: number): string {
  if (day <= 12) return `Ascent: Day ${day} (Root to Crown)`;
  return `Descent: Day ${day} (Crown to Root)`;
}

export function calculateCycleProgress(lastDay: number, cycle: number) {
  // 19 days per cycle
  return ((cycle - 1) * 19 + lastDay) / (19 * 10); // arbitrary max
}

export const SPIRAL_NODES_19 = Array.from({ length: 19 }, (_, i) => {
  const angle = (i / 19) * Math.PI * 4; // two full rotations for 19 days
  const radius = 20 + i * 4;
  return {
    x: 50 + radius * Math.cos(angle - Math.PI / 2),
    y: 50 + radius * Math.sin(angle - Math.PI / 2),
    day: i + 1
  };
});
