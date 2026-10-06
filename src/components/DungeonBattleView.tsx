import React, { useState, useEffect } from 'react';
import { DungeonGate, HunterUser, QuizQuestion, CombatLog, Syllabus, AIProviderConfig } from '../types/hunter';
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
  Sparkles,
  Layers,
  Target,
  Loader2
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { generateTopicQuizQuestions } from '../utils/syllabusAI';
import { normalizeHunterName } from '../utils/hunterIdentity';

interface DungeonBattleViewProps {
  user: HunterUser;
  gates: DungeonGate[];
  questions: QuizQuestion[];
  initialGate?: DungeonGate;
  activeSyllabus?: Syllabus | null;
  initialTopicSelection?: { subject: string; unit?: string; topic?: string };
  onVictory: (gate: DungeonGate, xp: number, gold: number) => void;
  onTakeDamage: (amount: number) => void;
  onRecordTopicActivity?: (subjectName: string, topicName: string, activity: { dungeonCleared?: boolean; quizPassed?: boolean }) => void;
  onBack: () => void;
  aiConfig?: AIProviderConfig;
}

export const DungeonBattleView: React.FC<DungeonBattleViewProps> = ({
  user,
  gates,
  questions,
  initialGate,
  activeSyllabus,
  initialTopicSelection,
  onVictory,
  onTakeDamage,
  onRecordTopicActivity,
  onBack,
  aiConfig
}) => {
  // Topic Selector for Syllabus Gates
  const [topicSubject, setTopicSubject] = useState<string>(initialTopicSelection?.subject || '');
  const [topicUnit, setTopicUnit] = useState<string>(initialTopicSelection?.unit || '');
  const [topicName, setTopicName] = useState<string>(initialTopicSelection?.topic || '');
  const [isForgingGate, setIsForgingGate] = useState<boolean>(false);
  const [customGateQuestions, setCustomGateQuestions] = useState<QuizQuestion[]>([]);

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

  // Sync initial selection
  useEffect(() => {
    if (initialTopicSelection?.subject && initialTopicSelection.topic) {
      setTopicSubject(initialTopicSelection.subject);
      setTopicUnit(initialTopicSelection.unit || '');
      setTopicName(initialTopicSelection.topic);
      handleSpawnSyllabusGate(
        initialTopicSelection.subject,
        initialTopicSelection.unit || 'Unit 1',
        initialTopicSelection.topic
      );
    }
  }, [initialTopicSelection]);

  const syllabusSubjects = activeSyllabus?.subjects || [];
  const selectedSubjectObj = syllabusSubjects.find(s => s.name === topicSubject);
  const availableUnits = selectedSubjectObj?.units || [];
  const selectedUnitObj = availableUnits.find(u => u.name === topicUnit);
  const availableTopics = selectedUnitObj?.topics || [];

  const handleSpawnSyllabusGate = async (sub: string, unit: string, topic: string) => {
    if (!sub || !topic) return;
    try {
      setIsForgingGate(true);
      soundManager.playSfx('levelup');

      const customGate: DungeonGate = {
        id: `syl_gate_${Date.now()}`,
        name: `Gate of ${topic}`,
        rank: 'C',
        subject: `${sub} · ${topic}`,
        description: `Dimensional distortion centered on ${topic}. Defeat the guardian to anchor concept mastery.`,
        monsterName: `${topic.split(' ')[0]} Golem`,
        monsterHp: 2000,
        maxHp: 2000,
        monsterType: 'Cognitive Construct',
        rewardXp: 250,
        rewardGold: 150,
        color: 'border-cyan-500',
        requiredLevel: 1
      };

      const generated = await generateTopicQuizQuestions(sub, unit, topic, 4, aiConfig);
      setCustomGateQuestions(generated);
      setSelectedGate(customGate);
      startRaid(customGate, generated);
    } catch (err) {
      console.error('Failed to spawn syllabus gate:', err);
    } finally {
      setIsForgingGate(false);
    }
  };

  // Filter questions by gate subject or custom questions
  const activeQuestions = customGateQuestions.length > 0 
    ? customGateQuestions 
    : (questions.filter(q => q.subject.toLowerCase().includes(selectedGate.subject.toLowerCase().split(' ')[0])).length > 0
        ? questions.filter(q => q.subject.toLowerCase().includes(selectedGate.subject.toLowerCase().split(' ')[0]))
        : questions);

  const currentQ = activeQuestions[currentQuestionIndex % activeQuestions.length];

  const startRaid = (gate: DungeonGate, overrideQuestions?: QuizQuestion[]) => {
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

        if (topicName && onRecordTopicActivity) {
          onRecordTopicActivity(topicSubject, topicName, { dungeonCleared: true, quizPassed: true });
        }

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
  };

  const handleNextTurn = () => {
    soundManager.playSfx('click');
    setHasAnswered(false);
    setSelectedOption(null);
    setAttackAnimation(null);
    setCurrentQuestionIndex(prev => (prev + 1) % activeQuestions.length);
  };

  const handleLeaveDungeon = () => {
    soundManager.playSfx('click');
    setInBattle(false);
    setBattleWon(false);
    setCustomGateQuestions([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            DIMENSIONAL COMBAT PROTOCOL
          </span>
          <h1 className="font-rajdhani font-black text-3xl text-slate-100">
            DUNGEON GATES &amp; COMBAT ARENA
          </h1>
        </div>

        {inBattle && (
          <button
            onClick={handleLeaveDungeon}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-rajdhani font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Retreat from Gate
          </button>
        )}
      </div>

      {!inBattle ? (
        <div className="space-y-6">
          {/* Syllabus Gate Custom Launcher */}
          {activeSyllabus && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900 border border-red-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-300 font-bold">
                <Swords className="w-4 h-4 text-red-400" />
                Spawn Topic Dungeon Gate ({activeSyllabus.program} — {activeSyllabus.semester})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Subject</label>
                  <select
                    value={topicSubject}
                    onChange={(e) => {
                      setTopicSubject(e.target.value);
                      setTopicUnit('');
                      setTopicName('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    <option value="">Select Subject...</option>
                    {syllabusSubjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.progressPercentage || 0}%)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Unit / Module</label>
                  <select
                    disabled={!topicSubject}
                    value={topicUnit}
                    onChange={(e) => {
                      setTopicUnit(e.target.value);
                      setTopicName('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    <option value="">Select Unit...</option>
                    {availableUnits.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Topic</label>
                  <select
                    disabled={!topicUnit}
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    <option value="">Select Topic...</option>
                    {availableTopics.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.progress?.progressPercentage || 0}%)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono text-slate-400">
                  {topicName ? `Target Topic: ${topicName}` : 'Select a syllabus topic to initiate combat raid.'}
                </span>
                <button
                  disabled={!topicName || isForgingGate}
                  onClick={() => handleSpawnSyllabusGate(topicSubject, topicUnit, topicName)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-rajdhani font-black text-xs tracking-wide shadow-lg shadow-red-950 transition active:scale-95 cursor-pointer"
                >
                  {isForgingGate ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Opening Dimensional Portal...
                    </>
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      Open Syllabus Gate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Standard Gates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gates.map((gate) => {
              const isLocked = user.level < gate.requiredLevel;
              return (
                <div
                  key={gate.id}
                  className={`rounded-2xl p-6 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 flex flex-col justify-between transition shadow-xl relative ${
                    isLocked ? 'opacity-60 bg-slate-950' : 'hover:scale-[1.02]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full border text-xs font-rajdhani font-black text-cyan-300 bg-cyan-950/60 border-cyan-500/40">
                        GATE {gate.rank}
                      </span>
                      {isLocked ? (
                        <span className="text-[10px] font-mono text-rose-400 font-bold">
                          🔒 LV.{gate.requiredLevel} REQUIRED
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-400">
                          HP: {gate.monsterHp.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h3 className="font-rajdhani font-black text-xl text-white">
                      {gate.name}
                    </h3>
                    <div className="text-xs text-cyan-400 font-mono mt-0.5">{gate.subject}</div>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2">{gate.description}</p>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div className="text-slate-400 text-[10px] uppercase font-mono">Gate Guardian:</div>
                      <div className="font-bold text-slate-200">{gate.monsterName} ({gate.monsterType})</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs font-mono">
                      <span className="text-purple-300 font-bold">+{gate.rewardXp} XP</span>
                      <span className="text-slate-600 mx-1.5">·</span>
                      <span className="text-amber-300 font-bold">+{gate.rewardGold} G</span>
                    </div>

                    <button
                      disabled={isLocked}
                      onClick={() => startRaid(gate)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-rajdhani font-black text-xs uppercase tracking-wider transition ${
                        isLocked 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950 cursor-pointer'
                      }`}
                    >
                      <Swords className="w-3.5 h-3.5" />
                      {isLocked ? `Locked (Lv.${gate.requiredLevel})` : 'Raid Gate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Battle Combat Arena */
        <div className="space-y-6">
          {/* Monster & Player Health Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Status */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-black text-base text-cyan-300">
                  {normalizeHunterName(user.hunterName)} (Lv.{user.level})
                </span>
                <span className="font-mono text-xs text-slate-400">{playerCurrentHp} / 1000 HP</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${Math.max(0, (playerCurrentHp / 1000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Monster Status */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-red-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-rajdhani font-black text-base text-red-300">
                  {selectedGate.monsterName}
                </span>
                <span className="font-mono text-xs text-slate-400">{monsterCurrentHp} / {selectedGate.monsterHp} HP</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                  style={{ width: `${Math.max(0, (monsterCurrentHp / selectedGate.monsterHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Combat Question Card */}
          {!battleWon ? (
            <div className="rounded-2xl p-6 md:p-8 bg-slate-900/90 border border-cyan-500/40 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold">
                  SPELL CASTING TRIAL #{currentQuestionIndex + 1}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Streak: <b className="text-cyan-400">{streakCombo}x Combo</b>
                </span>
              </div>

              <h2 className="font-rajdhani font-black text-2xl text-slate-100">
                {currentQ?.question}
              </h2>

              <div className="space-y-3">
                {(currentQ?.options || []).map((opt, idx) => {
                  const isSel = selectedOption === idx;
                  const isCor = idx === currentQ.correctIndex;
                  let style = 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-200';
                  if (hasAnswered) {
                    if (isCor) style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                    else if (isSel) style = 'bg-red-950/80 border-red-500 text-red-200';
                    else style = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-500 font-bold">[{String.fromCharCode(65 + idx)}]</span>
                        <span className="font-sans">{opt}</span>
                      </span>
                      {hasAnswered && isCor && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {hasAnswered && isSel && !isCor && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextTurn}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-black text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cast Next Spell →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-slate-900 border border-cyan-500/50 text-center space-y-4 shadow-2xl">
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
              <h2 className="text-3xl font-black font-rajdhani text-white">
                DUNGEON GATE CLEARED!
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                The dimensional guardian has been vanquished. Concept mastery recorded and rewards credited.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
                <span className="text-purple-400">+{selectedGate.rewardXp} XP</span>
                <span className="text-amber-400">+{selectedGate.rewardGold} Gold</span>
              </div>
              <button
                onClick={handleLeaveDungeon}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-rajdhani font-black text-sm tracking-wide shadow-xl cursor-pointer"
              >
                Return to Command Deck
              </button>
            </div>
          )}

          {/* Combat Logs */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
            <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Combat Log Feed:</div>
            {combatLogs.map(log => (
              <div key={log.id} className="text-slate-400">
                <span className="text-slate-600">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
