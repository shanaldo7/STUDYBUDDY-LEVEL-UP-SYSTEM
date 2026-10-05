import React, { useState, useEffect } from 'react';
import { HunterUser } from '../types/hunter';
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
  Radio
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface FocusRoomViewProps {
  user: HunterUser;
  onCompleteSession: (minutes: number, xp: number) => void;
}

export const FocusRoomView: React.FC<FocusRoomViewProps> = ({
  user,
  onCompleteSession
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundPreset, setSoundPreset] = useState<'off' | 'rain' | 'void' | 'binaural'>('binaural');
  const [volume, setVolume] = useState<number>(0.3);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(2);

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
      setRemainingSeconds(totalSeconds);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, remainingSeconds, totalSeconds, onCompleteSession]);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            DEEP WORK ISOLATION PROTOCOL
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            HUNTER FOCUS SANCTUARY
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-tech text-cyan-300">
            Cycles Completed: <b>{sessionsCompletedToday}</b> ({sessionsCompletedToday * 25} min)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Countdown Timer Portal */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-8 border border-cyan-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
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
                  px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all
                  ${totalSeconds === p.mins * 60 
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'}
                `}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Big Digital Timer Display */}
          <div className="relative z-10 my-4">
            <div className="font-heading font-black text-6xl sm:text-8xl tracking-wider text-slate-100 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs font-mono-tech text-cyan-400 uppercase tracking-widest mt-2">
              {isActive ? '⚔️ MONARCH FLOW ENGAGED - DISTRACTIONS BLOCKED' : 'AWAITING HUNTER INITIATION'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 my-6 relative z-10">
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
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" /> Engage Flow
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-heading font-black text-sm tracking-wider uppercase border border-slate-600 transition-all hover:scale-105"
              >
                <Pause className="w-5 h-5 fill-current" /> Pause Focus
              </button>
            )}

            <button
              onClick={handleResetTimer}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ambient Sound Synthesizer & Perks */}
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 border border-cyan-500/20">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">SYNTHESIZER</span>
                <h3 className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" /> AMBIENT SOUNDSCAPES
                </h3>
              </div>
              <span className="text-[10px] font-mono-tech text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> PROCEDURAL
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'binaural', label: 'Binaural 40Hz Gamma (Cognition)', desc: 'Pure sine frequency to promote deep intellectual focus' },
                { id: 'void', label: 'Void Cosmic Drone (Isolation)', desc: 'Low harmonic bass tone masking high-frequency distractions' },
                { id: 'rain', label: 'Dungeon Rain on Stone (Relaxation)', desc: 'Gentle simulated water acoustic noise landscape' },
                { id: 'off', label: 'Silence / Off', desc: 'No background soundscapes generated' }
              ].map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => handleSoundChange(snd.id as 'off' | 'rain' | 'void' | 'binaural')}
                  className={`
                    w-full p-3 rounded-lg border text-left text-xs transition-all
                    ${soundPreset === snd.id 
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'}
                  `}
                >
                  <div className="font-heading font-bold text-sm text-slate-200">{snd.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{snd.desc}</div>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {soundPreset !== 'off' && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Session Rewards Info */}
          <div className="glass-panel rounded-xl p-5 border border-purple-500/30">
            <span className="text-[11px] font-mono-tech text-purple-400 uppercase tracking-widest font-semibold">REWARDS</span>
            <h4 className="font-heading font-bold text-sm text-slate-100 mt-1">Per Completed Session</h4>
            <div className="mt-3 space-y-2 text-xs font-mono-tech">
              <div className="flex justify-between text-slate-300">
                <span>XP Granted:</span>
                <span className="text-purple-300 font-bold">+150 XP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Mana Restored:</span>
                <span className="text-cyan-300 font-bold">+40 MP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Quest Progress:</span>
                <span className="text-emerald-300 font-bold">+25 Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
