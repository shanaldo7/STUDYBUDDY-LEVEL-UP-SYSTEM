import React, { useState } from 'react';
import { Flashcard, HunterUser, Syllabus } from '../types/hunter';
import { 
  FlaskConical, 
  RotateCw, 
  Check, 
  Sparkles, 
  Plus, 
  BookOpen, 
  Layers,
  Award,
  AlertTriangle,
  Target
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { getWeakTopics } from '../utils/progressCalculator';

interface RevisionLabViewProps {
  user: HunterUser;
  flashcards: Flashcard[];
  activeSyllabus?: Syllabus | null;
  onAddCard: (card: Omit<Flashcard, 'id'>) => void;
  onGradeCard: (cardId: string, rating: 'hard' | 'good' | 'easy') => void;
  onStartQuizOnTopic?: (subjectName: string, topicName: string) => void;
}

export const RevisionLabView: React.FC<RevisionLabViewProps> = ({
  user,
  flashcards,
  activeSyllabus,
  onAddCard,
  onGradeCard,
  onStartQuizOnTopic
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New card state
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const currentCard = flashcards[currentIdx % (flashcards.length || 1)];
  const weakTopics = getWeakTopics(activeSyllabus || null).slice(0, 5);

  const handleFlip = () => {
    soundManager.playSfx('click');
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    soundManager.playSfx('critical');
    onGradeCard(currentCard.id, rating);
    setIsFlipped(false);
    setCurrentIdx(prev => (prev + 1) % flashcards.length);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    onAddCard({
      subject: newSubject,
      question: newQuestion,
      answer: newAnswer,
      difficulty: 2,
      nextReview: 'Today',
      reviewsCount: 0
    });

    soundManager.playSfx('victory');
    setShowAddModal(false);
    setNewQuestion('');
    setNewAnswer('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            SPACED REPETITION SANCTUM
          </span>
          <h1 className="font-rajdhani font-black text-3xl text-slate-100">
            REVISION LAB &amp; ACTIVE RECALL
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
            Total In Deck: <b>{flashcards.length}</b> Cards
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Flashcard
          </button>
        </div>
      </div>

      {/* Priority Weak Topics from Syllabus */}
      {weakTopics.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Priority Weak Concept Areas (From Your Active Syllabus)
            </div>
            <span className="text-[11px] font-mono text-slate-400">Lowest mastery topics requiring reinforcement</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {weakTopics.map(w => (
              <div 
                key={w.topicId}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{w.topicName}</div>
                  <div className="text-[10px] font-mono text-cyan-400">{w.subjectName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">{w.progressPercentage}%</span>
                  {onStartQuizOnTopic && (
                    <button
                      onClick={() => onStartQuizOnTopic(w.subjectName, w.topicName)}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer"
                      title="Drill this topic"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Flashcard Flip Arena */}
      {currentCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div 
            onClick={handleFlip}
            className={`
              relative min-h-[300px] rounded-2xl p-8 border cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-2xl
              ${isFlipped 
                ? 'bg-gradient-to-b from-[#140b28] to-[#0c061a] border-purple-500/60' 
                : 'bg-gradient-to-b from-[#0b1328] to-[#060c1c] border-cyan-500/50'}
            `}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-xs font-mono text-cyan-300 uppercase">
                  TOPIC: {currentCard.subject}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Card {currentIdx + 1} of {flashcards.length} · {isFlipped ? 'SOLUTION REVEALED' : 'CLICK TO FLIP'}
                </span>
              </div>

              {!isFlipped ? (
                <div className="py-6">
                  <div className="text-xs font-mono text-cyan-400/80 uppercase tracking-wider mb-2">QUESTION / PROMPT:</div>
                  <h2 className="font-rajdhani font-black text-2xl text-slate-100 leading-snug">
                    {currentCard.question}
                  </h2>
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">VERIFIED ANSWER:</div>
                  <div className="font-sans font-medium text-base text-purple-100 leading-relaxed">
                    {currentCard.answer}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Next interval: {currentCard.nextReview}</span>
              <span>Reviews: {currentCard.reviewsCount}</span>
            </div>
          </div>

          {/* Rating Controls */}
          {isFlipped && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleRate('hard')}
                className="px-5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-rajdhani font-bold text-sm tracking-wide transition cursor-pointer"
              >
                Hard (Review Soon)
              </button>
              <button
                onClick={() => handleRate('good')}
                className="px-5 py-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-blue-200 font-rajdhani font-bold text-sm tracking-wide transition cursor-pointer"
              >
                Good (1 Day)
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="px-5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-rajdhani font-bold text-sm tracking-wide transition cursor-pointer"
              >
                Easy (3 Days)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 italic">No flashcards in deck. Add one above!</div>
      )}

      {/* Modal: Add Card */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl bg-slate-900 p-6 border border-cyan-500/40 max-w-md w-full shadow-2xl">
            <h2 className="font-rajdhani font-black text-xl text-slate-100 mb-4">
              ADD REVISION FLASHCARD
            </h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject / Topic</label>
                <input 
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Concept Question / Term</label>
                <textarea 
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Answer / Derivation</label>
                <textarea 
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans"
                  required
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
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
