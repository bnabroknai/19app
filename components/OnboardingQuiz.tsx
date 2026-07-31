'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archetype, Tier, SpiralState, SPIRAL_STATE_TO_TIER, ARCHETYPES, HISTORY_VOICES } from '@/lib/one-spirit-logic';
import { Send, Sparkles, User, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: { archetype: Archetype; tier: Tier; spiralState: SpiralState; historyVoice: string }) => void;
}

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function OnboardingQuiz({ onComplete }: OnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: [{ text: "Welcome to the Shard Protocol. I am your guide through the 19-day cycle. To begin our alignment, tell me: how does your nervous system feel in this moment? Are you in a state of crisis, feeling stuck in your patterns, or simply curious about the deeper resonance?" }] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedProfile, setSuggestedProfile] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          currentProfile: suggestedProfile 
        }),
      });
      const data = await res.json();
      
      setMessages([...newMessages, { role: 'model', parts: [{ text: data.message }] }]);
      if (data.suggestedProfile) {
        setSuggestedProfile(data.suggestedProfile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const confirmProfile = () => {
    if (!suggestedProfile) return;
    const { spiralState, archetype, historyVoice } = suggestedProfile;
    onComplete({
      spiralState,
      archetype,
      historyVoice: historyVoice || HISTORY_VOICES[archetype as Archetype][0],
      tier: SPIRAL_STATE_TO_TIER[spiralState as SpiralState]
    });
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-2xl mx-auto bg-black/40 rounded-3xl border border-violet-900/30 overflow-hidden backdrop-blur-xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-violet-900/20 bg-violet-950/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet-300">Resonant Guide Active</span>
        </div>
        {suggestedProfile && (
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30"
           >
             <Sparkles className="w-3 h-3 text-violet-400" />
             <span className="text-[10px] font-mono text-violet-200">Profile Detected</span>
           </motion.div>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-violet-600 text-white rounded-tr-none' 
                  : 'bg-violet-950/40 text-cream border border-violet-900/20 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.parts[0].text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-violet-950/40 p-3 rounded-2xl animate-pulse">
               <div className="flex gap-1">
                 <div className="w-1 h-1 bg-violet-400 rounded-full" />
                 <div className="w-1 h-1 bg-violet-400 rounded-full" />
                 <div className="w-1 h-1 bg-violet-400 rounded-full" />
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Profile Confirmation Overlay */}
      {suggestedProfile && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-6 bg-violet-900/40 border-t border-violet-500/30 backdrop-blur-2xl space-y-4"
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-violet-400">State</span>
                <p className="text-sm font-medium text-white">{suggestedProfile.spiralState}</p>
              </div>
              <div className="space-y-1 text-center border-x border-violet-500/20 px-4">
                <span className="text-[10px] uppercase tracking-widest text-violet-400">Archetype</span>
                <p className="text-sm font-medium text-white">{suggestedProfile.archetype}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-violet-400">Voice</span>
                <p className="text-sm font-medium text-white">{suggestedProfile.historyVoice || 'Default'}</p>
              </div>
            </div>
            <button 
              onClick={confirmProfile}
              className="px-6 py-3 bg-white text-black rounded-full text-xs font-bold hover:bg-violet-100 transition-colors shadow-lg active:scale-95"
            >
              Align Shard Protocol
            </button>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      {!suggestedProfile && (
        <div className="border-t border-violet-900/20 bg-black/20 p-6 space-y-4">
          <form onSubmit={handleSend} className="flex gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your inner frequency..."
              className="flex-1 bg-violet-950/20 border border-violet-900/50 rounded-2xl px-4 py-3 text-cream text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white disabled:opacity-50 transition-all active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setSuggestedProfile({ spiralState: 'In Crisis', archetype: 'Warrior', historyVoice: 'Marcus Aurelius' })}
              className="text-xs text-violet-400 hover:text-violet-200 transition-colors"
            >
              Quick Setup: Warrior (Crisis)
            </button>
            <span className="text-violet-900">•</span>
            <button
              type="button"
              onClick={() => setSuggestedProfile({ spiralState: 'Stuck', archetype: 'Witness', historyVoice: 'Vedic Sage' })}
              className="text-xs text-violet-400 hover:text-violet-200 transition-colors"
            >
              Quick Setup: Witness (Stuck)
            </button>
            <span className="text-violet-900">•</span>
            <button
              type="button"
              onClick={() => setSuggestedProfile({ spiralState: 'Curious', archetype: 'Orphan', historyVoice: 'Rumi' })}
              className="text-xs text-violet-400 hover:text-violet-200 transition-colors"
            >
              Quick Setup: Orphan (Curious)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
