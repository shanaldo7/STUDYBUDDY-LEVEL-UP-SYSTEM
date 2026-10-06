import React, { useState } from 'react';
import { Boss, HunterUser, QuizQuestion } from '../types/hunter';
import { 
  Crown, 
  Flame, 
  ShieldAlert, 
  Zap, 
  Award, 
  RotateCcw, 
  Ghost, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ScrollReveal } from './ScrollReveal';

interface BossBattleViewProps {
  user: HunterUser;
  bosses: Boss[];
  questions: QuizQuestion[];
  onExtractShadow: (boss: Boss) => void;
  onVictory: (xp: number, gold: number) => void;
  onBack: () => void;
}

export const BossBattleView: React.FC<BossBattleViewProps> = ({
  user,
  bosses,
  questions,
  onExtractShadow,
  onVictory,
  onBack
}) => {
  const [selectedBoss, setSelectedBoss] = useState<Boss>(bosses[0]);
  const [inRaid, setInRaid] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(selectedBoss.hp);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isEnraged, setIsEnraged] = useState<boolean>(false);
  const [raidWon, setRaidWon] = useState<boolean>(false);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  const activeQuestions = questions;
  const currentQ = activeQuestions[currentQuestionIdx % activeQuestions.length];

  const startBossRaid = (boss: Boss) => {
    soundManager.playSfx('attack');
    setSelectedBoss(boss);
    setBossHp(boss.hp);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setIsEnraged(false);
    setRaidWon(false);
    setHasExtracted(false);
    setInRaid(true);
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || raidWon) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const correct = idx === currentQ.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      soundManager.playSfx('critical');
      const dmg = Math.floor(1800 + user.stats.intelligence * 10);
      const nextHp = Math.max(0, bossHp - dmg);
      setBossHp(nextHp);

      if (nextHp <= selectedBoss.maxHp * 0.5 && !isEnraged) {
        setIsEnraged(true);
      }

      if (nextHp <= 0) {
        soundManager.playSfx('victory');
        setRaidWon(true);
        onVictory(3500, 1500);
      }
    } else {
      soundManager.playSfx('damage');
    }
  };

  const handleNextTrial = () => {
    soundManager.playSfx('click');
    setHasAnswered(false);
    setSelectedOption(null);
    setCurrentQuestionIdx(prev => (prev + 1) % activeQuestions.length);
  };

  const handleAriseExtraction = () => {
    soundManager.playSfx('arise');
    setHasExtracted(true);
    onExtractShadow(selectedBoss);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={inRaid ? () => setInRaid(false) : onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-purple-400 hover:border-purple-500/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">
              {inRaid ? 'MONARCH RAID ENGAGED' : 'MONARCH THRONE ROOM'}
            </span>
            <h1 className="font-monarch font-bold text-2xl text-slate-100">
              {inRaid ? selectedBoss.name : 'LEGENDARY BOSS TRIALS'}
            </h1>
          </div>
        </div>

        {inRaid && (
          <div className="flex items-center gap-3">
            {isEnraged && (
              <span className="px-3 py-1 rounded bg-red-600/30 border border-red-500 text-red-300 text-xs font-mono-tech font-bold animate-pulse flex items-center gap-1">
                <Flame className="w-4 h-4 text-red-400" /> BOSS ENRAGED (PHASE 2)
              </span>
            )}
            <button
              onClick={() => setInRaid(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Surrender Raid
            </button>
          </div>
        )}
      </div>

      {!inRaid ? (
        /* Boss Roster Selection */
        <div className="space-y-6">
          <p className="text-sm text-slate-300 max-w-3xl">
            S-Rank Raid Bosses embody supreme mastery over specialized domains. Defeating a Monarch Boss allows you to trigger the ancient <b className="text-purple-300">"ARISE"</b> protocol to extract their fallen consciousness into your permanent Shadow Army.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bosses.map((boss, bIdx) => {
              const isSelected = selectedBoss.id === boss.id;
              const isLocked = user.level < boss.requiredLevel;
              return (
                <ScrollReveal key={boss.id} staggerIndex={bIdx} threshold={0.1}>
                  <div
                    onClick={() => {
                      if (!isLocked) setSelectedBoss(boss);
                    }}
                    className={`
                      glass-panel rounded-xl p-6 border transition-all duration-500 relative overflow-hidden group h-full flex flex-col justify-between
                      ${isLocked ? 'opacity-65 bg-slate-950/80 cursor-not-allowed border-slate-800' : 'cursor-pointer'}
                      ${isSelected && !isLocked
                        ? 'border-purple-500 shadow-[0_0_40px_-5px_rgba(168,85,247,0.45)] bg-gradient-to-b from-[#160c28] to-[#0c0717]' 
                        : !isLocked ? 'border-slate-800 hover:border-purple-500/50 bg-slate-900/60' : ''}
                    `}
                  >
                    {/* Pulsing Aura Flare & Energy Particles for Boss Card */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/25 rounded-full blur-2xl anime-pulse-aura" />
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/20 rounded-full blur-xl" />
                      <div className="absolute top-6 right-10 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping opacity-60" />
                      <div className="absolute bottom-14 right-14 w-1 h-1 rounded-full bg-purple-300 animate-pulse opacity-70" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded border border-amber-400/50 bg-amber-950/40 text-amber-300 text-xs font-monarch font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            RANK {boss.rank} BOSS
                          </span>
                          {isLocked && (
                            <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-mono-tech font-bold">
                              🔒 LV.{boss.requiredLevel} REQUIRED
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono-tech text-purple-300 font-bold">
                          HP: {boss.hp.toLocaleString()}
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-2xl text-slate-100 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                        <span>{boss.name}</span>
                        {isSelected && !isLocked && <Flame className="w-5 h-5 text-rose-500 animate-pulse" />}
                      </h3>
                      <div className="text-xs text-purple-400 font-mono-tech mt-0.5">{boss.title}</div>
                      <div className="text-xs text-cyan-400 font-mono-tech mt-1">Domain: {boss.specialty}</div>

                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {boss.lore}
                      </p>

                      {/* Extractable Shadow Preview Box */}
                      <div className="mt-4 p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Ghost className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="text-[11px] font-mono-tech text-purple-300 uppercase">Extractable Shadow</div>
                            <div className="text-xs font-bold text-slate-200">{boss.extractableShadow.name}</div>
                          </div>
                        </div>
                        <span className="font-mono-tech text-xs text-amber-300 font-bold">
                          +{boss.extractableShadow.power} PWR
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono-tech">
                        Phases: {boss.phases} · Solo Raid
                      </span>

                      <button
                        disabled={isLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) startBossRaid(boss);
                        }}
                        className={`
                          flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-all
                          ${isLocked 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                            : 'bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 hover:from-purple-600 hover:to-cyan-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 cursor-pointer'}
                        `}
                      >
                        <Crown className="w-4 h-4" />
                        {isLocked ? `Locked (Lv.${boss.requiredLevel})` : 'Initiate Raid'}
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      ) : (
        /* Boss Raid Combat Arena */
        <div className="space-y-6">
          {/* Boss HP Gauge & Crimson Aura */}
          <div className={`
            relative overflow-hidden rounded-xl border p-6 transition-all duration-500
            ${isEnraged 
              ? 'border-red-500/80 bg-gradient-to-b from-[#240b15] to-[#12060b] shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
              : 'border-purple-500/50 bg-gradient-to-b from-[#170a27] to-[#0c0617] shadow-[0_0_30px_rgba(168,85,247,0.25)]'}
          `}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono-tech font-bold uppercase">
                    RANK {selectedBoss.rank} MONARCH BOSS
                  </span>
                  {isEnraged && (
                    <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono-tech font-bold">
                      ENRAGED
                    </span>
                  )}
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-100 mt-1">
                  {selectedBoss.name}
                </h2>
                <div className="text-xs text-purple-300 font-mono-tech">{selectedBoss.title}</div>
              </div>

              <div className="text-right">
                <div className="font-mono-tech font-bold text-2xl text-purple-300">
                  {bossHp.toLocaleString()} / {selectedBoss.maxHp.toLocaleString()} HP
                </div>
                <div className="text-xs font-mono-tech text-slate-400">
                  {Math.round((bossHp / selectedBoss.maxHp) * 100)}% INTEGRITY
                </div>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-purple-500/40 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isEnraged ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500' : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400'}`}
                style={{ width: `${(bossHp / selectedBoss.maxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Victory & ARISE Extraction Ceremony */}
          {raidWon ? (
            <div className="rounded-xl border border-purple-500/60 bg-gradient-to-b from-[#180a2c] to-[#0c0517] p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.4)]">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-400 text-purple-300 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Crown className="w-10 h-10" />
              </div>

              <h2 className="font-monarch font-black text-3xl text-purple-200">
                MONARCH BOSS SLAIN!
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                {selectedBoss.name} has fallen before your cognitive superiority. The shadows gather around the fallen monarch's armor...
              </p>

              {/* Arise Extraction Button */}
              <div className="my-8">
                {hasExtracted ? (
                  <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/50 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 text-purple-300 font-heading font-bold text-lg">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      SHADOW EXTRACTED INTO ARMY!
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {selectedBoss.extractableShadow.name} has sworn eternal allegiance. Check the Shadow Army tab.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleAriseExtraction}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 hover:to-indigo-500 text-white font-monarch font-black text-xl tracking-widest uppercase shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all hover:scale-105 active:scale-95 border border-purple-400/50 animate-pulse"
                  >
                    👑 ARISE (일어나라)
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setInRaid(false)}
                  className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-sm tracking-wider uppercase"
                >
                  Return to Throne
                </button>
              </div>
            </div>
          ) : (
            /* Boss Raid High-Stakes Question Box */
            <div className="glass-panel rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">
                  TRIAL ENGAGEMENT #{currentQuestionIdx + 1}
                </span>
                <span className="text-xs font-mono-tech text-slate-400">
                  {currentQ.subject}
                </span>
              </div>

              <h3 className="font-heading font-bold text-lg text-slate-100">
                {currentQ.question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectOpt = idx === currentQ.correctIndex;

                  let btnStyle = 'bg-slate-900/80 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80 text-slate-200';
                  if (hasAnswered) {
                    if (isCorrectOpt) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                    } else if (isSelected) {
                      btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                    } else {
                      btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3.5 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono-tech text-xs text-slate-500 font-bold">
                          [{String.fromCharCode(65 + idx)}]
                        </span>
                        <span>{opt}</span>
                      </span>
                      {hasAnswered && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {hasAnswered && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400" />}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className={`mt-5 p-4 rounded-lg border ${isCorrect ? 'bg-purple-950/30 border-purple-500/40' : 'bg-red-950/30 border-red-500/40'}`}>
                  <div className="text-xs font-mono-tech font-bold uppercase mb-1 text-purple-300">
                    {isCorrect ? 'STRIKE LANDED' : 'COUNTERED BY BOSS'}
                  </div>
                  <p className="text-xs text-slate-300">{currentQ.explanation}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleNextTrial}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-heading font-bold text-xs uppercase tracking-wider"
                    >
                      Next Boss Trial →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
