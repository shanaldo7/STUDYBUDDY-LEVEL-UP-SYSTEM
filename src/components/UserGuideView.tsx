import React, { useState } from 'react';
import { 
  BookOpen, 
  Swords, 
  Crown, 
  Target, 
  UserCheck, 
  Timer, 
  FlaskConical, 
  Network, 
  HelpCircle, 
  Zap, 
  Award, 
  RotateCcw, 
  Sparkles, 
  Ghost, 
  Calendar, 
  Bot, 
  Settings, 
  ChevronRight,
  Lightbulb,
  GraduationCap,
  Check,
  ShieldAlert,
  GitFork
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ScrollReveal } from './ScrollReveal';
import { NavTab } from './Navigation';

interface UserGuideViewProps {
  onNavigate: (tab: NavTab) => void;
}

type GuideSection = 
  | 'quickstart'
  | 'core-flow'
  | 'syllabus'
  | 'combat'
  | 'attributes'
  | 'revision-focus'
  | 'ai-guide'
  | 'social-progression'
  | 'account-reset';

export const UserGuideView: React.FC<UserGuideViewProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('quickstart');

  const handleSectionChange = (section: GuideSection) => {
    soundManager.playSfx('click');
    setActiveSection(section);
  };

  const navSections: { id: GuideSection; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'quickstart', label: '1. Welcome & Quick Start', icon: Sparkles, badge: 'Start Here' },
    { id: 'core-flow', label: '2. The 5-Step RPG Flow', icon: GraduationCap },
    { id: 'syllabus', label: '3. Syllabus & Progression Web', icon: BookOpen },
    { id: 'combat', label: '4. Dungeons & Boss Trials', icon: Swords },
    { id: 'attributes', label: '5. Hunter Stats & Power', icon: UserCheck },
    { id: 'revision-focus', label: '6. Revision Lab & Focus', icon: Timer },
    { id: 'ai-guide', label: '7. Hunter AI System Guide', icon: Bot },
    { id: 'social-progression', label: '8. Guilds, Skills & Army', icon: Ghost },
    { id: 'account-reset', label: '9. Sync & Account Reset', icon: RotateCcw }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <ScrollReveal threshold={0.05}>
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#070d1e] via-[#0d162d] to-[#120f28] p-6 shadow-[0_0_30px_-10px_rgba(6,182,212,0.25)]">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-32 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech font-bold uppercase tracking-wider mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                SYSTEM OPERATIONAL MANUAL
              </div>
              <h1 className="font-monarch font-black text-2xl sm:text-3xl text-slate-50 tracking-wide">
                📖 SYSTEM USER GUIDE
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl mt-1">
                Welcome Hunter! This guide details how StudyBuddy transforms your active academic learning into an immersive RPG progression system.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Return to Command Deck
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Grid: Sidebar Navigation + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#090d1a] border border-cyan-500/20 rounded-xl p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono-tech uppercase tracking-wider text-slate-400 font-bold border-b border-cyan-500/10 mb-1">
              Manual Table of Contents
            </div>
            {navSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSectionChange(sec.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all group cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-cyan-950/90 to-indigo-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                    <span className="font-heading tracking-wide">{sec.label}</span>
                  </div>
                  {sec.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-tech bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Help Box */}
          <div className="bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/20 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold font-heading">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Pro Tip for New Hunters
            </div>
            <p className="text-slate-400 leading-relaxed">
              Game progression is tied to real academic effort. Solving practice questions, completing focus sessions, and mastering syllabus topics give you XP and Stat Points!
            </p>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="lg:col-span-3 bg-[#080c19] border border-cyan-500/20 rounded-xl p-6 space-y-6">
          
          {/* SECTION 1: WELCOME & QUICK START */}
          {activeSection === 'quickstart' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 1
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Welcome to StudyBuddy AI
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  StudyBuddy turns real academic studying into an epic Solo Leveling-inspired Hunter system.
                </p>
              </div>

              {/* Core Promise Box */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/40 border border-cyan-500/30 rounded-xl p-5 space-y-3">
                <h3 className="font-heading font-bold text-cyan-300 text-sm tracking-wide uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  What is StudyBuddy?
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  StudyBuddy is an AI-powered study system built for students who want structure, motivation, and mastery. Rather than abstract gamification, every level, stat point, rank, and shadow soldier you gain is powered directly by your active studying—completing syllabus topics, passing topic quizzes, and holding focused study sessions.
                </p>
              </div>

              {/* First Time Start Flow */}
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-slate-200 text-sm tracking-wider uppercase border-l-2 border-cyan-400 pl-3">
                  First-Time Start Guide (3 Simple Steps)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 space-y-2 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
                      01
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Sign In with Google</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your progress, syllabus data, stats, and achievements are securely stored and synced under your Google account.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 space-y-2 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
                      02
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Create Your Syllabus</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Go to <strong className="text-cyan-300">My Syllabus</strong> and import your course topics or load a preset curriculum like BCA/CS.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 space-y-2 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
                      03
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Start Learning & Battling</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Conquer Dungeon Gates, take Knowledge Trials, or start Focus Sessions to earn XP and level up your Hunter attributes!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('syllabus')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-900/30"
                >
                  <BookOpen className="w-4 h-4" />
                  Go to My Syllabus
                </button>
                <button
                  onClick={() => onNavigate('dungeon')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  Enter Dungeon Gates
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: THE 5-STEP RPG FLOW */}
          {activeSection === 'core-flow' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 2
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  The 5-Step RPG Progression Loop
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  How your academic studying converts directly into Hunter progression.
                </p>
              </div>

              {/* Visual Flow Representation */}
              <div className="bg-[#050811] border border-cyan-500/30 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono-tech text-cyan-400 font-bold">STEP 1</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">ACCOUNT</div>
                    <div className="text-[11px] text-slate-500 mt-1">Google Auth</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono-tech text-cyan-400 font-bold">STEP 2</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">SYLLABUS</div>
                    <div className="text-[11px] text-slate-500 mt-1">Define Topics</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono-tech text-cyan-400 font-bold">STEP 3</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">STUDY</div>
                    <div className="text-[11px] text-slate-500 mt-1">Quizzes & Focus</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono-tech text-amber-400 font-bold">STEP 4</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">XP + MASTERY</div>
                    <div className="text-[11px] text-slate-500 mt-1">Topic Progress</div>
                  </div>

                  <div className="bg-gradient-to-b from-cyan-950 to-indigo-950 p-3 rounded-lg border border-cyan-500/40">
                    <div className="text-[10px] font-mono-tech text-cyan-300 font-bold">STEP 5</div>
                    <div className="text-xs font-bold text-cyan-200 mt-1">LEVEL + POWER</div>
                    <div className="text-[11px] text-cyan-400/80 mt-1">Stat Allocation</div>
                  </div>
                </div>
              </div>

              {/* Loop Details */}
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-cyan-300 text-sm">How XP and Levels Work</h4>
                  <p className="text-slate-300">
                    You earn XP by answering quiz questions correctly, defeating Dungeon Gate sentinels, defeating Chapter Bosses, completing Pomodoro focus sessions, and grading flashcards in Revision Lab. Reaching XP thresholds increases your <strong>Hunter Level</strong> and unlocks <strong>Stat Points</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-cyan-300 text-sm">How Topic Mastery Works</h4>
                  <p className="text-slate-300">
                    Each topic in your syllabus starts at 0% mastery. Completing quiz trials or focus time on that specific topic increases its mastery percentage up to 100%. High subject mastery strengthens your overall Hunter Rank (E-Rank up to Monarch Rank).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SYLLABUS & PROGRESSION WEB */}
          {activeSection === 'syllabus' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 3
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  My Syllabus & Progression Web
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Managing your curriculum, tracking topic mastery, and visualizing knowledge networks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-heading font-bold text-sm">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    My Syllabus
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Organize your courses into <strong>Subjects</strong>, <strong>Units</strong>, and <strong>Topics</strong>. You can type or upload your syllabus structure, or select sample academic programs.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    <li>Launch targeted drills directly for any topic.</li>
                    <li>Identify weak topics marked for urgent review.</li>
                    <li>Track overall semester completion percentage.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-heading font-bold text-sm">
                    <Network className="w-4 h-4 text-purple-400" />
                    Progression Web
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    An interactive, node-based visual graph mapping out every subject and concept in your active syllabus.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    <li>Visualizes prerequisite linkages between units.</li>
                    <li>Glowing nodes indicate mastered topics.</li>
                    <li>Click any node to trigger quick drill trials.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('progression-web')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Network className="w-4 h-4" />
                  View Interactive Progression Web
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: DUNGEONS & BOSS TRIALS */}
          {activeSection === 'combat' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 4
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Dungeon Gates & Boss Trials
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Test your knowledge through intense RPG battle simulation modes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-heading font-bold text-sm">
                    <Swords className="w-4 h-4 text-cyan-400" />
                    Dungeon Gates
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clear E-Rank to S-Rank gates by answering conceptual questions. Correct answers strike the enemy gate boss; wrong answers cost HP!
                  </p>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-cyan-300">Reward:</strong> Gold, XP, and instant topic mastery progression.
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-heading font-bold text-sm">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Boss Trials & Shadow Extraction
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Chapter-ending bosses guard major milestones. Defeating a boss grants massive XP and allows you to perform <strong className="text-purple-300 font-mono-tech">SHADOW EXTRACTION</strong> ("ARISE!") to recruit them into your Shadow Army!
                  </p>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-amber-300">Reward:</strong> Unique Shadow Soldiers & Boss Trophies.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('boss')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  Challenge Boss Trials
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: HUNTER STATS & POWER */}
          {activeSection === 'attributes' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 5
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Hunter Attributes & Equipment Power
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  How stat points and equipment loadouts affect your gameplay and study capabilities.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-heading font-bold text-slate-200 text-sm tracking-wide uppercase">
                  The 5 Core Attributes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <span>🧠</span> INTELLIGENCE
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Increases XP yield per correct quiz question and unlocks advanced AI explanations.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                      <span>💪</span> STRENGTH
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Increases attack damage dealt to Dungeon Gate monsters and Bosses during combat.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <span>⚡</span> AGILITY
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Increases quiz timer allowance and speed bonus rewards.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <span>🛡️</span> VITALITY
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Increases maximum Health Points (HP) and reduces damage taken from wrong quiz answers.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                      <span>👁️</span> SENSE
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Increases chance of critical hits and reveals weak topic suggestions automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-cyan-300 uppercase tracking-wider font-mono-tech">
                  Equipment & Loadout
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As you complete quests and dungeon gates, you acquire weapons, armor, rings, and relics. Equipping items in your <strong>Hunter Attributes</strong> tab boosts your overall Combat Power (CP) and stat multipliers!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('character')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  View Hunter Attributes & Loadout
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: REVISION LAB & FOCUS SANCTUARY */}
          {activeSection === 'revision-focus' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 6
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Revision Lab & Focus Sanctuary
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Tools designed for high-retention active recall and deep focus study blocks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-heading font-bold text-sm">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    Revision Lab (Flashcards)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Create or AI-generate flashcard decks linked to your syllabus topics. Uses spaced repetition grading (Easy, Good, Hard) to optimize long-term memory retention.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-heading font-bold text-sm">
                    <Timer className="w-4 h-4 text-indigo-400" />
                    Focus Sanctuary (Pomodoro)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Set customized focus timers (25m, 45m, 60m) accompanied by immersive ambient soundscapes (Cyber Rain, Dungeon Ambient, White Noise). Completing focus intervals yields direct XP!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('revision')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4" />
                  Open Revision Lab
                </button>
                <button
                  onClick={() => onNavigate('focus')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  Enter Focus Sanctuary
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: HUNTER AI SYSTEM GUIDE */}
          {activeSection === 'ai-guide' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 7
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Hunter AI Guide & Custom Configuration
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Your 24/7 personal academic mentor powered by Google Gemini and flexible AI providers.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    How the System AI Assistant Helps You
                  </h4>
                  <p>
                    The Hunter AI Assistant acts as a direct, clear educational tutor. Ask it to explain complex concepts, solve tough syllabus problems, generate sample questions, or break down formulas step-by-step.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" />
                    Multi-Provider Configuration
                  </h4>
                  <p>
                    In <strong className="text-cyan-300">AI Configuration</strong>, you can configure your choice of LLM provider (Google Gemini, OpenRouter, Groq, Ollama) and input custom API keys for higher rate limits or specialized models.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('ai')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  Ask Hunter AI Guide
                </button>
                <button
                  onClick={() => onNavigate('ai-config')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Configure AI Settings
                </button>
              </div>
            </div>
          )}

          {/* SECTION 8: GUILDS, SKILLS & ARMY */}
          {activeSection === 'social-progression' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 8
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Shadow Army, Skill Tree & Guild Hall
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Advanced progression systems to boost your study efficiency and join fellow hunters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <Ghost className="w-4 h-4 text-purple-400" />
                    Shadow Army
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Deploy extracted shadow soldiers on passive background quests to earn passive Gold and XP over time!
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <GitFork className="w-4 h-4 text-cyan-400" />
                    Skill Tree
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Spend Skill Points unlocked at key level milestones to gain active perks like "Ruler's Authority" and "Monarch's Domain".
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Guild Hall
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Join or create study guilds, compete on global hunter leaderboards, and take down guild raid bosses together.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: SYNC & ACCOUNT RESET */}
          {activeSection === 'account-reset' && (
            <div className="space-y-6">
              <div className="border-b border-cyan-500/20 pb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono-tech uppercase font-bold tracking-wider">
                  Chapter 9
                </span>
                <h2 className="font-monarch text-2xl font-bold text-slate-100 mt-2">
                  Cloud Synchronization & Progress Reset
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  How your data is stored and how to perform a safe progression reset if desired.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Automatic Cloud Synchronization
                  </h4>
                  <p>
                    When logged in via Google Auth, your level, XP, stat allocations, quest completions, and custom syllabi are automatically synced to the secure server database.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-red-900/40 bg-red-950/10 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-red-400" />
                    Resetting Your Progression
                  </h4>
                  <p>
                    If you want to start fresh with Level 1 stats and empty quest history, you can open <strong className="text-slate-200">Hunter Attributes</strong> and click <strong className="text-red-400">Reset System Progress</strong>. A confirmation modal will appear to prevent accidental deletion.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('character')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  Go to Hunter Attributes & Settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
