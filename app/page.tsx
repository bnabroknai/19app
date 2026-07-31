'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Archetype, Tier, SpiralState, TIERS, ARCHETYPES } from '@/lib/one-spirit-logic';
import { OnboardingQuiz } from '@/components/OnboardingQuiz';
import { SpiralMandala } from '@/components/SpiralMandala';
import { DailyCard } from '@/components/DailyCard';
import { SpectralPulse } from '@/components/SpectralPulse';
import { getDailyContent } from '@/lib/mock-content';
import { LogOut, BookOpen, Download, User as UserIcon, Settings } from 'lucide-react';

export default function OneSpiritApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'journal' | 'onboarding'>('dashboard');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'shard' | 'voice-chat'>('shard');
  const [selectedVoice, setSelectedVoice] = useState<string>('Vedic Sage');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'model', text: 'Seeker of the shard, how can I assist you in integrating your current frequency today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [isPlayingChatIdx, setIsPlayingChatIdx] = useState<number | null>(null);

  const HISTORICAL_GUIDES = [
    { name: 'Vedic Sage', archetype: 'Witness', description: 'Timeless observer of long-term cycles & patient evolution.' },
    { name: 'Lao Tzu', archetype: 'Witness', description: 'Sage of non-action (wu wei) & natural alignment with the Tao.' },
    { name: 'Heraclitus', archetype: 'Witness', description: 'Philosopher of fire, constant change, and the logos.' },
    { name: 'Marcus Aurelius', archetype: 'Warrior', description: 'Stoic emperor of mental fortress, boundaries, and duty.' },
    { name: 'Leonidas', archetype: 'Warrior', description: 'Leader of absolute discipline, boundary integrity, and surrender.' },
    { name: 'Rumi', archetype: 'Orphan', description: 'Mystic of divine longing, absolute surrender, and poetic resonance.' },
    { name: 'Hafiz', archetype: 'Orphan', description: 'Sufi master of wild joy, permeability, and heart expansion.' },
    { name: 'Hermes Trismegistus', archetype: 'Code-See-er', description: 'Founder of Hermetic laws, geometry, and cosmic correspondence.' },
    { name: 'Tesla', archetype: 'Code-See-er', description: 'Visionary of 3-6-9 frequency keys, electricity, and pattern synthesis.' },
    { name: 'Alan Turing', archetype: 'Code-See-er', description: 'Pioneer of the universal code, mathematical patterns, and morphogenic morphs.' }
  ];

  const fetchJournal = async (uid: string) => {
     try {
       const q = query(
         collection(db, 'journal_entries'), 
         where('userId', '==', uid),
         orderBy('createdAt', 'desc')
       );
       const snap = await getDocs(q);
       setJournalEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     } catch (e) {
       console.error("error fetching journal", e);
     }
  };

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Forgiving Streak: Check if they missed a day
        let isMissed = false;
        if (data.lastCompletedAt) {
          const lastCompleted = data.lastCompletedAt.toDate ? data.lastCompletedAt.toDate() : new Date(data.lastCompletedAt);
          const diffHours = (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60);
          if (diffHours > 36) {
            // Missed a day! Streak is paused instead of resetting to 0
            isMissed = true;
          }
        }

        const resolvedProfile = {
          ...data,
          isMissedDay: isMissed,
          streakCount: data.streakCount || 1,
          historyVoice: data.historyVoice || 'Vedic Sage'
        };

        setProfile(resolvedProfile);
        setSelectedVoice(resolvedProfile.historyVoice);
        setView('dashboard');
        await fetchJournal(uid);
      } else {
        setView('onboarding');
      }
    } catch (error) {
       console.error("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u.uid);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleOnboardingComplete = async (selection: { archetype: Archetype; tier: Tier; spiralState: SpiralState; historyVoice: string }) => {
    if (!user) return;
    try {
      const newProfile = {
        uid: user.uid,
        ...selection,
        currentDay: 1,
        currentCycle: 1,
        lastDayCompleted: 0,
        streakCount: 1,
        lastCompletedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile({
        ...newProfile,
        isMissedDay: false
      });
      setSelectedVoice(selection.historyVoice);
      setView('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleDayComplete = async (journalText: string) => {
    if (!user || !profile) return;
    try {
      const nextDay = profile.currentDay === 19 ? 1 : profile.currentDay + 1;
      const nextCycle = profile.currentDay === 19 ? profile.currentCycle + 1 : profile.currentCycle;

      // Forgiving Streak Calculation:
      // If user returned after a gap (isMissedDay), keep the previous count (paused).
      // Otherwise, increment the active streak!
      const currentStreak = profile.streakCount || 1;
      const nextStreak = profile.isMissedDay ? currentStreak : currentStreak + 1;

      // Update User Progress
      await updateDoc(doc(db, 'users', user.uid), {
        currentDay: nextDay,
        currentCycle: nextCycle,
        lastDayCompleted: profile.currentDay,
        lastCompletedAt: serverTimestamp(),
        streakCount: nextStreak,
      });

      // Save Journal Entry
      await setDoc(doc(collection(db, 'journal_entries')), {
        userId: user.uid,
        day: profile.currentDay,
        cycle: profile.currentCycle,
        text: journalText,
        tier: profile.tier,
        createdAt: serverTimestamp(),
      });

      setProfile({ 
        ...profile, 
        currentDay: nextDay, 
        currentCycle: nextCycle, 
        lastDayCompleted: profile.currentDay,
        streakCount: nextStreak,
        isMissedDay: false
      });
      await fetchJournal(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'journal_entries');
    }
  };

  const handleVoiceChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg = { role: 'user', text: chatInput };
    const currentMessages = [...chatMessages, userMsg];
    setChatMessages(currentMessages);
    setChatInput('');
    setIsChatSending(true);

    try {
      const targetGuide = HISTORICAL_GUIDES.find(g => g.name === selectedVoice) || HISTORICAL_GUIDES[0];
      const apiMessages = currentMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/gemini/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          voice: selectedVoice,
          archetype: targetGuide.archetype,
          currentDay: profile.currentDay,
          tier: profile.tier
        })
      });
      const data = await res.json();
      
      if (data.text) {
        const assistantMsg = { role: 'model', text: data.text };
        const updatedChat = [...currentMessages, assistantMsg];
        setChatMessages(updatedChat);

        // Auto play the new message with the 110Hz hum background
        const voiceIndex = updatedChat.length - 1;
        setIsPlayingChatIdx(voiceIndex);
        const { resonantEngine } = await import('@/lib/audio-synthesizer');
        resonantEngine.speakWithHum(data.text, selectedVoice, () => {
          setIsPlayingChatIdx(null);
        });
      }
    } catch (err) {
      console.error("Chat failure:", err);
    } finally {
      setIsChatSending(false);
    }
  };

  const toggleVoicePlayback = async (text: string, idx: number) => {
    const { resonantEngine } = await import('@/lib/audio-synthesizer');
    if (isPlayingChatIdx === idx) {
      resonantEngine.stopAll();
      setIsPlayingChatIdx(null);
    } else {
      resonantEngine.stopAll();
      setIsPlayingChatIdx(idx);
      resonantEngine.speakWithHum(text, selectedVoice, () => {
        setIsPlayingChatIdx(null);
      });
    }
  };

  const handleExportMarkdown = () => {
    let md = "# OneSpirit Somatic Journal\n\n";
    md += "| Date | Day # | Cycle # | Tier | Journal Text |\n";
    md += "| --- | --- | --- | --- | --- |\n";
    journalEntries.forEach(e => {
      const date = e.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 'N/A';
      md += `| ${date} | ${e.day} | ${e.cycle} | ${e.tier} | ${e.text.replace(/\n/g, ' ')} |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onespirit-journal-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div 
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1, 0.95] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-violet-400 font-mono text-sm tracking-widest"
      >
        RESONATING...
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20 bg-[#0a0a14]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-900/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-2xl space-y-12"
      >
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] mb-4">
            Duolingo for the Soul
          </div>
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white font-serif">
            OneSpirit
          </h1>
          <p className="text-xl text-slate-400 font-light max-w-md mx-auto leading-relaxed">
            Transform ancient precessional wisdom into a modern, regulated nervous-system experience.
          </p>
        </div>

        <button 
          onClick={handleLogin}
          className="px-10 py-5 bg-white text-black rounded-full font-medium hover:bg-cream transition-colors shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95"
        >
          Begin the Cycle
        </button>

        <div className="pt-8">
           <SpectralPulse />
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <nav className="p-6 flex justify-between items-center bg-black/5 Backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-serif text-lg">1</div>
           <span className="font-serif text-xl tracking-tight hidden sm:block">OneSpirit</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => setView('dashboard')} className={`text-xs uppercase tracking-widest ${view === 'dashboard' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>Engine</button>
          <button onClick={() => setView('journal')} className={`text-xs uppercase tracking-widest ${view === 'journal' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>Journal</button>
          <button onClick={() => auth.signOut()} className="text-xs uppercase tracking-widest text-slate-500 hover:text-red-400">Exit</button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'onboarding' && (
            <OnboardingQuiz key="onboarding" onComplete={handleOnboardingComplete} />
          )}

          {view === 'dashboard' && profile && (
            <motion.div 
               key="dashboard"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              {/* Left Column: Mandala & Profile Insights */}
              <div className="space-y-8 lg:sticky lg:top-28">
                 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-900/10 pb-4">
                   <div className="text-left">
                     <h2 className="text-xl font-medium text-cream">{ARCHETYPES[profile.archetype as Archetype].lineage} Path</h2>
                     <p className="text-sm text-slate-400">The {profile.archetype} Integration</p>
                   </div>

                   {/* Streak Visualization */}
                   <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-violet-900/30 shadow-inner">
                     {profile.isMissedDay ? (
                       <>
                         <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                         <span className="text-xs font-mono font-bold text-amber-300">
                           ⏸️ {profile.streakCount} Streak Paused
                         </span>
                       </>
                     ) : (
                       <>
                         <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                         <span className="text-xs font-mono font-bold text-emerald-400">
                           🔥 {profile.streakCount} Day Streak
                         </span>
                       </>
                     )}
                   </div>
                 </div>

                 <SpiralMandala currentDay={profile.currentDay} tier={profile.tier} />
                 
                 <div className="hidden lg:block">
                   <SpectralPulse />
                 </div>
              </div>
              
              {/* Right Column: Interactive Content / Voice Chat Tabbed Deck */}
              <div className="space-y-8">
                {/* Elegant Segmented Tabs */}
                <div className="flex p-1.5 bg-black/40 border border-violet-900/30 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('shard')}
                    className={`flex-1 py-3 text-xs uppercase tracking-widest font-mono font-bold rounded-xl transition-all ${
                      activeTab === 'shard'
                        ? 'bg-violet-600/30 text-white border border-violet-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Today&apos;s Shard
                  </button>
                  <button
                    onClick={() => setActiveTab('voice-chat')}
                    className={`flex-1 py-3 text-xs uppercase tracking-widest font-mono font-bold rounded-xl transition-all ${
                      activeTab === 'voice-chat'
                        ? 'bg-violet-600/30 text-white border border-violet-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Resonant Voice Chat
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'shard' ? (
                    <motion.div
                      key="shard-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <DailyCard 
                        content={getDailyContent(profile.currentDay, profile.tier)} 
                        archetype={profile.archetype}
                        cycle={profile.currentCycle}
                        isCompleted={profile.lastDayCompleted === profile.currentDay}
                        onComplete={handleDayComplete}
                        historyVoice={selectedVoice}
                        isMissedDay={profile.isMissedDay}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="voice-chat-tab"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      {/* Persona Selection Dropdown / Selector Card */}
                      <div className="bg-black/40 border border-violet-900/30 p-6 rounded-3xl space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase font-mono tracking-widest text-violet-400 font-bold">Choose Historical Guide Persona</label>
                          <select
                            value={selectedVoice}
                            onChange={(e) => {
                              setSelectedVoice(e.target.value);
                              setChatMessages([
                                { role: 'model', text: `I am ${e.target.value}. Ground your breath and state your inquiry.` }
                              ]);
                            }}
                            className="w-full bg-violet-950/20 border border-violet-900/50 rounded-xl px-4 py-3 text-cream text-sm focus:outline-none focus:border-violet-500/50"
                          >
                            {HISTORICAL_GUIDES.map((g) => (
                              <option key={g.name} value={g.name} className="bg-black text-white">
                                {g.name} ({g.archetype})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Selected Persona Bio Card */}
                        {(() => {
                          const guide = HISTORICAL_GUIDES.find(g => g.name === selectedVoice);
                          return guide ? (
                            <div className="p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl text-left space-y-1">
                              <span className="text-[10px] uppercase tracking-wider font-mono text-violet-400 font-bold">Lineage Focus: {guide.archetype}</span>
                              <p className="text-xs text-slate-400 leading-relaxed">{guide.description}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Conversational Screen */}
                      <div className="h-[45vh] bg-black/40 border border-violet-900/20 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
                        {/* Messages Log */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-4">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                msg.role === 'user'
                                  ? 'bg-violet-600 text-white rounded-tr-none'
                                  : 'bg-violet-950/40 text-cream border border-violet-900/20 rounded-tl-none'
                              }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                              
                              {msg.role === 'model' && (
                                <button
                                  onClick={() => toggleVoicePlayback(msg.text, idx)}
                                  className={`mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase transition-all ${
                                    isPlayingChatIdx === idx
                                      ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                                      : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                                  }`}
                                >
                                  {isPlayingChatIdx === idx ? '⏸️ Stop hum' : '🔊 Listen with 110Hz'}
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {isChatSending && (
                            <div className="flex justify-start">
                              <div className="bg-violet-950/40 p-3 rounded-2xl animate-pulse flex gap-1">
                                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Speech Input Box */}
                        <form onSubmit={handleVoiceChatSend} className="flex gap-2 pt-4 border-t border-violet-900/10">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={`Inquire of ${selectedVoice}...`}
                            disabled={isChatSending}
                            className="flex-1 bg-violet-950/20 border border-violet-900/50 rounded-2xl px-4 py-3 text-cream text-sm focus:outline-none focus:border-violet-500/50"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim() || isChatSending}
                            className="px-5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs uppercase font-mono tracking-wider font-bold transition-all disabled:opacity-50"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {view === 'journal' && (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pt-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-serif text-white">Your Shard History</h2>
                  <p className="text-sm text-slate-400">Spiritual data sovereignty across cycles</p>
                </div>
                <button 
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-600/30"
                >
                  <Download className="w-4 h-4" />
                  Markdown Export
                </button>
              </div>

              <div className="grid gap-6">
                {journalEntries.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 italic border border-dashed border-slate-800 rounded-3xl">
                    No shards recorded yet. Begin your cycle to anchor your progress.
                  </div>
                ) : (
                  journalEntries.map((e, idx) => (
                    <div key={idx} className="bg-black/30 border border-violet-900/20 p-6 rounded-3xl group">
                       <div className="flex justify-between text-[10px] font-mono text-violet-500 uppercase tracking-widest mb-4">
                         <span>Cycle {e.cycle} • Day {e.day}</span>
                         <span>{e.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                       </div>
                       <p className="text-cream leading-relaxed">{e.text}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating presence for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
         <SpectralPulse />
      </div>
    </div>
  );
}
