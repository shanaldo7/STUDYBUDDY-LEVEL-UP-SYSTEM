import React, { useState } from 'react';
import { ShadowSoldier, HunterUser } from '../types/hunter';
import { allExtractableShadowsCatalog } from '../data/initialData';
import { ShadowHoloCard } from './ShadowHoloCard';
import { DarkSoulsHoloCard } from './threeui/DarkSoulsHoloCard';
import { 
  Ghost, 
  Crown, 
  Zap, 
  Sparkles, 
  Lock, 
  Unlock,
  CheckCircle,
  Swords,
  X,
  Maximize2
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ShadowArmyViewProps {
  user: HunterUser;
  shadows: ShadowSoldier[];
  onDeployShadow: (shadowId: string) => void;
  onNavigateToBoss?: () => void;
}

export const ShadowArmyView: React.FC<ShadowArmyViewProps> = ({
  user,
  shadows,
  onDeployShadow,
  onNavigateToBoss
}) => {
  const [selectedShadowFor3D, setSelectedShadowFor3D] = useState<ShadowSoldier | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Build complete roster merging user's extracted shadows with full catalog
  const mergedRoster: (ShadowSoldier & { isUnlocked: boolean })[] = allExtractableShadowsCatalog.map(catalogItem => {
    const userSoldier = shadows.find(s => s.id === catalogItem.id || s.name.toLowerCase().includes(catalogItem.name.toLowerCase().slice(0, 8)));
    if (userSoldier) {
      return {
        ...catalogItem,
        ...userSoldier,
        isUnlocked: true
      };
    }
    // Check if user has it directly
    const directMatch = shadows.find(s => s.id === catalogItem.id);
    if (directMatch) {
      return { ...catalogItem, ...directMatch, isUnlocked: true };
    }
    return {
      ...catalogItem,
      isUnlocked: catalogItem.isUnlocked ?? false
    };
  });

  // Also include any dynamically extracted shadows that weren't in default catalog
  shadows.forEach(userS => {
    if (!mergedRoster.some(r => r.id === userS.id || r.name === userS.name)) {
      mergedRoster.unshift({
        ...userS,
        isUnlocked: true,
        stats: userS.stats || {
          strength: 80,
          agility: 75,
          intelligence: 70,
          vitality: 85,
          sense: 75
        },
        theme: userS.theme || 'monarch-void',
        rank: userS.rank || 'S',
        level: userS.level || 40
      });
    }
  });

  const unlockedCount = mergedRoster.filter(s => s.isUnlocked).length;
  const totalPower = mergedRoster
    .filter(s => s.isUnlocked)
    .reduce((acc, s) => acc + s.powerBonus, 0);

  const displayedRoster = mergedRoster.filter(s => {
    if (filter === 'unlocked') return s.isUnlocked;
    if (filter === 'locked') return !s.isUnlocked;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Sovereign Throne Header */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-r from-[#170a2c] via-[#100720] to-[#07040e] p-6 shadow-[0_0_35px_-5px_rgba(168,85,247,0.3)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono-tech font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              SOVEREIGN'S DOMAIN: SHADOW ARMY HOLOGRAPHIC ROSTER
            </div>
            <h1 className="font-monarch font-black text-2xl sm:text-3xl text-slate-100">
              THE SHADOW MONARCH THRONE
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              "Save their souls from the void and command them in eternal pursuit of knowledge." 
              Every extracted shadow commander possesses their own holographic plate, distinct stats, abilities, and study passives.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-purple-950/60 border border-purple-500/30 px-5 py-3.5 rounded-xl font-mono-tech">
            <div>
              <div className="text-xs text-purple-300 uppercase">Army Roster</div>
              <div className="text-2xl font-bold text-slate-100 flex items-center gap-1.5">
                <span>{unlockedCount}</span>
                <span className="text-xs text-slate-400 font-normal">/ {mergedRoster.length} Awakened</span>
              </div>
            </div>
            <div className="border-l border-purple-500/30 pl-4">
              <div className="text-xs text-amber-300 uppercase">Total Combat Power</div>
              <div className="text-2xl font-bold text-amber-400">+{totalPower.toLocaleString()} CP</div>
            </div>
          </div>
        </div>

        {/* Collection Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-purple-500/30 text-xs font-mono-tech">
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Characters ({mergedRoster.length})
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setFilter('unlocked');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'unlocked'
                  ? 'bg-emerald-600 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" /> Unlocked ({unlockedCount})
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setFilter('locked');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'locked'
                  ? 'bg-amber-600 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Extractable Bosses ({mergedRoster.length - unlockedCount})
            </button>
          </div>

          <div className="text-xs font-mono-tech text-slate-400 hidden sm:block">
            Hover to tilt holographic foil · Double-click to flip plate
          </div>
        </div>
      </div>

      {/* Shadow Army Collection: Responsive Grid of Individual Holographic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedRoster.map((shadow) => (
          <ShadowHoloCard
            key={shadow.id}
            shadow={shadow}
            isUnlocked={shadow.isUnlocked}
            onDeploy={() => onDeployShadow(shadow.id)}
            onInspect3D={(s) => {
              soundManager.playSfx('click');
              setSelectedShadowFor3D(s);
            }}
            onGoToBoss={onNavigateToBoss}
          />
        ))}
      </div>

      {/* Full 3D WebGL Three.js Holographic Card Inspection Modal */}
      {selectedShadowFor3D && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-[#0a0d1a] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="font-monarch font-bold text-lg text-slate-100">
                  {selectedShadowFor3D.name} · 3D CODEX
                </h3>
              </div>
              <button
                onClick={() => setSelectedShadowFor3D(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D Three.js Card Viewport */}
            <div className="flex justify-center">
              <DarkSoulsHoloCard
                shadow={selectedShadowFor3D}
                theme={selectedShadowFor3D.theme}
                interactive={true}
                showControls={true}
              />
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-tech">
              <span className="text-slate-400">
                Grade: <b className="text-amber-300">{selectedShadowFor3D.grade}</b> · Rank: <b className="text-cyan-300">{selectedShadowFor3D.rank || 'S'}</b>
              </span>
              <button
                onClick={() => setSelectedShadowFor3D(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                Close Codex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
