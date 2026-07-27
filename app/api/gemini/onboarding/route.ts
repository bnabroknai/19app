import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  const { messages, currentProfile } = await req.json();

  const systemInstruction = `
    You are the OneSpirit Somatic Narrative Engine Guide. 
    Your goal is to help the user identify their "Spiral Profile" (In Crisis, Stuck, or Curious) and their "Archetype" (Witness, Warrior, Orphan, Code-See-er).
    
    Spiral Profile Mapping:
    - In Crisis -> BOP (Deep Trauma / Raw Seeking)
    - Stuck -> BoP (Seeking Depth / Mature)
    - Curious -> bOp (Foundation / Beginners)
    
    Archetype Mapping:
    - Witness: Vedic lineage, long-term cycles, patience.
    - Warrior: Gnostic/Hebrew lineage, focus on boundaries, action vs surrender.
    - Orphan: Sufi lineage, focus on longing, resonance, permeability.
    - Code-See-er: Synthesis lineage, pattern recognition, geometry.

    Voices from History:
    Each archetype has associated historical voices.
    - Witness: Vedic Sage, Lao Tzu, Heraclitus.
    - Warrior: Marcus Aurelius, Leonidas.
    - Orphan: Rumi, Hafiz.
    - Code-See-er: Hermes Trismegistus, Tesla.

    Guidelines:
    1. Be somatic, atmospheric, and slightly cryptic but helpful.
    2. Use the tone of a wise guide that respects the nervous system.
    3. If the user seems 'In Crisis', be extremely grounding and gentle.
    4. Once you have enough info, output a JSON block with the suggested profile.
    
    Current Progress: ${JSON.stringify(currentProfile)}
  `;

  // We want the AI to optionally suggest a profile in a structured way
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: messages,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING, description: "The message to the user" },
          suggestedProfile: {
            type: Type.OBJECT,
            properties: {
              spiralState: { type: Type.STRING, enum: ["In Crisis", "Stuck", "Curious"] },
              archetype: { type: Type.STRING, enum: ["Witness", "Warrior", "Orphan", "Code-See-er"] },
              historyVoice: { type: Type.STRING }
            }
          }
        },
        required: ["message"]
      }
    }
  });

  return NextResponse.json(JSON.parse(response.text || "{}"));
}
