import React from 'react';
import { ShadowSoldier, HunterUser } from '../types/hunter';
import { 
  Ghost, 
  Crown, 
  Shield, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Award,
  Swords
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ShadowArmyViewProps {
  user: HunterUser;
  shadows: ShadowSoldier[];
  onDeployShadow: (shadowId: string) => void;
}

export const ShadowArmyView: React.FC<ShadowArmyViewProps> = ({
  user,
  shadows,
  onDeployShadow
}) => {
  const totalPower = shadows.reduce((acc, s) => acc + s.powerBonus, 0);

  const gradeColors: Record<string, { border: string; text: string; bg: string }> = {
    Normal: { border: 'border-slate-700', text: 'text-slate-400', bg: 'bg-slate-900' },
    Elite: { border: 'border-cyan-700', text: 'text-cyan-400', bg: 'bg-cyan-950/40' },
    Knight: { border: 'border-indigo-600', text: 'text-indigo-400', bg: 'bg-indigo-950/40' },
    'Elite Knight': { border: 'border-purple-600', text: 'text-purple-400', bg: 'bg-purple-950/40' },
    Marshal: { border: 'border-red-600', text: 'text-red-400', bg: 'bg-red-950/40' },
    'Grand Marshal': { border: 'border-amber-500', text: 'text-amber-300', bg: 'bg-amber-950/50' }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Throne Header */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/40 bg-gradient-to-r from-[#170a2c] via-[#100720] to-[#07040e] p-6 shadow-[0_0_35px_-5px_rgba(168,85,247,0.3)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono-tech font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              SOVEREIGN'S DOMAIN: EXTRACTED SHADOW ARMY
            </div>
            <h1 className="font-monarch font-black text-2xl sm:text-3xl text-slate-100">
              THE SHADOW MONARCH THRONE
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              "Save their souls from the void and command them in eternal pursuit of knowledge." 
              Your extracted shadows provide passive study power, absorb exam stress, and boost memory recall.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-purple-950/50 border border-purple-500/30 px-5 py-3 rounded-xl font-mono-tech">
            <div>
              <div className="text-xs text-purple-300 uppercase">Army Size</div>
              <div className="text-2xl font-bold text-slate-100">{shadows.length} Soldiers</div>
            </div>
            <div className="border-l border-purple-500/30 pl-4">
              <div className="text-xs text-amber-300 uppercase">Total Combat Power</div>
              <div className="text-2xl font-bold text-amber-400">+{totalPower.toLocaleString()} CP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster of Extracted Shadows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shadows.map((shadow) => {
          const style = gradeColors[shadow.grade] || gradeColors.Normal;

          return (
            <div
              key={shadow.id}
              className={`
                glass-panel rounded-xl p-5 border ${style.border} transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between group
                shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-monarch font-bold uppercase tracking-wider ${style.text} ${style.bg} ${style.border}`}>
                    {shadow.grade}
                  </span>
                  <span className="font-mono-tech text-xs text-amber-300 font-bold">
                    +{shadow.powerBonus} CP
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400 group-hover:text-purple-300 transition-colors shrink-0">
                    <Ghost className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-slate-100 group-hover:text-purple-300 transition-colors">
                      {shadow.name}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono-tech">Type: {shadow.type}</div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                  <div className="text-purple-400 font-semibold mb-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Passive Study Perk:
                  </div>
                  <div className="text-slate-300 leading-snug">{shadow.perkDescription}</div>
                </div>

                <div className="mt-2 text-[10px] font-mono-tech text-slate-500">
                  Extracted from: {shadow.extractedFrom}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-mono-tech flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE BUFF
                </span>

                <button
                  onClick={() => {
                    soundManager.playSfx('arise');
                    onDeployShadow(shadow.id);
                  }}
                  className="px-3 py-1.5 rounded bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-heading font-bold uppercase tracking-wider transition-colors"
                >
                  Deploy Patrol
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
