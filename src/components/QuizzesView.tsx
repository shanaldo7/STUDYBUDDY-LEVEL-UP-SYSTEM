import React, { useState, useEffect } from 'react';
import { QuizQuestion, HunterUser, Syllabus, AIProviderConfig } from '../types/hunter';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RotateCcw, 
  Award, 
  Sparkles, 
  Filter, 
  Layers, 
  Target,
  Loader2
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { generateTopicQuizQuestions } from '../utils/syllabusAI';

interface QuizzesViewProps {
  user: HunterUser;
  questions: QuizQuestion[];
  activeSyllabus?: Syllabus | null;
  initialTopicSelection?: { subject: string; unit?: string; topic?: string };
  onAddQuestion: (q: Omit<QuizQuestion, 'id'>) => void;
  onEarnXp: (amount: number) => void;
  onRecordTopicActivity?: (subjectName: string, topicName: string, quizPassed: boolean) => void;
  aiConfig?: AIProviderConfig;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  user,
  questions,
  activeSyllabus,
  initialTopicSelection,
  onAddQuestion,
  onEarnXp,
  onRecordTopicActivity,
  aiConfig
}) => {
  // Topic Drill Selection
  const [drillSubject, setDrillSubject] = useState<string>(initialTopicSelection?.subject || '');
  const [drillUnit, setDrillUnit] = useState<string>(initialTopicSelection?.unit || '');
  const [drillTopic, setDrillTopic] = useState<string>(initialTopicSelection?.topic || '');
  const [isGeneratingTopicQuestions, setIsGeneratingTopicQuestions] = useState<boolean>(false);
  const [activeDrillQuestions, setActiveDrillQuestions] = useState<QuizQuestion[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New question form state
  const [newSubject, setNewSubject] = useState('Computer Science & Logic');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');

  // Sync initial selection if provided
  useEffect(() => {
    if (initialTopicSelection?.subject) {
      setDrillSubject(initialTopicSelection.subject);
      setDrillUnit(initialTopicSelection.unit || '');
      setDrillTopic(initialTopicSelection.topic || '');
      handleGenerateTopicDrill(
        initialTopicSelection.subject,
        initialTopicSelection.unit || 'Unit 1',
        initialTopicSelection.topic || 'Core Concept'
      );
    }
  }, [initialTopicSelection]);

  const syllabusSubjects = activeSyllabus?.subjects || [];
  const selectedSubjectObj = syllabusSubjects.find(s => s.name === drillSubject);
  const availableUnits = selectedSubjectObj?.units || [];
  const selectedUnitObj = availableUnits.find(u => u.name === drillUnit);
  const availableTopics = selectedUnitObj?.topics || [];

  const handleGenerateTopicDrill = async (sub: string, unit: string, top: string) => {
    if (!sub || !top) return;
    try {
      setIsGeneratingTopicQuestions(true);
      soundManager.playSfx('levelup');
      const generated = await generateTopicQuizQuestions(sub, unit, top, 4, aiConfig);
      setActiveDrillQuestions(generated);
      setCurrentIdx(0);
      setSubmitted(false);
      setSelectedAnswer(null);
      soundManager.playSfx('victory');
    } catch (err) {
      console.error('Failed to generate topic questions:', err);
    } finally {
      setIsGeneratingTopicQuestions(false);
    }
  };

  const poolQuestions = activeDrillQuestions.length > 0 ? activeDrillQuestions : questions;
  const subjects = ['All', ...Array.from(new Set(poolQuestions.map(q => q.subject)))];

  const filteredQuestions = activeDrillQuestions.length > 0
    ? activeDrillQuestions
    : (selectedSubject === 'All' ? poolQuestions : poolQuestions.filter(q => q.subject === selectedSubject));

  const activeQ = filteredQuestions[currentIdx % (filteredQuestions.length || 1)];

  const handleSelectOption = (idx: number) => {
    if (submitted || !activeQ) return;
    setSelectedAnswer(idx);
    setSubmitted(true);

    const isCorrect = idx === activeQ.correctIndex;
    if (isCorrect) {
      soundManager.playSfx('critical');
      setSessionScore(prev => prev + 1);
      onEarnXp(120);
    } else {
      soundManager.playSfx('damage');
    }

    // Record topic progress if topic is active
    if (drillTopic && onRecordTopicActivity) {
      onRecordTopicActivity(drillSubject || activeQ.subject, drillTopic, isCorrect);
    }
  };

  const handleNext = () => {
    soundManager.playSfx('click');
    setSubmitted(false);
    setSelectedAnswer(null);
    setCurrentIdx(prev => (prev + 1) % filteredQuestions.length);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || newOptions.some(o => !o.trim())) return;

    onAddQuestion({
      subject: newSubject,
      question: newQuestion,
      options: newOptions,
      correctIndex: newCorrectIdx,
      explanation: newExplanation || 'Direct concept derivation.',
      difficulty: 'C'
    });

    soundManager.playSfx('victory');
    setShowAddModal(false);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setNewExplanation('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            ACADEMIC DRILL ARCHIVES
          </span>
          <h1 className="font-rajdhani font-black text-3xl text-slate-100">
            KNOWLEDGE TRIALS &amp; QUIZZES
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
            Session Score: <b>{sessionScore}</b> Correct
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-900/40 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Forge Question
          </button>
        </div>
      </div>

      {/* Syllabus Topic Drill Selector (Grounding to User's Syllabus) */}
      {activeSyllabus && (
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
            <Target className="w-4 h-4 text-indigo-400" />
            Syllabus-Grounded Topic Drill Generator ({activeSyllabus.program} — {activeSyllabus.semester})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Subject Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Subject</label>
              <select
                value={drillSubject}
                onChange={(e) => {
                  setDrillSubject(e.target.value);
                  setDrillUnit('');
                  setDrillTopic('');
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
              >
                <option value="">Select Subject...</option>
                {syllabusSubjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.progressPercentage || 0}%)</option>
                ))}
              </select>
            </div>

            {/* Unit Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Unit / Module</label>
              <select
                disabled={!drillSubject}
                value={drillUnit}
                onChange={(e) => {
                  setDrillUnit(e.target.value);
                  setDrillTopic('');
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
              >
                <option value="">Select Unit...</option>
                {availableUnits.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Topic Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Topic</label>
              <select
                disabled={!drillUnit}
                value={drillTopic}
                onChange={(e) => setDrillTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
              >
                <option value="">Select Topic...</option>
                {availableTopics.map(t => (
                  <option key={t.id} value={t.name}>{t.name} ({t.progress?.progressPercentage || 0}%)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs font-mono text-slate-400">
              {drillTopic ? `Selected Topic: ${drillTopic}` : 'Choose a topic to generate tailored mastery questions.'}
            </div>
            <button
              disabled={!drillTopic || isGeneratingTopicQuestions}
              onClick={() => handleGenerateTopicDrill(drillSubject, drillUnit, drillTopic)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-rajdhani font-bold text-xs tracking-wide shadow-lg shadow-indigo-950 transition active:scale-95 cursor-pointer"
            >
              {isGeneratingTopicQuestions ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Forging Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Topic Quiz Drill
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Drill Badge if loaded */}
      {activeDrillQuestions.length > 0 && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Active Topic Drill: <b>{drillSubject}</b> → <b>{drillTopic}</b></span>
          </div>
          <button
            onClick={() => {
              setActiveDrillQuestions([]);
              setDrillTopic('');
            }}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Clear Topic Drill
          </button>
        </div>
      )}

      {/* Subject Filter Bar (for standard bank) */}
      {activeDrillQuestions.length === 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubject(sub);
                setCurrentIdx(0);
                setSubmitted(false);
                setSelectedAnswer(null);
              }}
              className={`
                px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer
                ${selectedSubject === sub 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'}
              `}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Main Quiz Card */}
      {activeQ ? (
        <div className="rounded-2xl p-6 md:p-8 bg-slate-900/80 border border-cyan-500/30 max-w-3xl mx-auto shadow-2xl shadow-cyan-950/30 space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase">
              TRIAL #{currentIdx + 1} OF {filteredQuestions.length}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Difficulty: Rank {activeQ.difficulty}
            </span>
          </div>

          <h2 className="font-rajdhani font-black text-2xl text-slate-100 leading-snug">
            {activeQ.question}
          </h2>

          <div className="space-y-3">
            {activeQ.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === activeQ.correctIndex;

              let btnStyle = 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-200';
              if (submitted) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                } else if (isSelected) {
                  btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                } else {
                  btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500 font-bold">
                      [{String.fromCharCode(65 + idx)}]
                    </span>
                    <span className="font-sans">{opt}</span>
                  </span>
                  {submitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {submitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`p-4 rounded-xl border ${selectedAnswer === activeQ.correctIndex ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/30 border-red-500/40'}`}>
              <div className="text-xs font-mono font-bold uppercase mb-1 text-cyan-300">
                SOLUTION &amp; DERIVATION ANALYSIS:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeQ.explanation}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  Next Trial Question →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 italic">No questions found for this subject filter.</div>
      )}

      {/* Modal: Forge Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl bg-slate-900 p-6 border border-cyan-500/40 max-w-lg w-full shadow-2xl">
            <h2 className="font-rajdhani font-black text-xl text-slate-100 mb-4">
              FORGE NEW STUDY QUESTION
            </h2>
            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <input 
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Question Prompt</label>
                <textarea 
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                  required
                />
              </div>
              {newOptions.map((opt, i) => (
                <div key={i}>
                  <label className="text-slate-400 block mb-1">Option [{String.fromCharCode(65 + i)}]</label>
                  <input 
                    value={opt}
                    onChange={e => {
                      const updated = [...newOptions];
                      updated[i] = e.target.value;
                      setNewOptions(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-slate-400 block mb-1">Correct Option</label>
                <select 
                  value={newCorrectIdx}
                  onChange={e => setNewCorrectIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                >
                  <option value={0}>A</option>
                  <option value={1}>B</option>
                  <option value={2}>C</option>
                  <option value={3}>D</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Explanation</label>
                <textarea 
                  value={newExplanation}
                  onChange={e => setNewExplanation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-rajdhani font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-rajdhani font-bold cursor-pointer"
                >
                  Forge Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
