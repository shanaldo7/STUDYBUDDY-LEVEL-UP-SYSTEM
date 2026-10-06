import React, { useState, useEffect } from 'react';
import { HunterUser, Syllabus } from '../types/hunter';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Brain, 
  Flame, 
  CheckCircle,
  Radio,
  BookOpen
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface FocusRoomViewProps {
  user: HunterUser;
  activeSyllabus?: Syllabus | null;
  initialTopicSelection?: { subject: string; topic?: string };
  onCompleteSession: (minutes: number, xp: number) => void;
  onRecordTopicActivity?: (subjectName: string, topicName: string, activity: { studyMinutes: number }) => void;
}

export const FocusRoomView: React.FC<FocusRoomViewProps> = ({
  user,
  activeSyllabus,
  initialTopicSelection,
  onCompleteSession,
  onRecordTopicActivity
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialTopicSelection?.subject || '');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicSelection?.topic || '');

  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundPreset, setSoundPreset] = useState<'off' | 'rain' | 'void' | 'binaural'>('binaural');
  const [volume, setVolume] = useState<number>(0.3);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(2);

  // Sync initial selection
  useEffect(() => {
    if (initialTopicSelection?.subject) {
      setSelectedSubject(initialTopicSelection.subject);
      if (initialTopicSelection.topic) setSelectedTopic(initialTopicSelection.topic);
    }
  }, [initialTopicSelection]);

  const syllabusSubjects = activeSyllabus?.subjects || [];
  const currentSubObj = syllabusSubjects.find(s => s.name === selectedSubject);
  const availableTopics = currentSubObj?.units.flatMap(u => u.topics) || [];

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isActive) {
      setIsActive(false);
      soundManager.playSfx('levelup');
      soundManager.stopAmbient();
      const mins = Math.round(totalSeconds / 60);
      onCompleteSession(mins, mins * 6);
      setSessionsCompletedToday(prev => prev + 1);

      if (selectedTopic && onRecordTopicActivity) {
        onRecordTopicActivity(selectedSubject, selectedTopic, { studyMinutes: mins });
      }

      setRemainingSeconds(totalSeconds);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, remainingSeconds, totalSeconds, onCompleteSession, selectedTopic, selectedSubject, onRecordTopicActivity]);

  const handleStartTimer = () => {
    soundManager.playSfx('click');
    setIsActive(true);
    if (soundPreset !== 'off') {
      soundManager.startAmbient(soundPreset, volume);
    }
  };

  const handlePauseTimer = () => {
    soundManager.playSfx('click');
    setIsActive(false);
    soundManager.stopAmbient();
  };

  const handleResetTimer = () => {
    soundManager.playSfx('click');
    setIsActive(false);
    soundManager.stopAmbient();
    setRemainingSeconds(totalSeconds);
  };

  const handleSelectPresetTime = (mins: number) => {
    soundManager.playSfx('click');
    setIsActive(false);
    soundManager.stopAmbient();
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
  };

  const handleSoundChange = (preset: 'off' | 'rain' | 'void' | 'binaural') => {
    setSoundPreset(preset);
    if (preset === 'off') {
      soundManager.stopAmbient();
    } else if (isActive) {
      soundManager.startAmbient(preset, volume);
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (isActive && soundPreset !== 'off') {
      soundManager.startAmbient(soundPreset, v);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            DEEP WORK ISOLATION PROTOCOL
          </span>
          <h1 className="font-rajdhani font-black text-3xl text-slate-100">
            HUNTER FOCUS SANCTUARY
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
            Cycles Completed: <b>{sessionsCompletedToday}</b> ({sessionsCompletedToday * 25} min)
          </div>
        </div>
      </div>

      {/* Target Syllabus Subject / Topic Selection */}
      {activeSyllabus && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs font-mono uppercase text-slate-400">Anchor Focus To Syllabus Topic:</div>
              <div className="text-sm font-bold text-white">
                {selectedTopic ? `${selectedSubject} → ${selectedTopic}` : 'General Deep Flow (Unanchored)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:border-cyan-500 font-sans"
            >
              <option value="">All Subjects...</option>
              {syllabusSubjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select
              disabled={!selectedSubject}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:border-cyan-500 disabled:opacity-50 font-sans"
            >
              <option value="">Select Topic...</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Countdown Timer Portal */}
        <div className="lg:col-span-2 rounded-2xl p-8 bg-slate-900/80 border border-cyan-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
          {/* Ambient Glow */}
          <div className={`absolute inset-0 bg-cyan-500/5 blur-3xl transition-opacity ${isActive ? 'opacity-100' : 'opacity-20'}`} />

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mb-8 relative z-10">
            {[
              { mins: 25, label: '25m Standard' },
              { mins: 50, label: '50m Deep Sprint' },
              { mins: 5, label: '5m Short Rest' },
              { mins: 15, label: '15m Long Rest' }
            ].map((p) => (
              <button
                key={p.mins}
                onClick={() => handleSelectPresetTime(p.mins)}
                className={`
                  px-3.5 py-1.5 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer
                  ${totalSeconds === p.mins * 60 
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'}
                `}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Big Digital Timer Display */}
          <div className="relative z-10 my-4">
            <div className="font-rajdhani font-black text-6xl sm:text-8xl tracking-wider text-slate-100 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mt-2">
              {isActive ? '⚔️ MONARCH FLOW ENGAGED - DISTRACTIONS BLOCKED' : 'AWAITING HUNTER INITIATION'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 my-6 relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Primary Controls */}
          <div className="flex items-center gap-4 relative z-10 mt-2">
            {!isActive ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-black text-sm tracking-wider uppercase shadow-xl shadow-cyan-950 transition-all hover:scale-105 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" /> Engage Flow
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-rajdhani font-black text-sm tracking-wider uppercase border border-slate-600 transition-all hover:scale-105 cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-current" /> Pause Focus
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ambient Sound Synthesizer & Perks */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6 bg-slate-900/80 border border-cyan-500/20 shadow-xl">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">SYNTHESIZER</span>
                <h3 className="font-rajdhani font-bold text-lg text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" /> Sonic Cloaking
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'binaural', label: 'Binaural Alpha' },
                { id: 'rain', label: 'Rain Gate' },
                { id: 'void', label: 'Shadow Void' },
                { id: 'off', label: 'Mute Audio' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSoundChange(s.id as any)}
                  className={`
                    p-3 rounded-xl border text-xs font-rajdhani font-bold transition-all text-center cursor-pointer
                    ${soundPreset === s.id 
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}
                  `}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {soundPreset !== 'off' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
