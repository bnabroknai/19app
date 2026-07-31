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
  try {
    const { messages, voice, archetype, currentDay, tier } = await req.json();

    const systemInstruction = `
      You are speaking as ${voice || 'a guide'}, a historical voice aligned with the ${archetype || 'Witness'} archetype and the ${tier || 'BoP'} tier.
      Your current user is on Day ${currentDay || 1} of their 19-day somatic narrative grounding cycle.

      Historical context guidelines:
      - If you are a Vedic Sage / Heraclitus / Lao Tzu: Talk about eternal cycles, flow, holding space, observing without grasping.
      - If you are Marcus Aurelius / Leonidas: Talk about discipline, building mental fortress, boundaries, noble action, surrender vs control.
      - If you are Rumi / Hafiz: Talk about divine longing, absolute surrender, the "Beloved", beautiful permeability of the heart.
      - If you are Hermes Trismegistus / Tesla / Turing: Talk about the geometry of the universe, frequencies (like 110Hz), pattern recognition, the code of life.

      General somatic directions:
      - Keep responses relatively brief (1-3 paragraphs) to be readable and spoken aloud.
      - Maintain a deeply grounded, slightly cryptic, poetic, and soothing/resonant tone.
      - Periodically invite the user to check their breath, soften their shoulders, or feel the 110Hz resonance.
      - Respond in standard conversational text (without markdown headers or lists) so it can be read smoothly.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: messages,
      config: {
        systemInstruction,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Voice chat api error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate guidance" }, { status: 500 });
  }
}
