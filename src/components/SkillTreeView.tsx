import React from 'react';
import { SkillNode, HunterUser } from '../types/hunter';
import { 
  GitFork, 
  Crown, 
  Sparkles, 
  Shield, 
  Zap, 
  Eye, 
  Ghost, 
  Lock, 
  Check, 
  Plus,
  ArrowDown
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ScrollReveal } from './ScrollReveal';

interface SkillTreeViewProps {
  user: HunterUser;
  skills: SkillNode[];
  onUpgradeSkill: (skillId: string) => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  user,
  skills,
  onUpgradeSkill
}) => {
  const branchIcons: Record<string, React.ElementType> = {
    Shadow: Ghost,
    Cognitive: Sparkles,
    Battle: Shield
  };

  const skillIcons: Record<string, React.ElementType> = {
    Ghost: Ghost,
    Crown: Crown,
    Sparkles: Sparkles,
    Eye: Eye,
    Shield: Shield,
    Zap: Zap
  };

  const branches = ['Shadow', 'Cognitive', 'Battle'] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <ScrollReveal threshold={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div>
            <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
              HUNTER MASTERY CONDUITS
            </span>
            <h1 className="font-monarch font-bold text-2xl text-slate-100">
              SKILL TREE & COGNITIVE TALENTS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-amber-950/40 border border-amber-500/40 font-mono-tech text-xs text-amber-300">
              Available Skill Points: <b className="text-base text-amber-200">{user.statPoints}</b>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 max-w-3xl mt-3">
          Unlock passive abilities and active study buffs using earned Stat & Skill Points. 
          Advance through branches to enhance your recall speed, focus stamina, and dungeon combat multipliers.
        </p>
      </ScrollReveal>

      {/* 3 Branches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map((branch, bIdx) => {
          const BranchIcon = branchIcons[branch];
          const branchSkills = skills.filter(s => s.branch === branch);

          const branchColors: Record<string, { border: string; glow: string; headerBg: string; text: string; stroke: string }> = {
            Shadow: { border: 'border-purple-500/40', glow: 'shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]', headerBg: 'bg-purple-950/40', text: 'text-purple-300', stroke: '#c084fc' },
            Cognitive: { border: 'border-cyan-500/40', glow: 'shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]', headerBg: 'bg-cyan-950/40', text: 'text-cyan-300', stroke: '#38bdf8' },
            Battle: { border: 'border-rose-500/40', glow: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]', headerBg: 'bg-rose-950/40', text: 'text-rose-300', stroke: '#fb7185' }
          };

          const style = branchColors[branch];

          return (
            <ScrollReveal key={branch} staggerIndex={bIdx} threshold={0.1}>
              <div
                className={`glass-panel rounded-xl border ${style.border} ${style.glow} p-5 flex flex-col justify-between h-full`}
              >
                <div>
                  <div className={`p-3 rounded-lg ${style.headerBg} border ${style.border} flex items-center gap-3 mb-5`}>
                    <BranchIcon className={`w-6 h-6 ${style.text}`} />
                    <div>
                      <h2 className="font-heading font-black text-lg text-slate-100">{branch} Mastery</h2>
                      <div className="text-[10px] font-mono-tech text-slate-400">Path of the Awakened</div>
                    </div>
                  </div>

                  <div className="space-y-4 relative">
                    {branchSkills.map((sk, sIdx) => {
                      const Icon = skillIcons[sk.icon] || Sparkles;
                      const canUpgrade = user.statPoints >= sk.cost && sk.level < sk.maxLevel;
                      const hasNext = sIdx < branchSkills.length - 1;

                      return (
                        <React.Fragment key={sk.id}>
                          <ScrollReveal staggerIndex={sIdx} threshold={0.1}>
                            <div
                              className={`
                                p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                                ${sk.unlocked 
                                  ? 'bg-slate-900/80 border-slate-700/80 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]' 
                                  : 'bg-slate-950/60 border-slate-900 opacity-60'}
                              `}
                            >
                              {/* Subtle pulse for unlocked node */}
                              {sk.unlocked && (
                                <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                              )}

                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2.5 rounded-lg ${sk.unlocked ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900 text-slate-600'}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-heading font-bold text-sm text-slate-100">{sk.name}</h3>
                                      {sk.unlocked && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-300 font-mono-tech border border-cyan-500/40">
                                          LV. {sk.level}/{sk.maxLevel}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-snug">{sk.description}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tech">
                                <span className="text-slate-400">
                                  Cost: <b className="text-amber-300">{sk.cost} PTS</b>
                                </span>

                                {sk.level >= sk.maxLevel ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> MAX LEVEL
                                  </span>
                                ) : (
                                  <button
                                    disabled={!canUpgrade}
                                    onClick={() => {
                                      soundManager.playSfx('levelup');
                                      onUpgradeSkill(sk.id);
                                    }}
                                    className={`
                                      flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold font-heading uppercase tracking-wider transition-all
                                      ${canUpgrade 
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                    `}
                                  >
                                    <Plus className="w-3 h-3" /> Upgrade
                                  </button>
                                )}
                              </div>
                            </div>
                          </ScrollReveal>

                          {/* Animated Energy Conduit Connecting Nodes */}
                          {hasNext && (
                            <div className="flex items-center justify-center my-1 py-1">
                              <svg width="24" height="28" viewBox="0 0 24 28" className="overflow-visible">
                                <line 
                                  x1="12" y1="0" x2="12" y2="28" 
                                  stroke={style.stroke} 
                                  strokeWidth="2" 
                                  className="conduit-line"
                                />
                                <circle cx="12" cy="14" r="3" fill={style.stroke} className="animate-ping opacity-75" />
                              </svg>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
};
