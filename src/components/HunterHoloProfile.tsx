import React, { useState } from 'react';
import { HunterUser } from '../types/hunter';
import { DarkSoulsHoloCard } from './threeui/DarkSoulsHoloCard';
import { 
  Flame, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  Zap, 
  Compass, 
  Brain, 
  Coins,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { normalizeHunterName } from '../utils/hunterIdentity';
import { NavTab } from './Navigation';

interface HunterHoloProfileProps {
  user: HunterUser;
  onAllocateStat: (statName: keyof HunterUser['stats']) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenCustomizer?: () => void;
}

export const HunterHoloProfile: React.FC<HunterHoloProfileProps> = ({
  user,
  onAllocateStat,
  onNavigate,
  onOpenCustomizer
}) => {
  const [selectedVariant, setSelectedVariant] = useState<'ashen-one' | 'cindermane'>('ashen-one');
  const [cardFlipped, setCardFlipped] = useState(false);

  const xpPercent = Math.min(100, Math.round((user.xp / user.xpNext) * 100));

  const rankColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    F: { border: 'border-slate-600', bg: 'bg-slate-900/60', text: 'text-slate-400', glow: 'shadow-slate-500/20' },
    E: { border: 'border-slate-500', bg: 'bg-slate-900/60', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
    D: { border: 'border-emerald-500', bg: 'bg-emerald-950/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
    C: { border: 'border-cyan-500', bg: 'bg-cyan-950/40', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
    B: { border: 'border-indigo-500', bg: 'bg-indigo-950/40', text: 'text-indigo-400', glow: 'shadow-indigo-500/30' },
    A: { border: 'border-purple-500', bg: 'bg-purple-950/40', text: 'text-purple-400', glow: 'shadow-purple-500/40' },
    S: { border: 'border-amber-500', bg: 'bg-amber-950/50', text: 'text-amber-400', glow: 'shadow-amber-500/50' }
  };

  const currentRankStyle = rankColors[user.hunterRank] || rankColors.S;

  const statConfig: { key: keyof HunterUser['stats']; label: string; desc: string; icon: string; color: string }[] = [
    { key: 'intelligence', label: 'Intelligence', desc: 'Concept Mastery & Logic', icon: '🧠', color: 'text-cyan-400' },
    { key: 'strength', label: 'Strength', desc: 'Grit & Focus Willpower', icon: '💪', color: 'text-red-400' },
    { key: 'agility', label: 'Agility', desc: 'Problem Solving Speed', icon: '⚡', color: 'text-amber-400' },
    { key: 'vitality', label: 'Vitality', desc: 'Study Endurance & Health', icon: '🛡️', color: 'text-emerald-400' },
    { key: 'sense', label: 'Sense', desc: 'Error Spotting & Intuition', icon: '👁️', color: 'text-purple-400' }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#070b17] via-[#0c1226] to-[#120f26] p-5 sm:p-6 shadow-[0_0_50px_-15px_rgba(6,182,212,0.25)]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Product Banner & Hunter Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-cyan-500/20 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono-tech font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              STUDYBUDDY: LEVEL UP — GAMIFIED STUDY PLANNER
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono-tech text-[10px]">
              THREEUI COMPONENT: THE ASHEN ONE
            </span>
          </div>

          <h2 className="font-monarch font-black text-2xl sm:text-3xl text-slate-50 tracking-wide flex items-center gap-3">
            HOLOGRAPHIC HUNTER PROFILE
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Real-time interactive 3D holographic plate rendered with WebGL foil shaders and drifting embers. Tilt, drag to rotate 360°, flip, or zoom.
          </p>
        </div>

        {/* Variant & Quick Action controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono-tech">
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setSelectedVariant('ashen-one');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedVariant === 'ashen-one'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ashen One
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setSelectedVariant('cindermane');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedVariant === 'cindermane'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cindermane
            </button>
          </div>

          {onOpenCustomizer && (
            <button
              onClick={() => {
                soundManager.playSfx('click');
                onOpenCustomizer();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/40 text-amber-300 text-xs font-monarch font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Customize 3D Card
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 3D Holographic Card Showcase & Surrounding Hunter Stats */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3D Holographic Card in .shader-frame */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <DarkSoulsHoloCard 
            variant={selectedVariant}
            user={user}
            onFlip={(flipped) => setCardFlipped(flipped)}
            onOpenCustomizer={onOpenCustomizer}
          />
        </div>

        {/* Right: Hunter Data Deck & Attribute Matrix */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Row: Rank, Level, Streak, Gold */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Rank Box */}
            <div className={`p-4 rounded-xl border ${currentRankStyle.border} ${currentRankStyle.bg} flex flex-col justify-between shadow-lg ${currentRankStyle.glow}`}>
              <div className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-widest">HUNTER RANK</div>
              <div className={`font-monarch font-extrabold text-3xl sm:text-4xl ${currentRankStyle.text} my-1`}>
                {user.hunterRank}
              </div>
              <div className="text-[10px] font-mono-tech text-slate-400">Class: {user.hunterClass}</div>
            </div>

            {/* Level Box */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/30 flex flex-col justify-between shadow-lg shadow-cyan-950/40">
              <div className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-widest">HUNTER LEVEL</div>
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-cyan-200 my-1">
                LV.{user.level}
              </div>
              <div className="text-[10px] font-mono-tech text-cyan-300/80">Monarch Growth</div>
            </div>

            {/* Streak Box */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/30 flex flex-col justify-between shadow-lg shadow-amber-950/40">
              <div className="text-[10px] font-mono-tech text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> STREAK
              </div>
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-300 my-1">
                {user.streakDays}d
              </div>
              <div className="text-[10px] font-mono-tech text-amber-400/80">Consecutive Days</div>
            </div>

            {/* Gold / Bounty */}
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/30 flex flex-col justify-between shadow-lg shadow-purple-950/40">
              <div className="text-[10px] font-mono-tech text-purple-400 uppercase tracking-widest flex items-center gap-1">
                <Coins className="w-3 h-3 text-purple-400" /> SOULS / GOLD
              </div>
              <div className="font-mono-tech font-bold text-2xl sm:text-3xl text-purple-200 my-1">
                {user.gold.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono-tech text-purple-300/80">Hunter Currency</div>
            </div>
          </div>

          {/* XP Progress Section */}
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">LEVEL PROGRESSION</span>
                <span className="text-slate-400 font-normal">
                  {user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP
                </span>
              </div>
              <span className="font-bold text-cyan-300">{xpPercent}% TO NEXT RANK</span>
            </div>

            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Title: <i className="text-purple-300 font-semibold">{user.currentTitle}</i></span>
              <span>Mana: <b className="text-cyan-300">{user.mana}/{user.maxMana} MP</b></span>
            </div>
          </div>

          {/* Core Attribute Allocation Deck */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono-tech text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                CORE ATTRIBUTES MATRIX
              </div>

              {user.statPoints > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono-tech font-bold animate-pulse">
                  +{user.statPoints} STAT POINTS AVAILABLE
                </span>
              ) : (
                <span className="text-[11px] font-mono-tech text-slate-500">All points allocated</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {statConfig.map(({ key, label, desc, icon, color }) => {
                const val = user.stats[key];
                return (
                  <div 
                    key={key} 
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{desc}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono-tech font-bold text-sm ${color}`}>{val}</span>
                      {user.statPoints > 0 && (
                        <button
                          onClick={() => {
                            soundManager.playSfx('click');
                            onAllocateStat(key);
                          }}
                          className="w-5 h-5 rounded bg-cyan-600/30 hover:bg-cyan-500 border border-cyan-400/50 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title={`Allocate point to ${label}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Access Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400">💡 Tip:</span>
              <span>Double-click card to view the Hunter Codex on the back</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('character')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Full Character & Power <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => onNavigate('progression-web')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 text-cyan-300 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                3D Constellation Web <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
