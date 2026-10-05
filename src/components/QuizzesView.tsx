import React, { useState } from 'react';
import { QuizQuestion, HunterUser } from '../types/hunter';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RotateCcw, 
  Award, 
  Sparkles,
  Filter
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface QuizzesViewProps {
  user: HunterUser;
  questions: QuizQuestion[];
  onAddQuestion: (q: Omit<QuizQuestion, 'id'>) => void;
  onEarnXp: (amount: number) => void;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  user,
  questions,
  onAddQuestion,
  onEarnXp
}) => {
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

  const subjects = ['All', ...Array.from(new Set(questions.map(q => q.subject)))];

  const filteredQuestions = selectedSubject === 'All' 
    ? questions 
    : questions.filter(q => q.subject === selectedSubject);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            ACADEMIC DRILL ARCHIVES
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            KNOWLEDGE TRIALS & QUIZZES
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-tech text-cyan-300">
            Session Score: <b>{sessionScore}</b> Correct
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Forge Question
          </button>
        </div>
      </div>

      {/* Subject Filter Bar */}
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
              px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors
              ${selectedSubject === sub 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'}
            `}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Main Quiz Card */}
      {activeQ ? (
        <div className="glass-panel rounded-xl p-6 border border-cyan-500/30 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech font-bold uppercase">
              TRIAL #{currentIdx + 1} OF {filteredQuestions.length}
            </span>
            <span className="text-xs font-mono-tech text-slate-400">
              Difficulty: Rank {activeQ.difficulty}
            </span>
          </div>

          <h2 className="font-heading font-bold text-xl text-slate-100 leading-snug">
            {activeQ.question}
          </h2>

          <div className="space-y-3 mt-6">
            {activeQ.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === activeQ.correctIndex;

              let btnStyle = 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-200';
              if (submitted) {
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
                  disabled={submitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono-tech text-xs text-slate-500 font-bold">
                      [{String.fromCharCode(65 + idx)}]
                    </span>
                    <span>{opt}</span>
                  </span>
                  {submitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {submitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-400" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`mt-6 p-4 rounded-lg border ${selectedAnswer === activeQ.correctIndex ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-red-950/30 border-red-500/40'}`}>
              <div className="text-xs font-mono-tech font-bold uppercase mb-1 text-cyan-300">
                SOLUTION & DERIVATION ANALYSIS:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeQ.explanation}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider"
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
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/40 max-w-lg w-full">
            <h2 className="font-monarch font-bold text-xl text-slate-100 mb-4">
              FORGE NEW STUDY QUESTION
            </h2>
            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <input 
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Question Prompt</label>
                <textarea 
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
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
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-slate-400 block mb-1">Correct Option</label>
                <select 
                  value={newCorrectIdx}
                  onChange={e => setNewCorrectIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
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
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-600 text-white font-bold"
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
