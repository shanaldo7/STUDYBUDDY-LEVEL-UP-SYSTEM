import React from 'react';
import { HunterUser, DailyQuest, DungeonGate, Syllabus } from '../types/hunter';
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
  Repeat,
  BookOpen,
  Target,
  AlertTriangle,
  Network,
  Zap,
  Coins,
  Shield,
  Award
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ScrollReveal } from './ScrollReveal';
import { getWeakTopics } from '../utils/progressCalculator';
import { normalizeHunterName } from '../utils/hunterIdentity';
import { NavTab } from './Navigation';
import { DarkSoulsHoloCard } from './threeui/DarkSoulsHoloCard';

interface DashboardViewProps {
  user: HunterUser;
  dailyQuests: DailyQuest[];
  gates: DungeonGate[];
  activeSyllabus?: Syllabus | null;
  onClaimQuest: (questId: string) => void;
  onSelectGate: (gate: DungeonGate) => void;
  onNavigate: (tab: NavTab) => void;
  onAllocateStat: (statName: keyof HunterUser['stats']) => void;
  onTriggerLevelUpPreview?: () => void;
  onOpenCardCustomizer?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  dailyQuests,
  gates,
  activeSyllabus,
  onClaimQuest,
  onSelectGate,
  onNavigate,
  onAllocateStat,
  onTriggerLevelUpPreview,
  onOpenCardCustomizer
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

