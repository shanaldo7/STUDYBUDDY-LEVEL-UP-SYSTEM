import React from 'react';
import { HunterUser } from '../types/hunter';
import { Volume2, VolumeX, Flame, Zap, Coins } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  user: HunterUser;
  onOpenCharacterSheet: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenCharacterSheet, isMuted, onToggleMute }) => {
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpNext) * 100));
  const manaPercent = Math.min(100, Math.round((user.mana / user.maxMana) * 100));

  const rankColors: Record<string, { text: string; bg: string; border: string }> = {
    E: { text: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-600' },
    D: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-600' },
    C: { text: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500' },
    B: { text: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-500' },
    A: { text: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500' },
    S: { text: 'text-amber-300', bg: 'bg-amber-950/50', border: 'border-amber-400' }
  };

  const rankStyle = rankColors[user.hunterRank] || rankColors.E;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-cyan-500/20 bg-[#05070f]/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Hunter Identity & Rank Badge */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenCharacterSheet}>
          <div className="relative">
            <div className={`px-2.5 py-1 rounded border font-monarch font-black text-sm tracking-wider shadow-sm transition-all group-hover:scale-105 relative z-10 ${rankStyle.text} ${rankStyle.bg} ${rankStyle.border}`}>
              RANK {user.hunterRank}
            </div>
            {/* Subtle pulse / energy ring effect */}
            <div className="absolute -inset-0.5 rounded border border-cyan-400/40 anime-pulse-aura pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base sm:text-lg text-slate-100 group-hover:text-cyan-400 transition-colors">
                {user.hunterName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono-tech font-semibold">
                LV.{user.level}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{user.hunterClass}</span>
              <span className="text-slate-600">·</span>
              <span className="italic text-purple-300/90">{user.currentTitle}</span>
            </div>
          </div>
        </div>

        {/* Middle: Gauges (XP & Mana) */}
        <div className="flex-1 max-w-md hidden md:flex flex-col gap-1.5">
          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono-tech text-slate-400 mb-0.5">
              <span className="text-purple-300">XP PROGRESSION</span>
              <span>{user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} ({xpPercent}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-purple-500/30">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 ease-out" 
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono-tech text-slate-400 mb-0.5">
              <span className="text-cyan-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> MANA CORE
              </span>
              <span>{user.mana} / {user.maxMana} MP</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-300" 
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Currency, Streaks, Stat Alert, Sound Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Unspent Stat Points Alert */}
          {user.statPoints > 0 && (
            <button
              onClick={onOpenCharacterSheet}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse hover:bg-amber-500/25 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>+{user.statPoints} PTS</span>
            </button>
          )}

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-950/30 border border-orange-500/30 text-orange-300 text-xs font-semibold" title="Daily Hunter Streak">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>{user.streakDays}d</span>
          </div>

          {/* Gold */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-yellow-500/30 text-yellow-300 text-xs font-semibold font-mono-tech">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{user.gold.toLocaleString()} G</span>
          </div>

          {/* Audio Synthesizer Mute Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              soundManager.playSfx('click');
            }}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
