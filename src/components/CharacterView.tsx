import React, { useState } from 'react';
import { HunterUser } from '../types/hunter';
import { 
  UserCheck, 
  Shield, 
  Zap, 
  Crown, 
  Award, 
  Plus, 
  RotateCcw, 
  Sparkles,
  Swords,
  Layers,
  Heart
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CharacterViewProps {
  user: HunterUser;
  onAllocateStat: (statName: keyof HunterUser['stats']) => void;
  onSetTitle: (title: string) => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
  user,
  onAllocateStat,
  onSetTitle
}) => {
  const titles = [
    { title: 'Monarch of Knowledge', bonus: '+15% Concept Mastery & Intelligence' },
    { title: 'The Awakened', bonus: '+10% Base Mana & Health' },
    { title: 'Demon Hunter', bonus: '+20% Damage vs High-Complexity Algorithms' },
    { title: 'Double Dungeon Survivor', bonus: 'Immunity to Streak Decay for 48h' }
  ];

  const artifacts = [
    { slot: 'Weapon', name: 'Dagger of the Shadow Monarch', perk: '+25% Damage in Dungeon Gates', icon: Swords },
    { slot: 'Armor', name: 'Void Sovereign Cloak', perk: '-30% Cognitive Fatigue during Pomodoro', icon: Shield },
    { slot: 'Accessory', name: 'Ring of Absolute Focus', perk: '+40 Max Mana Pool', icon: Sparkles },
    { slot: 'Relic', name: 'Orb of the System Architect', perk: 'Reveals 1 wrong option in Boss Raids', icon: Crown }
  ];

  const statMeta: { key: keyof HunterUser['stats']; label: string; desc: string; icon: string }[] = [
    { key: 'strength', label: 'Strength', desc: 'Willpower, Grit, and resistance to burnout', icon: '💪' },
    { key: 'agility', label: 'Agility', desc: 'Mental processing speed and quick calculation', icon: '⚡' },
    { key: 'intelligence', label: 'Intelligence', desc: 'Deep theoretical abstraction and concept mastery', icon: '🧠' },
    { key: 'vitality', label: 'Vitality', desc: 'Study endurance and mental stamina reservoir', icon: '🛡️' },
    { key: 'sense', label: 'Sense', desc: 'Pattern intuition, anomaly detection, and error spotting', icon: '👁️' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            HUNTER ATTRIBUTE SYSTEM
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            CHARACTER SHEET & POWER MATRIX
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-amber-950/40 border border-amber-500/40 font-mono-tech text-xs text-amber-300">
            Unassigned Stat Points: <b className="text-base text-amber-200">{user.statPoints}</b>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hunter Identity Card */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-6 border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="text-center pb-6 border-b border-slate-800">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-0.5 mx-auto mb-4 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#090d1a] rounded-2xl flex items-center justify-center font-monarch font-extrabold text-3xl text-cyan-300">
                  {user.hunterRank}
                </div>
              </div>
              <h2 className="font-heading font-black text-2xl text-slate-100">{user.hunterName}</h2>
              <div className="text-xs text-cyan-400 font-mono-tech mt-0.5">{user.hunterClass}</div>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold">
                Title: {user.currentTitle}
              </div>
            </div>

            <div className="mt-6 space-y-3 font-mono-tech text-xs">
              <div className="flex justify-between text-slate-400">
                <span>HUNTER RANK:</span>
                <span className="text-amber-400 font-bold">RANK {user.hunterRank}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HUNTER LEVEL:</span>
                <span className="text-cyan-400 font-bold">LV. {user.level}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MAX HEALTH:</span>
                <span className="text-emerald-400 font-bold">1,000 HP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MANA CORE:</span>
                <span className="text-cyan-300 font-bold">{user.mana} / {user.maxMana} MP</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>STUDY MINUTES:</span>
                <span className="text-purple-300 font-bold">{user.totalStudyMinutes.toLocaleString()} MIN</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GATES CLEARED:</span>
                <span className="text-slate-200 font-bold">{user.gatesCleared} RAIDS</span>
              </div>
            </div>
          </div>

          {/* Title Selector */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <label className="text-xs font-mono-tech text-slate-400 block mb-2">EQUIP ACTIVE TITLE</label>
            <select
              value={user.currentTitle}
              onChange={(e) => {
                soundManager.playSfx('click');
                onSetTitle(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono-tech"
            >
              {titles.map((t) => (
                <option key={t.title} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Core Attributes Allocation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">ATTRIBUTES</span>
                <h3 className="font-heading font-bold text-xl text-slate-100">
                  STAT ALLOCATION PROTOCOL
                </h3>
              </div>
              {user.statPoints > 0 && (
                <span className="text-xs font-mono-tech text-amber-300 font-bold animate-pulse">
                  +{user.statPoints} UNSPENT POINTS
                </span>
              )}
            </div>

            <div className="space-y-4">
              {statMeta.map(({ key, label, desc, icon }) => {
                const val = user.stats[key];
                return (
                  <div 
                    key={key}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="font-heading font-bold text-base text-slate-100">{label}</div>
                        <div className="text-xs text-slate-400">{desc}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono-tech font-bold text-xl text-cyan-300 min-w-10 text-right">
                        {val}
                      </span>
                      <button
                        disabled={user.statPoints <= 0}
                        onClick={() => {
                          soundManager.playSfx('click');
                          onAllocateStat(key);
                        }}
                        className={`
                          flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-heading uppercase transition-all
                          ${user.statPoints > 0 
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                        `}
                      >
                        <Plus className="w-3.5 h-3.5" /> Allocate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipped Artifacts Roster */}
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/20">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <span className="text-[11px] font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">LOADOUT</span>
              <h3 className="font-heading font-bold text-xl text-slate-100">
                EQUIPPED HUNTER ARTIFACTS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {artifacts.map((art) => {
                const Icon = art.icon;
                return (
                  <div key={art.slot} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono-tech text-slate-500 uppercase">{art.slot}</span>
                      <div className="font-heading font-bold text-sm text-slate-100">{art.name}</div>
                      <div className="text-xs text-purple-300 mt-0.5">{art.perk}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