  const weakTopics = getWeakTopics(activeSyllabus || null).slice(0, 3);

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
                {activeSyllabus 
                  ? `Active Syllabus: ${activeSyllabus.program} (${activeSyllabus.semester}) — ${activeSyllabus.progressPercentage || 0}% Mastery. Defeat dungeon sentinels and conquer quizzes to level up.`
                  : 'Configure your course syllabus to construct your personalized hunter learning realm.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('user-guide')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 border border-amber-500/40 font-heading font-bold text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Need Help? 📖
              </button>
              <button
                onClick={() => onNavigate('progression-web')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-950 via-[#0d1c3a] to-purple-950/80 hover:from-cyan-900 hover:to-purple-900 text-cyan-300 border border-cyan-500/40 font-heading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Network className="w-4 h-4 text-cyan-400" />
                Progression Web
              </button>
              <button
                onClick={() => onNavigate('syllabus')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                {activeSyllabus ? 'My Syllabus' : '+ Add Syllabus'}
              </button>
              <button
                onClick={() => onNavigate('dungeon')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 font-heading font-bold text-sm tracking-wider uppercase transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Swords className="w-4 h-4 text-cyan-400" />
                Dungeon Gate
              </button>
              <button
                onClick={() => onNavigate('boss')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-900/80 to-slate-900 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-heading font-bold text-sm tracking-wider uppercase transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Crown className="w-4 h-4 text-purple-400" />
                Boss Trials
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Active Syllabus Highlights Banner */}
      {activeSyllabus && (
        <ScrollReveal threshold={0.05}>
          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-monarch font-bold text-lg shrink-0">
                {activeSyllabus.progressPercentage || 0}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tech text-cyan-400 uppercase tracking-wider">Active Curriculum:</span>
                  <span className="text-sm font-heading font-bold text-white">{activeSyllabus.program} ({activeSyllabus.semester})</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {activeSyllabus.subjects.map(s => `${s.name} (${s.progressPercentage || 0}%)`).join(' · ')}
                </div>
              </div>
            </div>

            {weakTopics.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono-tech">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Weak Target:
                </span>
                <span className="text-slate-300">{weakTopics[0].topicName} ({weakTopics[0].progressPercentage}%)</span>
                <button
                  onClick={() => onNavigate('quizzes')}
                  className="ml-2 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-[11px] cursor-pointer"
                >
                  Drill Now
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* ThreeUI Dark Souls Holographic Card — "The Ashen One" */}
      <ScrollReveal threshold={0.05}>
        <div className="glass-panel rounded-xl p-5 sm:p-6 border border-amber-500/30 bg-gradient-to-br from-[#120d07] via-[#1a120c] to-[#0a0705] shadow-[0_0_40px_-10px_rgba(245,158,11,0.25)] flex flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono-tech font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              THREEUI HOLOGRAPHIC CARD — THE ASHEN ONE
            </div>
            <h2 className="font-monarch font-bold text-2xl text-slate-100">
              HUNTER HOLOGRAPHIC CODENAME: {normalizeHunterName(user.hunterName)}
            </h2>
            <p className="text-xs text-slate-300 font-mono-tech leading-relaxed">
              Equipped with the WebGL interactive 3D holographic shader frame. Experience dual-face flipping, 360° drag rotation, pointer tilt, and dynamic foil reflection.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono-tech text-xs pt-2">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">RANK CLASSIFICATION</span>
                <span className="text-amber-400 font-bold text-base">RANK {user.hunterRank}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">LEVEL & PROGRESS</span>
                <span className="text-cyan-400 font-bold text-base">LV. {user.level} ({Math.min(100, Math.round((user.xp/user.xpNext)*100))}%)</span>
              </div>
            </div>
            {onOpenCardCustomizer && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSfx('click');
                  onOpenCardCustomizer();
                }}
                className="mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Customize Holo Card Studio</span>
              </button>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex justify-center py-2">
            <div className="w-full max-w-xs sm:max-w-sm aspect-[3/4] relative">
              <DarkSoulsHoloCard 
                variant="ashen-one" 
                theme={user.cardTheme || 'ashen-cinder'}
                user={user}
                interactive={true}
                showControls={true}
                onOpenCustomizer={onOpenCardCustomizer}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Hunter Status & Cognitive Attribute Matrix */}
      <ScrollReveal threshold={0.05}>
        <div className="glass-panel rounded-xl p-5 sm:p-6 border border-cyan-500/30 bg-gradient-to-br from-[#070c1a] via-[#0b1329] to-[#120d24] shadow-[0_0_35px_-10px_rgba(6,182,212,0.25)]">
          {/* Header row: Identity, Rank Badge, Level, Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-cyan-500/20 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-xl border flex items-center justify-center font-monarch font-black text-2xl tracking-wider shadow-lg ${
                  user.hunterRank === 'S' ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-amber-500/30' :
                  user.hunterRank === 'A' ? 'border-purple-400 bg-purple-950/60 text-purple-300 shadow-purple-500/30' :
                  user.hunterRank === 'B' ? 'border-indigo-400 bg-indigo-950/60 text-indigo-300 shadow-indigo-500/30' :
                  user.hunterRank === 'C' ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-cyan-500/30' :
                  user.hunterRank === 'D' ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-emerald-500/30' :
                  'border-slate-500 bg-slate-900/60 text-slate-300 shadow-slate-500/20'
                }`}>
                  {user.hunterRank}
                </div>
                <div className="absolute -inset-1 rounded-xl border border-cyan-400/30 anime-pulse-aura pointer-events-none" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-2xl text-slate-100">
                    {normalizeHunterName(user.hunterName)}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono-tech text-xs font-bold">
                    LV.{user.level}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono-tech flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-400 font-semibold">{user.hunterClass}</span>
                  <span>·</span>
                  <span className="italic text-purple-300">{user.currentTitle}</span>
                </div>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-3">
              {user.statPoints > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono-tech text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{user.statPoints} UNASSIGNED STAT POINTS</span>
                </div>
              )}
              <button
                onClick={() => onNavigate('character')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Character Sheet →
              </button>
            </div>
          </div>

          {/* Gauges row: XP Progression & Mana Core */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* XP Progression Bar */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-purple-500/20">
              <div className="flex justify-between items-center text-xs font-mono-tech mb-1.5">
                <span className="text-purple-300 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> LEVEL PROGRESSION
                </span>
                <span className="text-slate-300">
                  {user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP ({Math.min(100, Math.round((user.xp / user.xpNext) * 100))}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-purple-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.round((user.xp / user.xpNext) * 100))}%` }}
                />
              </div>
            </div>

            {/* Mana Core Bar */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
              <div className="flex justify-between items-center text-xs font-mono-tech mb-1.5">
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> MANA CORE CAPACITY
                </span>
                <span className="text-slate-300">
                  {user.mana} / {user.maxMana} MP
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((user.mana / user.maxMana) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 5 Cognitive Attributes Grid with Allocation Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono-tech text-cyan-400 font-bold uppercase tracking-wider">
                CORE ATTRIBUTE MATRIX
              </span>
              <span className="text-[11px] font-mono-tech text-slate-400">
                Click + to assign available stat points
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {statLabels.map((stat) => (
                <div 
                  key={stat.key}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-heading font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{stat.icon}</span>
                        <span>{stat.label}</span>
                      </span>
                      <span className="font-mono-tech font-bold text-base text-cyan-300">
                        {user.stats[stat.key]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      {stat.desc}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      disabled={user.statPoints <= 0}
                      onClick={() => {
                        soundManager.playSfx('levelup');
                        onAllocateStat(stat.key);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono-tech font-bold flex items-center gap-1 transition-all ${
                        user.statPoints > 0
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:scale-105'
                          : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3 h-3" /> Assign +1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals & Summary Strip */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono-tech text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-slate-400 text-[10px] uppercase">Study Minutes</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">{user.totalStudyMinutes.toLocaleString()} MIN</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-slate-400 text-[10px] uppercase">Gates Cleared</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">{user.gatesCleared} RAIDS</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-slate-400 text-[10px] uppercase">Active Streak</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">🔥 {user.streakDays} DAYS</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="text-slate-400 text-[10px] uppercase">Gold Balance</div>
              <div className="text-sm font-bold text-yellow-300 mt-0.5">💰 {user.gold.toLocaleString()} G</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Daily System Mandate Quests */}
      <ScrollReveal threshold={0.1}>
        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
