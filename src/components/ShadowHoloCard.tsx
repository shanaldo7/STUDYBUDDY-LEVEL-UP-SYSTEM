import React, { useState, useRef, useCallback } from 'react';
import { ShadowSoldier } from '../types/hunter';
import { 
  Ghost, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Shield, 
  Flame, 
  RefreshCw, 
  Eye, 
  Swords, 
  Lock, 
  Unlock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ShadowHoloCardProps {
  shadow: ShadowSoldier;
  isUnlocked?: boolean;
  onDeploy?: (shadowId: string) => void;
  onInspect3D?: (shadow: ShadowSoldier) => void;
  onGoToBoss?: () => void;
}

export const ShadowHoloCard: React.FC<ShadowHoloCardProps> = ({
  shadow,
  isUnlocked = true,
  onDeploy,
  onInspect3D,
  onGoToBoss
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Theme-specific color configurations
  const themeStyles = {
    'crimson-berserk': {
      border: 'border-rose-500/50 hover:border-rose-400',
      glow: 'shadow-[0_0_35px_-8px_rgba(244,63,94,0.4)]',
      bgGrad: 'from-[#1c080d] via-[#120508] to-[#080204]',
      badgeBg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
      titleColor: 'text-rose-200',
      accentColor: 'text-rose-400',
      sigilGlow: 'rgba(244, 63, 94, 0.45)',
      foilFilter: 'linear-gradient(135deg, rgba(244,63,94,0.3) 0%, rgba(251,191,36,0.2) 50%, rgba(168,85,247,0.3) 100%)',
      emberColor: '#f43f5e',
      statBarColor: 'bg-gradient-to-r from-rose-600 to-amber-500'
    },
    'glacial-runes': {
      border: 'border-cyan-500/50 hover:border-cyan-400',
      glow: 'shadow-[0_0_35px_-8px_rgba(6,182,212,0.4)]',
      bgGrad: 'from-[#061726] via-[#040e1a] to-[#02060b]',
      badgeBg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
      titleColor: 'text-cyan-200',
      accentColor: 'text-cyan-400',
      sigilGlow: 'rgba(6, 182, 212, 0.45)',
      foilFilter: 'linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(147,197,253,0.2) 50%, rgba(192,132,252,0.3) 100%)',
      emberColor: '#38bdf8',
      statBarColor: 'bg-gradient-to-r from-cyan-500 to-blue-500'
    },
    'ashen-cinder': {
      border: 'border-amber-500/50 hover:border-amber-400',
      glow: 'shadow-[0_0_35px_-8px_rgba(245,158,11,0.4)]',
      bgGrad: 'from-[#1f1609] via-[#140e05] to-[#080502]',
      badgeBg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      titleColor: 'text-amber-200',
      accentColor: 'text-amber-400',
      sigilGlow: 'rgba(245, 158, 11, 0.45)',
      foilFilter: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(239,68,68,0.2) 50%, rgba(251,191,36,0.3) 100%)',
      emberColor: '#f59e0b',
      statBarColor: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    'golden-sovereign': {
      border: 'border-yellow-400/60 hover:border-yellow-300',
      glow: 'shadow-[0_0_40px_-8px_rgba(250,204,21,0.45)]',
      bgGrad: 'from-[#221c08] via-[#141004] to-[#090702]',
      badgeBg: 'bg-yellow-950/80 border-yellow-400/50 text-yellow-300',
      titleColor: 'text-yellow-100',
      accentColor: 'text-yellow-400',
      sigilGlow: 'rgba(250, 204, 21, 0.5)',
      foilFilter: 'linear-gradient(135deg, rgba(250,204,21,0.35) 0%, rgba(245,158,11,0.25) 50%, rgba(253,224,71,0.35) 100%)',
      emberColor: '#facc15',
      statBarColor: 'bg-gradient-to-r from-yellow-500 to-amber-400'
    },
    'monarch-void': {
      border: 'border-purple-500/50 hover:border-purple-400',
      glow: 'shadow-[0_0_35px_-8px_rgba(168,85,247,0.4)]',
      bgGrad: 'from-[#170a2c] via-[#0f061c] to-[#06020a]',
      badgeBg: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
      titleColor: 'text-purple-200',
      accentColor: 'text-purple-400',
      sigilGlow: 'rgba(168, 85, 247, 0.45)',
      foilFilter: 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(99,102,241,0.2) 50%, rgba(236,72,153,0.3) 100%)',
      emberColor: '#a855f7',
      statBarColor: 'bg-gradient-to-r from-purple-500 to-indigo-500'
    }
  }[shadow.theme || 'monarch-void'];

  // Grade color badges
  const gradeBadges: Record<string, { label: string; bg: string; text: string }> = {
    'Grand Marshal': { label: 'GRAND MARSHAL', bg: 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 border-amber-400/60', text: 'text-amber-300' },
    'Marshal': { label: 'MARSHAL', bg: 'bg-rose-950/80 border-rose-500/50', text: 'text-rose-300' },
    'Elite Knight': { label: 'ELITE KNIGHT', bg: 'bg-purple-950/80 border-purple-500/50', text: 'text-purple-300' },
    'Knight': { label: 'KNIGHT', bg: 'bg-indigo-950/80 border-indigo-500/50', text: 'text-indigo-300' },
    'Elite': { label: 'ELITE', bg: 'bg-cyan-950/80 border-cyan-500/50', text: 'text-cyan-300' },
    'Normal': { label: 'NORMAL', bg: 'bg-slate-900/80 border-slate-700', text: 'text-slate-300' }
  };

  const gradeInfo = gradeBadges[shadow.grade] || gradeBadges.Normal;

  // Mouse move handler for interactive 3D card tilt & holographic foil glare
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize between -12 deg and +12 deg
    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = -((y - centerY) / centerY) * 12;

    const glareX = Math.round((x / rect.width) * 100);
    const glareY = Math.round((y / rect.height) * 100);

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleToggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playSfx('flip');
    setIsFlipped(prev => !prev);
  };

  const stats = shadow.stats || {
    strength: 50,
    agility: 50,
    intelligence: 50,
    vitality: 50,
    sense: 50
  };

  return (
    <div 
      className="relative flex flex-col group perspective-1000"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-full rounded-2xl border ${themeStyles.border} ${themeStyles.glow}
          bg-gradient-to-b ${themeStyles.bgGrad}
          p-5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden
          ${!isUnlocked ? 'opacity-70 grayscale-[35%]' : ''}
        `}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transformStyle: 'preserve-3d',
          minHeight: '480px'
        }}
      >
        {/* Holographic Rainbow Foil Sheen Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 z-20"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%), ${themeStyles.foilFilter}`,
            mixBlendMode: 'color-dodge'
          }}
        />

        {/* Ambient background glow ring */}
        <div 
          className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: themeStyles.sigilGlow }}
        />

        {/* Card Face Switcher (Front vs Back) */}
        {!isFlipped ? (
          /* FRONT FACE: Tactical Plate */
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            {/* 1. Header: Grade, Rank & Soldier Type */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-monarch font-bold uppercase tracking-wider ${gradeInfo.bg} ${gradeInfo.text}`}>
                  {gradeInfo.label}
                </span>

                <div className="flex items-center gap-1.5 font-mono-tech text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-amber-300 font-bold">
                    RANK {shadow.rank || 'S'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-cyan-300">
                    LV.{shadow.level || 30}
                  </span>
                </div>
              </div>

              {/* Character Name & Identity */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className={`font-monarch font-black text-xl sm:text-2xl tracking-wide ${themeStyles.titleColor}`}>
                    {shadow.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono-tech flex items-center gap-1 mt-0.5">
                    <Ghost className="w-3.5 h-3.5 text-purple-400" />
                    <span>{shadow.type}</span>
                  </div>
                </div>

                <button
                  onClick={handleToggleFlip}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Flip to view soldier codex & stats"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Character Model / Illustrated Holographic Window */}
            <div className="relative h-44 rounded-xl border border-slate-800/80 bg-gradient-to-b from-black/80 via-slate-950/60 to-black/90 overflow-hidden flex items-center justify-center">
              {/* Darksign / Eclipse Sigil */}
              <div 
                className="absolute w-28 h-28 rounded-full border-2 border-dashed opacity-40 animate-spin-slow"
                style={{ borderColor: themeStyles.emberColor }}
              />
              <div 
                className="absolute w-36 h-36 rounded-full blur-xl opacity-30"
                style={{ background: themeStyles.sigilGlow }}
              />

              {/* Character Iconic Silhouette Artwork */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-black border border-slate-700 p-0.5 shadow-xl flex items-center justify-center">
                  <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center">
                    {shadow.theme === 'crimson-berserk' && <Swords className="w-10 h-10 text-rose-400 animate-pulse" />}
                    {shadow.theme === 'glacial-runes' && <Shield className="w-10 h-10 text-cyan-400 animate-pulse" />}
                    {shadow.theme === 'ashen-cinder' && <Flame className="w-10 h-10 text-amber-400 animate-pulse" />}
                    {shadow.theme === 'golden-sovereign' && <Sparkles className="w-10 h-10 text-yellow-300 animate-pulse" />}
                    {(!shadow.theme || shadow.theme === 'monarch-void') && <Ghost className="w-10 h-10 text-purple-400 animate-pulse" />}
                  </div>
                </div>

                <span className="mt-2 text-[11px] font-mono-tech uppercase tracking-widest text-slate-400">
                  {shadow.abilityName || 'Shadow Vanguard'}
                </span>
              </div>

              {/* Status / Lock Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 p-4 text-center">
                  <Lock className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-xs font-mono-tech text-amber-300 font-bold uppercase">LOCKED SHADOW</span>
                  <span className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    Defeat {shadow.extractedFrom} in Boss Trials to extract.
                  </span>
                </div>
              )}
            </div>

            {/* 3. Character-Specific Power & Combat Stat Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-slate-400">COMBAT POWER:</span>
                <span className="text-amber-300 font-bold font-mono text-sm">+{shadow.powerBonus.toLocaleString()} CP</span>
              </div>

              {/* Character 5 Stats Preview */}
              <div className="grid grid-cols-5 gap-1.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center font-mono-tech">
                <div>
                  <div className="text-[10px] text-slate-400">INT</div>
                  <div className="text-xs font-bold text-cyan-300">{stats.intelligence}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">STR</div>
                  <div className="text-xs font-bold text-rose-300">{stats.strength}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">AGI</div>
                  <div className="text-xs font-bold text-amber-300">{stats.agility}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">VIT</div>
                  <div className="text-xs font-bold text-emerald-300">{stats.vitality}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SEN</div>
                  <div className="text-xs font-bold text-purple-300">{stats.sense}</div>
                </div>
              </div>

              {/* Passive Study Buff */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <div className={`font-semibold mb-0.5 flex items-center gap-1.5 ${themeStyles.accentColor}`}>
                  <Sparkles className="w-3.5 h-3.5" /> Passive Study Perk:
                </div>
                <div className="text-slate-300 text-[11px] leading-snug line-clamp-2">
                  {shadow.perkDescription}
                </div>
              </div>
            </div>

            {/* 4. Action Buttons Strip */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              {onInspect3D && (
                <button
                  onClick={() => onInspect3D(shadow)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono-tech transition-colors cursor-pointer"
                  title="Open full 3D interactive holographic card"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  3D View
                </button>
              )}

              {isUnlocked ? (
                <button
                  onClick={() => {
                    soundManager.playSfx('arise');
                    onDeploy?.(shadow.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/80 to-slate-900 hover:from-purple-800 hover:to-slate-800 border border-purple-500/40 text-purple-200 text-xs font-heading font-bold uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Deploy Patrol
                </button>
              ) : (
                <button
                  onClick={onGoToBoss}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Raid Boss <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* BACK FACE: Shadow Codex & Full System Attributes */
          <div className="relative z-10 flex flex-col justify-between h-full space-y-3 animate-in fade-in">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">
                    SHADOW SOVEREIGN CODEX
                  </span>
                  <h4 className={`font-monarch font-bold text-lg ${themeStyles.titleColor}`}>
                    {shadow.name}
                  </h4>
                </div>

                <button
                  onClick={handleToggleFlip}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Flip back to front plate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Lore & Origin */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 italic">
                "{shadow.lore || shadow.motto || shadow.perkDescription}"
              </div>
            </div>

            {/* 5 Core Attributes Breakdown with Bars */}
            <div className="space-y-1.5 font-mono-tech text-xs">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                ATTRIBUTE MATRIX:
              </div>

              {[
                { label: 'INTELLIGENCE (INT)', val: stats.intelligence, desc: 'Concept Logic & Problem Solving', color: 'text-cyan-300' },
                { label: 'STRENGTH (STR)', val: stats.strength, desc: 'Willpower & Combat Resilience', color: 'text-rose-300' },
                { label: 'AGILITY (AGI)', val: stats.agility, desc: 'Reaction Speed & Calculation', color: 'text-amber-300' },
                { label: 'VITALITY (VIT)', val: stats.vitality, desc: 'Stamina & Fatigue Absorption', color: 'text-emerald-300' },
                { label: 'SENSE (SEN)', val: stats.sense, desc: 'Intuition & Error Spotting', color: 'text-purple-300' }
              ].map((s) => (
                <div key={s.label} className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] text-slate-400">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.val}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${themeStyles.statBarColor}`}
                      style={{ width: `${Math.min(100, Math.max(10, (s.val / 160) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Ability Detail */}
            <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs">
              <div className="text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3 text-purple-400" />
                {shadow.abilityName || 'Shadow Vanguard Ability'}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {shadow.abilityDescription || shadow.perkDescription}
              </p>
            </div>

            {/* Bottom Status & Flip Back */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono-tech text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isUnlocked ? 'BUFF ACTIVE' : 'LOCKED'}
              </span>

              <button
                onClick={handleToggleFlip}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                Front Plate <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
