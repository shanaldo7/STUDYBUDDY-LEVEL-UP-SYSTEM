import React, { useState } from 'react';
import { Sparkles, Shield, Target, BookOpen, Clock, Zap } from 'lucide-react';
import { HunterUser } from '../types/hunter';
import { soundManager } from '../utils/audio';

interface OnboardingModalProps {
  user: HunterUser;
  onComplete: (updatedFields: Partial<HunterUser>, meta: { goal: string; subject: string; difficulty: string; dailyMinutes: number }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [hunterName, setHunterName] = useState(user.hunterName || 'Awakened Hunter');
  const [studyGoal, setStudyGoal] = useState('Master STEM Theory & Ace Final Gates');
  const [primarySubject, setPrimarySubject] = useState('Computer Science & Math');
  const [difficulty, setDifficulty] = useState<'Normal' | 'Hard' | 'Monarch'>('Normal');
  const [dailyMinutes, setDailyMinutes] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playSfx('levelup');
    onComplete(
      {
        hunterName: hunterName.trim() || 'Awakened Hunter',
        level: 1,
        xp: 0,
        xpNext: 1000,
        hunterRank: 'E',
        hunterClass: 'Shadow Monarch (Novice)',
        currentTitle: 'Awakened Novice'
      },
      {
        goal: studyGoal,
        subject: primarySubject,
        difficulty,
        dailyMinutes
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-cyan-500/40 p-6 sm:p-8 space-y-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] bg-gradient-to-b from-slate-900/95 via-[#080d20]/95 to-slate-950/95">
        
        {/* System Protocol Header */}
        <div className="text-center space-y-2 pb-2 border-b border-cyan-500/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>[SYSTEM PROTOCOL INITIALIZED]</span>
          </div>

          <h2 className="font-monarch font-bold text-2xl sm:text-3xl text-slate-100 tracking-wide">
            Welcome, Hunter.
          </h2>

          <p className="text-xs font-mono-tech text-cyan-300/80">
            Your StudyBuddy journey begins now. Create your Hunter Profile.
          </p>
        </div>

        {/* Initial Stats Display */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono-tech">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Initial State:</span>
          </div>
          <div className="text-cyan-400 font-bold space-x-3">
            <span>Level 1</span>
            <span>•</span>
            <span>0 XP / 1,000</span>
            <span>•</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px]">Rank E (Novice)</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Hunter Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono-tech text-cyan-400 uppercase tracking-wider font-semibold block">
              Hunter Display Name
            </label>
            <input
              type="text"
              required
              value={hunterName}
              onChange={(e) => setHunterName(e.target.value)}
              placeholder="e.g. Sung Jin-Study"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono-tech focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Study Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono-tech text-purple-400 uppercase tracking-wider font-semibold block">
              Prime Study Directive / Goal
            </label>
            <input
              type="text"
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g. Master Calculus & Algorithms"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono-tech focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Primary Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono-tech text-cyan-400 uppercase tracking-wider font-semibold block">
              Primary Academic Discipline
            </label>
            <select
              value={primarySubject}
              onChange={(e) => setPrimarySubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono-tech focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="Computer Science & Math">Computer Science & Discrete Math</option>
              <option value="Calculus & Physics">Calculus, Linear Algebra & Physics</option>
              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
              <option value="Machine Learning & STEM">Machine Learning & Neuroscience</option>
              <option value="General Academics">General Higher Academics</option>
            </select>
          </div>

          {/* Preferred Difficulty & Daily Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono-tech text-slate-300 uppercase block">
                Trial Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Normal' | 'Hard' | 'Monarch')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono-tech focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="Normal">Normal (Standard)</option>
                <option value="Hard">Hard (+25% XP)</option>
                <option value="Monarch">Monarch (+50% XP)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono-tech text-slate-300 uppercase block">
                Daily Focus Target
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono-tech focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value={25}>25 Minutes / Day</option>
                <option value={50}>50 Minutes / Day</option>
                <option value={90}>90 Minutes / Day</option>
                <option value={120}>120 Minutes / Day</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>BEGIN YOUR JOURNEY</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
