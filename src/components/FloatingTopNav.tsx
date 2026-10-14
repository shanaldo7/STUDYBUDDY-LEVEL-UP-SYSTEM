import React from 'react';
import { HunterUser } from '../types/hunter';
import { NavTab } from './Navigation';
import { 
  Volume2, 
  VolumeX, 
  Flame, 
  Zap, 
  Sparkles, 
  Command, 
  Palette, 
  LogOut, 
  HelpCircle,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { normalizeHunterName } from '../utils/hunterIdentity';

interface FloatingTopNavProps {
  user: HunterUser;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCommandDeck: () => void;
  onOpenCardCustomizer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onLogout?: () => void;
  unclaimedQuestsCount: number;
}

export const FloatingTopNav: React.FC<FloatingTopNavProps> = ({
  user,
  currentTab,
  onSelectTab,
  onOpenCommandDeck,
  onOpenCardCustomizer,
  isMuted,
  onToggleMute,
  onLogout,
  unclaimedQuestsCount
}) => {
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpNext) * 100));
  const manaPercent = Math.min(100, Math.round((user.mana / user.maxMana) * 100));

  const rankColors: Record<string, { text: string; bg: string; border: string }> = {
    E: { text: 'text-slate-400', bg: 'bg-slate-800/80', border: 'border-slate-600' },
    D: { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-600' },
    C: { text: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500' },
    B: { text: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-500' },
    A: { text: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500' },
    S: { text: 'text-amber-300', bg: 'bg-amber-950/70', border: 'border-amber-400' }
  };

  const rankStyle = rankColors[user.hunterRank] || rankColors.E;

  return (
    <header className="sticky top-2 z-40 px-3 sm:px-6 w-full max-w-7xl mx-auto transition-all">
      <div className="relative rounded-2xl bg-[#070b16]/85 backdrop-blur-xl border border-cyan-500/25 shadow-[0_10px_35px_rgba(0,0,0,0.7)] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Subtle neon glow accents */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
        <div className="absolute -inset-0.5 rounded-2xl border border-cyan-500/10 pointer-events-none" />

        {/* Left: Brand & Hunter Identity Pill */}
        <div className="flex items-center gap-3">
          {/* Logo brand */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onSelectTab('dashboard');
            }}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">⚔️</span>
            <div>
              <div className="font-monarch font-black text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all">
                STUDYBUDDY: LEVEL UP
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono-tech tracking-wider text-cyan-400/80 -mt-0.5 hidden xs:block">
                gamified study planner
              </div>
            </div>
          </button>

          {/* Hunter Rank & Level Badge */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onSelectTab('character');
            }}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-monarch font-black ${rankStyle.text} ${rankStyle.bg} border ${rankStyle.border}`}>
              {user.hunterRank}-RANK
            </span>
            <span className="text-xs font-mono-tech font-bold text-slate-200 group-hover:text-cyan-300">
              LV.{user.level}
            </span>
            <span className="text-[11px] font-heading text-slate-400 truncate max-w-[100px]">
              {normalizeHunterName(user.hunterName)}
            </span>
          </button>
        </div>

        {/* Center: Live Gauges (XP & Mana) - Visible on medium+ screens */}
        <div className="flex-1 max-w-sm hidden md:flex flex-col gap-1">
          {/* XP Gauge */}
          <div>
            <div className="flex justify-between text-[10px] font-mono-tech text-slate-400 mb-0.5">
              <span className="text-purple-300 font-semibold">XP PROGRESS</span>
              <span>{user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} ({xpPercent}%)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-purple-500/30">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 ease-out" 
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Core */}
          <div>
            <div className="flex justify-between text-[10px] font-mono-tech text-slate-400 mb-0.5">
              <span className="text-cyan-300 font-semibold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" /> MANA CORE
              </span>
              <span>{user.mana} / {user.maxMana} MP</span>
            </div>
            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-300" 
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Actions: Command Deck, Holo Card, Streaks, Audio, User Guide */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Streak Counter */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-950/40 border border-orange-500/30 text-amber-300 text-xs font-mono-tech font-bold" title="Daily Hunter Streak">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>{user.streakDays}d</span>
          </div>

          {/* Command Deck Trigger (Cmd+K) */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onOpenCommandDeck();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
            title="Open Hunter Grimoire & Command Deck (⌘K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grimoire</span>
            <kbd className="hidden lg:inline text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-400">⌘K</kbd>
          </button>

          {/* 3D Holo Card Customizer */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onOpenCardCustomizer();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-mono-tech font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]"
            title="Customize 3D Holographic Card"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Card 3D</span>
          </button>

          {/* Unclaimed Quests indicator */}
          {unclaimedQuestsCount > 0 && (
            <button
              onClick={() => {
                soundManager.playSfx('click');
                onSelectTab('dashboard');
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono-tech animate-pulse cursor-pointer"
              title={`${unclaimedQuestsCount} Unclaimed Quests available`}
            >
              <Bell className="w-3 h-3" />
              <span>{unclaimedQuestsCount}</span>
            </button>
          )}

          {/* User Guide Shortcut */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onSelectTab('user-guide');
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              currentTab === 'user-guide'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="System User Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              soundManager.playSfx('click');
            }}
            className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Sound SFX Muted' : 'Sound SFX Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                soundManager.playSfx('click');
                onLogout();
              }}
              className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
