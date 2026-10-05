import React from 'react';
import { HunterUser, DailyQuest, DungeonGate } from '../types/hunter';
import { 
  Swords, 
  Crown, 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Plus,
  Flame,
  Brain,
  Repeat
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ScrollReveal } from './ScrollReveal';

interface DashboardViewProps {
  user: HunterUser;
  dailyQuests: DailyQuest[];
  gates: DungeonGate[];
  onClaimQuest: (questId: string) => void;
  onSelectGate: (gate: DungeonGate) => void;
  onNavigate: (tab: 'dungeon' | 'boss' | 'focus' | 'character' | 'revision') => void;
  onAllocateStat: (statName: keyof HunterUser['stats']) => void;
  onTriggerLevelUpPreview?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  dailyQuests,
  gates,
  onClaimQuest,
  onSelectGate,
  onNavigate,
  onAllocateStat,
  onTriggerLevelUpPreview
}) => {
  const questIcons: Record<string, React.ElementType> = {
    Brain: Brain,
    Swords: Swords,
    Repeat: Repeat,
    Crown: Crown
  };

  const statLabels: { key: keyof HunterUser['stats']; label: string; desc: string; icon: string }[] = [
    { key: 'intelligence', label: 'Intelligence', desc: 'Concept Mastery & Logic', icon: '🧠' },
    { key: 'strength', label: 'Strength', desc: 'Grit & Willpower', icon: '💪' },
    { key: 'agility', label: 'Agility', desc: 'Speed & Quick Solving', icon: '⚡' },
    { key: 'vitality', label: 'Vitality', desc: 'Study Endurance & Health', icon: '🛡️' },
    { key: 'sense', label: 'Sense', desc: 'Intuition & Error Spotting', icon: '👁️' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* System Awakening Banner / Directive */}
      <ScrollReveal threshold={0.05}>
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#091024] via-[#0e172e] to-[#15102a] p-5 sm:p-6 shadow-[0_0_30px_-10px_rgba(6,182,212,0.25)]">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-24 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech font-bold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                SYSTEM PROTOCOL: MONARCH AWAKENING
              </div>
              <h1 className="font-monarch font-black text-2xl sm:text-3xl text-slate-50 tracking-wide">
                HUNTER COMMAND DECK
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl mt-1">
                Active Gates detected across your syllabus. Sharpen cognitive faculties, defeat dungeon sentinels with exact recall, and extract shadow soldiers to augment your intellect.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('dungeon')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Swords className="w-4 h-4" />
                Enter Dungeon Gate
              </button>
              <button
                onClick={() => onNavigate('boss')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-900/80 to-slate-900 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-heading font-bold text-sm tracking-wider uppercase transition-all hover:scale-[1.02]"
              >
                <Crown className="w-4 h-4 text-purple-400" />
                Boss Trials
              </button>
              {onTriggerLevelUpPreview && (
                <button
                  onClick={onTriggerLevelUpPreview}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-heading font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
                  title="Preview High-Impact Level Up Particle Animation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  Preview Level Up FX
                </button>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Grid: Stats Overview & Quick Hunter Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hunter License & Attribute Matrix */}
        <ScrollReveal threshold={0.1} staggerIndex={0} className="lg:col-span-1">
          <div className="h-full glass-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">HUNTER LICENSE</span>
                <h3 className="font-heading font-bold text-xl text-slate-100">{user.hunterName}</h3>
                <span className="text-xs text-slate-400">{user.hunterClass}</span>
              </div>
              <div className="text-right">
                <span className="font-monarch font-extrabold text-2xl text-amber-400">
                  {user.hunterRank}
                </span>
                <div className="text-[10px] font-mono-tech text-slate-400">RANK</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono-tech text-slate-400">
                <span>CORE ATTRIBUTES</span>
                {user.statPoints > 0 ? (
                  <span className="text-amber-300 font-bold animate-pulse">
                    +{user.statPoints} STAT POINTS AVAILABLE
                  </span>
                ) : (
                  <span>POINTS ALLOCATED</span>
                )}
              </div>

              {statLabels.map(({ key, label, desc, icon }) => {
                const val = user.stats[key];
                return (
                  <div key={key} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{label}</div>
                        <div className="text-[10px] text-slate-500">{desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech font-bold text-sm text-cyan-300">{val}</span>
                      {user.statPoints > 0 && (
                        <button
                          onClick={() => {
                            soundManager.playSfx('click');
                            onAllocateStat(key);
                          }}
                          className="w-5 h-5 rounded bg-cyan-600/30 hover:bg-cyan-500 border border-cyan-400/50 text-white flex items-center justify-center text-xs transition-colors"
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

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Title: <i className="text-purple-300">{user.currentTitle}</i></span>
            <button 
              onClick={() => onNavigate('character')} 
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono-tech text-[11px]"
            >
              Full Profile <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          </div>
        </ScrollReveal>

        {/* Daily Quests List */}
        <ScrollReveal threshold={0.1} staggerIndex={1} className="lg:col-span-2">
          <div className="h-full glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[11px] font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">DAILY SYSTEM MANDATE</span>
              <h3 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
                DAILY HUNTER QUESTS
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono-tech">
                  PENALTY TIMER: 10:42:15
                </span>
              </h3>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400">Failure triggers</span>
              <div className="text-xs text-red-400 font-mono-tech">PENALTY SURVIVAL ZONE</div>
            </div>
          </div>

          <div className="space-y-3">
            {dailyQuests.map((quest) => {
              const Icon = questIcons[quest.icon] || Sparkles;
              const isReadyToClaim = quest.completed && !quest.claimed;
              const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

              return (
                <div 
                  key={quest.id}
                  className={`
                    p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3
                    ${quest.claimed 
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                      : isReadyToClaim 
                        ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' 
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isReadyToClaim ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-slate-100">{quest.title}</h4>
                        {quest.claimed && (
                          <span className="text-[10px] text-emerald-400 font-mono-tech flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> CLAIMED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>
                      
                      {/* Quest progress gauge */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isReadyToClaim ? 'bg-emerald-400' : 'bg-cyan-500'}`} 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono-tech text-slate-400">
                          {quest.current} / {quest.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right text-xs font-mono-tech">
                      <div className="text-purple-300 font-semibold">+{quest.rewardXp} XP</div>
                      <div className="text-amber-300">+{quest.rewardPoints} Stat Pt</div>
                    </div>

                    {quest.claimed ? (
                      <button disabled className="px-3 py-1.5 rounded bg-slate-800/50 text-slate-500 text-xs font-semibold cursor-not-allowed">
                        Completed
                      </button>
                    ) : isReadyToClaim ? (
                      <button
                        onClick={() => {
                          soundManager.playSfx('victory');
                          onClaimQuest(quest.id);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-heading uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all hover:scale-105"
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('dungeon')}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        In Progress
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Active Dungeon Gates Section */}
      <ScrollReveal threshold={0.1}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">DIMENSIONAL INTRUSION</span>
            <h2 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
              ACTIVE DUNGEON GATES
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('dungeon')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono-tech"
          >
            View All Gates <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gates.slice(0, 3).map((gate, gIdx) => {
            const rankBadgeColors: Record<string, string> = {
              E: 'text-slate-400 border-slate-600 bg-slate-800/40',
              D: 'text-emerald-400 border-emerald-600 bg-emerald-950/40',
              C: 'text-cyan-400 border-cyan-500 bg-cyan-950/40',
              B: 'text-indigo-400 border-indigo-500 bg-indigo-950/40',
              A: 'text-purple-400 border-purple-500 bg-purple-950/40',
              S: 'text-amber-400 border-amber-500 bg-amber-950/50'
            };

            return (
              <ScrollReveal key={gate.id} staggerIndex={gIdx} threshold={0.1}>
                <div 
                  className="glass-panel-interactive rounded-xl p-5 flex flex-col justify-between group cursor-pointer h-full"
                  onClick={() => onSelectGate(gate)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded border text-xs font-monarch font-bold ${rankBadgeColors[gate.rank]}`}>
                        GATE RANK {gate.rank}
                      </span>
                      <span className="text-xs font-mono-tech text-slate-400">
                        HP: {gate.monsterHp.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {gate.name}
                    </h3>
                    <div className="text-xs text-cyan-400/90 font-mono-tech mt-0.5">{gate.subject}</div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{gate.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs font-mono-tech text-slate-400">
                      <span className="text-purple-300 font-semibold">+{gate.rewardXp} XP</span>
                      <span className="mx-1.5">·</span>
                      <span className="text-amber-300">+{gate.rewardGold} G</span>
                    </div>
                    <span className="text-xs font-heading font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase">
                      Enter Raid <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Quick Access Grid: Revision Lab, Focus Sanctuary, Guild Raids */}
      <ScrollReveal threshold={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <ScrollReveal staggerIndex={0}>
            <div 
              onClick={() => onNavigate('revision')}
              className="glass-panel-interactive rounded-xl p-4 flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-slate-100 group-hover:text-indigo-300">Revision Lab</div>
                <div className="text-xs text-slate-400">Spaced Repetition active recall flashcards</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerIndex={1}>
            <div 
              onClick={() => onNavigate('focus')}
              className="glass-panel-interactive rounded-xl p-4 flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-slate-100 group-hover:text-cyan-300">Focus Sanctuary</div>
                <div className="text-xs text-slate-400">Pomodoro timer with ambient dungeon audio</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerIndex={2}>
            <div 
              onClick={() => onNavigate('boss')}
              className="glass-panel-interactive rounded-xl p-4 flex items-center gap-3 cursor-pointer group border-purple-500/30"
            >
              <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-slate-100 group-hover:text-purple-300">Monarch Trials</div>
                <div className="text-xs text-slate-400">Raid S-Rank Bosses & Extract Shadow Soldiers</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </ScrollReveal>
    </div>
  );
};
