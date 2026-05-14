'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Archetype, Tier, TIERS, ARCHETYPES } from '@/lib/one-spirit-logic';
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
        setProfile(docSnap.data());
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

  const handleOnboardingComplete = async (selection: { archetype: Archetype; tier: Tier }) => {
    if (!user) return;
    try {
      const newProfile = {
        uid: user.uid,
        ...selection,
        currentDay: 1,
        currentCycle: 1,
        lastDayCompleted: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
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

      // Update User Progress
      await updateDoc(doc(db, 'users', user.uid), {
        currentDay: nextDay,
        currentCycle: nextCycle,
        lastDayCompleted: profile.currentDay,
        lastCompletedAt: serverTimestamp(),
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

      setProfile({ ...profile, currentDay: nextDay, currentCycle: nextCycle, lastDayCompleted: profile.currentDay });
      await fetchJournal(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'journal_entries');
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
              <div className="space-y-8 sticky top-28">
                 <div className="text-center sm:text-left">
                   <h2 className="text-xl font-medium text-cream">{ARCHETYPES[profile.archetype as Archetype].lineage} Path</h2>
                   <p className="text-sm text-slate-400">The {profile.archetype} Integration</p>
                 </div>
                 <SpiralMandala currentDay={profile.currentDay} tier={profile.tier} />
                 <div className="hidden lg:block">
                   <SpectralPulse />
                 </div>
              </div>
              
              <div className="space-y-8">
                <DailyCard 
                  content={getDailyContent(profile.currentDay, profile.tier)} 
                  archetype={profile.archetype}
                  cycle={profile.currentCycle}
                  isCompleted={profile.lastDayCompleted === profile.currentDay}
                  onComplete={handleDayComplete}
                />
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
