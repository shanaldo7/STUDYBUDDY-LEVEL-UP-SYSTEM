import React, { useState } from 'react';
import { DungeonGate, HunterUser, QuizQuestion, CombatLog } from '../types/hunter';
import { 
  Swords, 
  ShieldAlert, 
  Zap, 
  Award, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Flame,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface DungeonBattleViewProps {
  user: HunterUser;
  gates: DungeonGate[];
  questions: QuizQuestion[];
  initialGate?: DungeonGate;
  onVictory: (gate: DungeonGate, xp: number, gold: number) => void;
  onTakeDamage: (amount: number) => void;
  onBack: () => void;
}

export const DungeonBattleView: React.FC<DungeonBattleViewProps> = ({
  user,
  gates,
  questions,
  initialGate,
  onVictory,
  onTakeDamage,
  onBack
}) => {
  const [selectedGate, setSelectedGate] = useState<DungeonGate>(initialGate || gates[1]);
  const [inBattle, setInBattle] = useState<boolean>(false);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState<number>(selectedGate.monsterHp);
  const [playerCurrentHp, setPlayerCurrentHp] = useState<number>(1000);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [combatLogs, setCombatLogs] = useState<CombatLog[]>([]);
  const [streakCombo, setStreakCombo] = useState<number>(0);
  const [battleWon, setBattleWon] = useState<boolean>(false);
  const [attackAnimation, setAttackAnimation] = useState<'slash' | 'crit' | 'hit' | null>(null);

  // Filter questions by gate subject or fallback
  const gateQuestions = questions.filter(
    q => q.subject.toLowerCase().includes(selectedGate.subject.toLowerCase().split(' ')[0])
  );
  const activeQuestions = gateQuestions.length > 0 ? gateQuestions : questions;
  const currentQ = activeQuestions[currentQuestionIndex % activeQuestions.length];

  const startRaid = (gate: DungeonGate) => {
    soundManager.playSfx('attack');
    setSelectedGate(gate);
    setMonsterCurrentHp(gate.monsterHp);
    setPlayerCurrentHp(1000);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setBattleWon(false);
    setStreakCombo(0);
    setCombatLogs([
      {
        id: 'log_start',
        timestamp: new Date().toLocaleTimeString(),
        message: `[DUNGEON ENTRY]: Breached ${gate.name} (Rank ${gate.rank}). ${gate.monsterName} has emerged!`,
        type: 'system'
      }
    ]);
    setInBattle(true);
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || battleWon) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const correct = idx === currentQ.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      const newCombo = streakCombo + 1;
      setStreakCombo(newCombo);
      const isCrit = newCombo >= 2 || Math.random() > 0.6;
      const baseDmg = 500 + Math.floor(user.stats.intelligence * 4.5);
      const finalDmg = isCrit ? Math.floor(baseDmg * 1.8) : baseDmg;

      if (isCrit) {
        soundManager.playSfx('critical');
        setAttackAnimation('crit');
      } else {
        soundManager.playSfx('attack');
        setAttackAnimation('slash');
      }

      const nextMonsterHp = Math.max(0, monsterCurrentHp - finalDmg);
      setMonsterCurrentHp(nextMonsterHp);

      setCombatLogs(prev => [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          message: `${isCrit ? 'CRITICAL STRIKE!' : 'Offensive Spell!'} Answer verified: Dealt [${finalDmg} DMG] to ${selectedGate.monsterName}.`,
          type: 'player-hit'
        },
        ...prev
      ]);

      if (nextMonsterHp <= 0) {
        soundManager.playSfx('victory');
        setBattleWon(true);
        onVictory(selectedGate, selectedGate.rewardXp, selectedGate.rewardGold);
        setCombatLogs(prev => [
          {
            id: `log_vic_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            message: `[DUNGEON CONQUERED]: ${selectedGate.monsterName} obliterated! Claimed +${selectedGate.rewardXp} XP and +${selectedGate.rewardGold} Gold!`,
            type: 'loot'
          },
          ...prev
        ]);
      }
    } else {
      soundManager.playSfx('damage');
      setAttackAnimation('hit');
      setStreakCombo(0);
      const monsterDamage = 180;
      const nextPlayerHp = Math.max(0, playerCurrentHp - monsterDamage);
      setPlayerCurrentHp(nextPlayerHp);
      onTakeDamage(monsterDamage);

      setCombatLogs(prev => [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          message: `[INCORRECT RECALL]: ${selectedGate.monsterName} retaliates with Shadow Claw for [${monsterDamage} DMG]!`,
          type: 'monster-hit'
        },
        ...prev
      ]);
    }

    setTimeout(() => {
      setAttackAnimation(null);
    }, 600);
  };

  const handleNextQuestion = () => {
    soundManager.playSfx('click');
    setHasAnswered(false);
    setSelectedOption(null);
    setCurrentQuestionIndex(prev => (prev + 1) % activeQuestions.length);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={inBattle ? () => setInBattle(false) : onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
              {inBattle ? 'DUNGEON COMBAT ACTIVE' : 'DIMENSIONAL GATE RADAR'}
            </span>
            <h1 className="font-monarch font-bold text-2xl text-slate-100">
              {inBattle ? selectedGate.name : 'DUNGEON EXPEDITIONS'}
            </h1>
          </div>
        </div>

        {inBattle && (
          <div className="flex items-center gap-4">
            {streakCombo > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-bounce font-mono-tech">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>COMBO x{streakCombo}</span>
              </div>
            )}
            <button
              onClick={() => setInBattle(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Retreat
            </button>
          </div>
        )}
      </div>

      {!inBattle ? (
        /* Gate Selection Screen */
        <div className="space-y-6">
          <p className="text-sm text-slate-300 max-w-3xl">
            Choose a dimensional gate to raid. Each gate tests your knowledge under combat conditions. 
            Answering correctly casts high-tier spells that deplete monster HP; inaccurate answers trigger enemy counter-attacks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gates.map((gate) => {
              const rankStyles: Record<string, { border: string; glow: string; text: string; bg: string }> = {
                E: { border: 'border-slate-700', glow: '', text: 'text-slate-400', bg: 'bg-slate-800/40' },
                D: { border: 'border-emerald-700/60', glow: '', text: 'text-emerald-400', bg: 'bg-emerald-950/30' },
                C: { border: 'border-cyan-500/40', glow: 'shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]', text: 'text-cyan-400', bg: 'bg-cyan-950/30' },
                B: { border: 'border-indigo-500/50', glow: 'shadow-[0_0_25px_-5px_rgba(99,102,241,0.25)]', text: 'text-indigo-400', bg: 'bg-indigo-950/30' },
                A: { border: 'border-purple-500/60', glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]', text: 'text-purple-400', bg: 'bg-purple-950/40' },
                S: { border: 'border-red-500/70', glow: 'shadow-[0_0_35px_-5px_rgba(239,68,68,0.35)]', text: 'text-red-400', bg: 'bg-red-950/40' }
              };

              const style = rankStyles[gate.rank] || rankStyles.E;

              return (
                <div
                  key={gate.id}
                  className={`
                    glass-panel rounded-xl p-6 border ${style.border} ${style.glow} 
                    flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 group
                  `}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded border text-xs font-monarch font-black tracking-wider ${style.text} ${style.bg} ${style.border}`}>
                        GATE {gate.rank}
                      </span>
                      <span className="text-xs font-mono-tech text-slate-400">
                        HP: {gate.monsterHp.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-xl text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {gate.name}
                    </h3>
                    <div className="text-xs text-cyan-400 font-mono-tech mt-1">{gate.subject}</div>
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">{gate.description}</p>

                    <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="text-slate-400">Gate Guardian:</div>
                      <div className="font-bold text-slate-200">{gate.monsterName} ({gate.monsterType})</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs font-mono-tech">
                      <span className="text-purple-300 font-bold">+{gate.rewardXp} XP</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className="text-amber-300 font-bold">+{gate.rewardGold} G</span>
                    </div>

                    <button
                      onClick={() => startRaid(gate)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Raid Gate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Battle Arena */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Combat Stage */}
          <div className="lg:col-span-2 space-y-5">
            {/* Monster Display & HP Gauge */}
            <div className={`
              relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-b from-[#170912] to-[#0d0714] p-6 
              transition-all duration-300 shadow-[0_0_30px_-5px_rgba(239,68,68,0.25)]
              ${attackAnimation === 'crit' ? 'ring-4 ring-amber-400/80 scale-[1.01]' : ''}
              ${attackAnimation === 'slash' ? 'ring-2 ring-cyan-400/60' : ''}
              ${attackAnimation === 'hit' ? 'animate-shake' : ''}
            `}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono-tech font-bold uppercase">
                    RANK {selectedGate.rank} MONSTER
                  </span>
                  <h2 className="font-heading font-black text-2xl text-slate-100 mt-1">
                    {selectedGate.monsterName}
                  </h2>
                  <div className="text-xs text-slate-400">Class: {selectedGate.monsterType} · Specialty: {selectedGate.subject}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono-tech font-bold text-xl text-red-400">
                    {monsterCurrentHp.toLocaleString()} / {selectedGate.maxHp.toLocaleString()} HP
                  </div>
                  <div className="text-[11px] font-mono-tech text-slate-400">
                    {Math.round((monsterCurrentHp / selectedGate.maxHp) * 100)}% HEALTH
                  </div>
                </div>
              </div>

              {/* Monster HP Bar */}
              <div className="h-3 w-full bg-slate-900/90 rounded-full overflow-hidden border border-red-500/40 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(monsterCurrentHp / selectedGate.maxHp) * 100}%` }}
                />
              </div>

              {/* Player Status In Battle */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tech">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold">{user.hunterName} (LV.{user.level})</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400">HP: {playerCurrentHp} / 1000</span>
                </div>
                <div className="text-cyan-300">
                  MANA: {user.mana} MP
                </div>
              </div>
            </div>

            {/* Battle Victory Modal Overlay */}
            {battleWon ? (
              <div className="rounded-xl border border-emerald-500/50 bg-gradient-to-b from-[#091b16] to-[#06120e] p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-monarch font-black text-2xl text-emerald-300">
                  DUNGEON GATE CLEARED!
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
                  {selectedGate.monsterName} has been eradicated. The dimensional rift stabilizes and rewards are transferred to your Hunter inventory.
                </p>

                <div className="flex items-center justify-center gap-6 my-6 font-mono-tech">
                  <div className="px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/40">
                    <div className="text-xs text-purple-300">XP GAINED</div>
                    <div className="text-xl font-bold text-purple-200">+{selectedGate.rewardXp} XP</div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-amber-950/50 border border-amber-500/40">
                    <div className="text-xs text-amber-300">GOLD ACQUIRED</div>
                    <div className="text-xl font-bold text-amber-200">+{selectedGate.rewardGold} G</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => startRaid(selectedGate)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-sm tracking-wider uppercase transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Raid Again
                  </button>
                  <button
                    onClick={() => setInBattle(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                  >
                    Return to Gates
                  </button>
                </div>
              </div>
            ) : (
              /* Question Box / Offensive Spell Selection */
              <div className="glass-panel rounded-xl p-6 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
                    SPELL CHANNELING TRIAL #{currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-mono-tech text-slate-400">
                    {currentQ.subject}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-slate-100 leading-snug">
                  {currentQ.question}
                </h3>

                {/* Answer Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOpt = idx === currentQ.correctIndex;
                    
                    let btnStyle = 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/80 text-slate-200';
                    if (hasAnswered) {
                      if (isCorrectOpt) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
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
                        className={`
                          p-3.5 rounded-lg border text-left text-sm font-medium transition-all duration-200 flex items-center justify-between
                          ${btnStyle}
                        `}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono-tech text-xs text-slate-500 font-bold">
                            [{String.fromCharCode(65 + idx)}]
                          </span>
                          <span>{opt}</span>
                        </span>
                        {hasAnswered && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {hasAnswered && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box After Answer */}
                {hasAnswered && (
                  <div className={`mt-5 p-4 rounded-lg border ${isCorrect ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/30 border-red-500/40'} transition-all`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono-tech font-bold uppercase ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCorrect ? '✓ ATTACK SUCCESSFUL - TACTICAL EXPLANATION' : '✗ SPELL COUNTERED - SOLUTION ANALYSIS'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentQ.explanation}
                    </p>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                      >
                        Next Combat Trial →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Combat Log Sidebar */}
          <div className="lg:col-span-1 glass-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> COMBAT FEED
              </span>
              <span className="text-[10px] font-mono-tech text-slate-500">REALTIME</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono-tech">
              {combatLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-8 italic">Awaiting first offensive spell...</div>
              ) : (
                combatLogs.map((log) => {
                  let badge = 'text-slate-400 border-slate-700';
                  if (log.type === 'player-hit') badge = 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30';
                  if (log.type === 'monster-hit') badge = 'text-red-400 border-red-500/40 bg-red-950/30';
                  if (log.type === 'loot') badge = 'text-amber-300 border-amber-500/40 bg-amber-950/30';
                  if (log.type === 'system') badge = 'text-purple-300 border-purple-500/40 bg-purple-950/30';

                  return (
                    <div key={log.id} className={`p-2 rounded border ${badge}`}>
                      <div className="text-[10px] text-slate-500 mb-0.5">{log.timestamp}</div>
                      <div className="leading-snug">{log.message}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
