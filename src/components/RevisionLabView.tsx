import React, { useState } from 'react';
import { Flashcard, HunterUser } from '../types/hunter';
import { 
  FlaskConical, 
  RotateCw, 
  Check, 
  Sparkles, 
  Plus, 
  BookOpen, 
  Layers,
  Award
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface RevisionLabViewProps {
  user: HunterUser;
  flashcards: Flashcard[];
  onAddCard: (card: Omit<Flashcard, 'id'>) => void;
  onGradeCard: (cardId: string, rating: 'hard' | 'good' | 'easy') => void;
}

export const RevisionLabView: React.FC<RevisionLabViewProps> = ({
  user,
  flashcards,
  onAddCard,
  onGradeCard
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New card state
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const currentCard = flashcards[currentIdx % (flashcards.length || 1)];

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            SPACED REPETITION SANCTUM
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            REVISION LAB & ACTIVE RECALL
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-tech text-cyan-300">
            Total In Deck: <b>{flashcards.length}</b> Cards
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Flashcard
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 max-w-3xl">
        Active recall strengthens neural pathways through spaced intervals. Test your recall without peeking, flip to verify, then assign an honest retention rating to calibrate the repetition algorithm.
      </p>

      {/* Main Flashcard Flip Arena */}
      {currentCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div 
            onClick={handleFlip}
            className={`
              relative min-h-[300px] rounded-2xl p-8 border cursor-pointer transition-all duration-300 flex flex-col justify-between
              ${isFlipped 
                ? 'bg-gradient-to-b from-[#140b28] to-[#0c061a] border-purple-500/60 shadow-[0_0_35px_-5px_rgba(168,85,247,0.35)]' 
                : 'bg-gradient-to-b from-[#0b1328] to-[#060c1c] border-cyan-500/50 shadow-[0_0_30px_-5px_rgba(6,182,212,0.25)]'}
            `}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-xs font-mono-tech text-cyan-300 uppercase">
                  TOPIC: {currentCard.subject}
                </span>
                <span className="text-xs font-mono-tech text-slate-400">
                  Card {currentIdx + 1} of {flashcards.length} · {isFlipped ? 'SOLUTION REVEALED' : 'CLICK TO FLIP'}
                </span>
              </div>

              {!isFlipped ? (
                <div className="py-6">
                  <div className="text-xs font-mono-tech text-cyan-400/80 uppercase tracking-wider mb-2">QUESTION / PROMPT:</div>
                  <h2 className="font-heading font-bold text-2xl text-slate-100 leading-snug">
                    {currentCard.question}
                  </h2>
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-xs font-mono-tech text-purple-400 uppercase tracking-wider mb-2">VERIFIED ANSWER:</div>
                  <div className="font-heading font-medium text-lg text-purple-100 leading-relaxed">
                    {currentCard.answer}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono-tech">
              <span>Reviewed: {currentCard.reviewsCount} times</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <RotateCw className="w-3.5 h-3.5" /> Tap card to flip
              </span>
            </div>
          </div>

          {/* Retention Rating Bar */}
          {isFlipped && (
            <div className="glass-panel rounded-xl p-4 border border-cyan-500/30 flex items-center justify-around gap-3">
              <button
                onClick={() => handleRate('hard')}
                className="flex-1 py-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs font-bold font-heading uppercase tracking-wider transition-all"
              >
                Hard (1 Day)
              </button>
              <button
                onClick={() => handleRate('good')}
                className="flex-1 py-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold font-heading uppercase tracking-wider transition-all"
              >
                Good (3 Days)
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="flex-1 py-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold font-heading uppercase tracking-wider transition-all"
              >
                Easy (7 Days)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No flashcards in active deck.</div>
      )}

      {/* Modal: Add Flashcard */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/40 max-w-md w-full">
            <h2 className="font-monarch font-bold text-xl text-slate-100 mb-4">
              ADD REVISION FLASHCARD
            </h2>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
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
                <label className="text-slate-400 block mb-1">Question / Prompt</label>
                <textarea
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  placeholder="e.g. What is Snell's Law?"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Verified Answer</label>
                <textarea
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  placeholder="e.g. n1 * sin(theta1) = n2 * sin(theta2)"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
