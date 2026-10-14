import React, { useState } from 'react';
import { HunterUser, HunterRank } from '../types/hunter';
import { HoloCardTheme, DarkSoulsHoloCard } from './threeui/DarkSoulsHoloCard';
import { X, Check, Sparkles, Palette, Crown, Shield, Flame, Wand2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CardCustomizerModalProps {
  isOpen: boolean;
  user: HunterUser;
  onClose: () => void;
  onSave: (updated: Partial<HunterUser>) => void;
}

const PRESET_TITLES = [
  'Shadow Monarch',
  'The Ashen One',
  'Unkindled Champion',
  'Void Sovereign',
  'Grand Archmage',
  'Abyssal Hunter',
  'Dawn Conqueror'
];

const THEMES: { id: HoloCardTheme; label: string; icon: string; desc: string; colors: string }[] = [
  { 
    id: 'ashen-cinder', 
    label: 'The Ashen One', 
    icon: '🌋', 
    desc: 'Fiery embers, bonfire sword, darksign eclipse & charcoal gold',
    colors: 'from-amber-600 via-orange-500 to-yellow-500 border-amber-500/50'
  },
  { 
    id: 'monarch-void', 
    label: 'Shadow Monarch', 
    icon: '🌌', 
    desc: 'Electric violet abyss, shadow army extraction & monarch runes',
    colors: 'from-purple-600 via-indigo-600 to-violet-500 border-purple-500/50'
  },
  { 
    id: 'glacial-runes', 
    label: 'Glacial Runes', 
    icon: '❄️', 
    desc: 'Crystalline frost, arctic cyan sigils & winter mana sanctuary',
    colors: 'from-cyan-500 via-sky-600 to-blue-500 border-cyan-500/50'
  },
  { 
    id: 'golden-sovereign', 
    label: 'Golden Sovereign', 
    icon: '👑', 
    desc: 'Radiant celestial gold, crown of domination & solar stardust',
    colors: 'from-amber-400 via-yellow-500 to-orange-400 border-yellow-400/50'
  },
  { 
    id: 'crimson-berserk', 
    label: 'Crimson Berserk', 
    icon: '🩸', 
    desc: 'Blood eclipse, demonic rage brand & dark ruby embers',
    colors: 'from-red-600 via-rose-600 to-crimson border-rose-500/50'
  }
];

const RANKS: HunterRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

export const CardCustomizerModal: React.FC<CardCustomizerModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave
}) => {
  const [hunterName, setHunterName] = useState(user.hunterName || 'Awakened Hunter');
  const [currentTitle, setCurrentTitle] = useState(user.currentTitle || 'Shadow Monarch');
  const [hunterRank, setHunterRank] = useState<HunterRank>(user.hunterRank || 'S');
  const [customMotto, setCustomMotto] = useState(
    user.customMotto || 'Only those who endure the darkness may ignite the flame.'
  );
  const [cardTheme, setCardTheme] = useState<HoloCardTheme>(user.cardTheme || 'ashen-cinder');

  if (!isOpen) return null;

  // Construct draft user preview
  const previewUser: HunterUser = {
    ...user,
    hunterName,
    currentTitle,
    hunterRank,
    customMotto,
    cardTheme
  };

  const handleSave = () => {
    soundManager.playSfx('levelup');
    onSave({
      hunterName: hunterName.trim() || 'Awakened Hunter',
      currentTitle: currentTitle.trim() || 'Shadow Monarch',
      hunterRank,
      customMotto: customMotto.trim() || 'Only those who endure the darkness may ignite the flame.',
      cardTheme
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#070b16] border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-[#0a1024] to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              🎴
            </div>
            <div>
              <h2 className="font-monarch font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-purple-300">
                HUNTER HOLOGRAPHIC CARD STUDIO
              </h2>
              <p className="text-xs text-slate-400 font-mono-tech">
                Customize 3D card identity, holographic shaders, runic motto & title
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playSfx('click');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column (Left: Controls, Right: Live 3D Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Shader Theme Selection */}
            <div className="space-y-3">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> 1. Holographic Shader Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEMES.map((th) => {
                  const isSelected = cardTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        soundManager.playSfx('click');
                        setCardTheme(th.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? `bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]`
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{th.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-sm text-slate-100">{th.label}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {th.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Character Name */}
            <div className="space-y-2">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5" /> 2. Hunter Character Name
              </label>
              <input
                type="text"
                value={hunterName}
                onChange={(e) => setHunterName(e.target.value)}
                maxLength={30}
                placeholder="Enter character name..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-heading font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* 3. Title & Presets */}
            <div className="space-y-2">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" /> 3. Hunter Title
              </label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                maxLength={40}
                placeholder="Enter hunter title..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-heading font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all mb-2"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      soundManager.playSfx('click');
                      setCurrentTitle(t);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-tech transition-all cursor-pointer ${
                      currentTitle === t
                        ? 'bg-purple-950/80 border border-purple-500/60 text-purple-200'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Hunter Rank Override / Display */}
            <div className="space-y-2">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> 4. Hunter Rank
              </label>
              <div className="flex items-center gap-2">
                {RANKS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      soundManager.playSfx('click');
                      setHunterRank(r);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-monarch font-extrabold border transition-all cursor-pointer ${
                      hunterRank === r
                        ? 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Character Motto / Quote */}
            <div className="space-y-2">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <Flame className="w-3.5 h-3.5" /> 5. Character Motto / Inscribed Quote
              </label>
              <textarea
                value={customMotto}
                onChange={(e) => setCustomMotto(e.target.value)}
                maxLength={90}
                rows={2}
                placeholder="Inscribe a quote on your hunter codex..."
                className="w-full px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
              />
              <div className="text-[10px] text-slate-500 font-mono-tech text-right">
                {customMotto.length} / 90 chars
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive 3D Card Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative">
            <div className="text-xs font-mono-tech uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Holographic 3D Preview
            </div>

            {/* 3D Holo Card with updated draft state */}
            <DarkSoulsHoloCard
              user={previewUser}
              theme={cardTheme}
              interactive={true}
              showControls={true}
              className="scale-95 sm:scale-100 origin-center"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/20 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('click');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-monarch font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Hunter Card
          </button>
        </div>
      </div>
    </div>
  );
};
