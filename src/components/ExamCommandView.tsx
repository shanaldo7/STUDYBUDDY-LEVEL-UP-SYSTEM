import React, { useState } from 'react';
import { ExamMilestone, HunterUser } from '../types/hunter';
import { 
  Target, 
  Clock, 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ExamCommandViewProps {
  user: HunterUser;
  exams: ExamMilestone[];
  onToggleTopic: (examId: string, topicName: string) => void;
  onAddExam: (exam: Omit<ExamMilestone, 'id'>) => void;
}

export const ExamCommandView: React.FC<ExamCommandViewProps> = ({
  user,
  exams,
  onToggleTopic,
  onAddExam
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newTarget, setNewTarget] = useState(90);
  const [newNotes, setNewNotes] = useState('');
  const [newTopicStr, setNewTopicStr] = useState('');

  const calculateDaysRemaining = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const topics = newTopicStr
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .map(name => ({ name, completed: false }));

    onAddExam({
      title: newTitle,
      subject: newSubject,
      date: newDate,
      targetScore: newTarget,
      syllabusProgress: 0,
      notes: newNotes,
      topics: topics.length > 0 ? topics : [{ name: 'Core Foundations', completed: false }]
    });

    soundManager.playSfx('victory');
    setShowAddModal(false);
    setNewTitle('');
    setNewNotes('');
    setNewTopicStr('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            HIGH-STAKES ASSIGNMENT RADAR
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            EXAM COMMAND CENTER
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Deploy New Exam Target
        </button>
      </div>

      {/* Exam Milestones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exams.map((ex) => {
          const daysLeft = calculateDaysRemaining(ex.date);
          const completedTopics = ex.topics.filter(t => t.completed).length;
          const progressPercent = ex.topics.length > 0 ? Math.round((completedTopics / ex.topics.length) * 100) : ex.syllabusProgress;

          return (
            <div 
              key={ex.id}
              className="glass-panel rounded-xl p-6 border border-cyan-500/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech font-bold uppercase">
                    {ex.subject}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono-tech text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span><b>{daysLeft}</b> DAYS REMAINING</span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl text-slate-100 mt-2">
                  {ex.title}
                </h3>
                <div className="text-xs text-slate-400 font-mono-tech mt-0.5">Date: {ex.date} · Target Score: {ex.targetScore}%</div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-mono-tech text-slate-400 mb-1">
                    <span>SYLLABUS READINESS</span>
                    <span className="text-cyan-300 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Interactive Topics Checklist */}
                <div className="mt-5 space-y-2">
                  <span className="text-[11px] font-mono-tech text-slate-500 uppercase tracking-wider block">
                    Core Syllabus Checkpoints ({completedTopics}/{ex.topics.length}):
                  </span>
                  {ex.topics.map((t) => (
                    <div
                      key={t.name}
                      onClick={() => {
                        soundManager.playSfx('click');
                        onToggleTopic(ex.id, t.name);
                      }}
                      className={`
                        p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors
                        ${t.completed 
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'}
                      `}
                    >
                      <span>{t.name}</span>
                      {t.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {ex.notes && (
                  <p className="mt-4 text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
                    "{ex.notes}"
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono-tech text-slate-400">
                <span className="text-purple-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> High-Stakes Target
                </span>
                <span className="text-emerald-400">Mastery Index: Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Exam */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/40 max-w-md w-full">
            <h2 className="font-monarch font-bold text-xl text-slate-100 mb-4">
              DEPLOY NEW EXAM TARGET
            </h2>
            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Exam Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  placeholder="e.g. Distributed Systems Final"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-slate-400 block mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Score (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={newTarget}
                  onChange={e => setNewTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Syllabus Topics (One per line)</label>
                <textarea
                  value={newTopicStr}
                  onChange={e => setNewTopicStr(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Notes / Strategy</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  placeholder="Focus areas, key theorems..."
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
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
