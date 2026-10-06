import React from 'react';
import { Sparkles, Trophy, Flame, Shield, ArrowRight } from 'lucide-react';
import { HunterUser } from '../types/hunter';
import { soundManager } from '../utils/audio';
import { normalizeHunterName } from '../utils/hunterIdentity';

interface WelcomeBackModalProps {
  user: HunterUser;
  onContinue: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ user, onContinue }) => {
  const handleProceed = () => {
    soundManager.playSfx('levelup');
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-cyan-500/40 p-6 sm:p-7 space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] bg-gradient-to-b from-slate-900/95 via-[#080e25]/95 to-slate-950/95 text-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>PROGRESS RESTORED</span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="font-monarch font-black text-2xl sm:text-3xl text-slate-100 tracking-wider">
            WELCOME BACK, HUNTER
          </h2>
          <p className="text-xs font-mono-tech text-cyan-300">
            {normalizeHunterName(user.hunterName)} • {user.currentTitle}
          </p>
        </div>

        {/* Stats Showcase */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left font-mono-tech">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase">Hunter Level</span>
            <div className="text-xl font-bold text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>LV.{user.level}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase">Total Hunter XP</span>
            <div className="text-xl font-bold text-purple-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-purple-400" />
              <span>{user.xp.toLocaleString()} XP</span>
            </div>
          </div>

          <div className="space-y-0.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Rank Classification</span>
            <div className="text-sm font-bold text-slate-200">
              Rank {user.hunterRank}
            </div>
          </div>

          <div className="space-y-0.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Daily Streak</span>
            <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>{user.streakDays} Days</span>
            </div>
          </div>
        </div>

        {/* Continue Action */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>CONTINUE JOURNEY</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
