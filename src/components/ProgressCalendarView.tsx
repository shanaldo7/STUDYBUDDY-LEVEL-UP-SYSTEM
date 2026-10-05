import React from 'react';
import { HunterUser } from '../types/hunter';
import { 
  Calendar as CalendarIcon, 
  Flame, 
  Award, 
  Clock, 
  Swords, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface ProgressCalendarViewProps {
  user: HunterUser;
}

export const ProgressCalendarView: React.FC<ProgressCalendarViewProps> = ({ user }) => {
  // Generate 16 weeks of realistic study heatmap activity
  const weeks = 18;
  const daysPerWeek = 7;
  const grid: { level: number; dateStr: string; minutes: number }[][] = [];

  for (let w = 0; w < weeks; w++) {
    const weekDays = [];
    for (let d = 0; d < daysPerWeek; d++) {
      // Create interesting distribution with high activity on recent days
      const isRecent = w >= 15;
      const rand = Math.random();
      let lvl = 0;
      let mins = 0;

      if (isRecent || rand > 0.35) {
        if (rand > 0.8) {
          lvl = 4;
          mins = 120 + Math.floor(Math.random() * 60);
        } else if (rand > 0.6) {
          lvl = 3;
          mins = 75 + Math.floor(Math.random() * 30);
        } else if (rand > 0.4) {
          lvl = 2;
          mins = 45 + Math.floor(Math.random() * 20);
        } else {
          lvl = 1;
          mins = 25;
        }
      }
      weekDays.push({ level: lvl, dateStr: `Day ${w * 7 + d}`, minutes: mins });
    }
    grid.push(weekDays);
  }

  const levelColor = (lvl: number) => {
    switch (lvl) {
      case 1: return 'bg-cyan-950/60 border border-cyan-800/40';
      case 2: return 'bg-cyan-800/80 border border-cyan-600/50';
      case 3: return 'bg-cyan-600 border border-cyan-400';
      case 4: return 'bg-cyan-400 border border-white/60 shadow-[0_0_10px_rgba(6,182,212,0.6)]';
      default: return 'bg-slate-900/60 border border-slate-800/50';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" /> CHRONO METRIC ARCHIVES
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            PROGRESS CALENDAR & STREAKS
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-500/40 text-xs font-mono-tech text-orange-300">
          <Flame className="w-4 h-4 text-orange-400" />
          <span>CURRENT STREAK: <b>{user.streakDays} DAYS</b></span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="text-[11px] font-mono-tech text-slate-400 uppercase">Current Streak</div>
          <div className="font-heading font-black text-3xl text-orange-400 mt-1 flex items-center gap-2">
            <Flame className="w-6 h-6" /> {user.streakDays} Days
          </div>
          <div className="text-xs text-slate-400 mt-1">Multiplier: 1.5x Hunter XP</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="text-[11px] font-mono-tech text-slate-400 uppercase">Longest Streak</div>
          <div className="font-heading font-black text-3xl text-cyan-300 mt-1 flex items-center gap-2">
            <Award className="w-6 h-6 text-cyan-400" /> 24 Days
          </div>
          <div className="text-xs text-slate-400 mt-1">Achieved: Season 1</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="text-[11px] font-mono-tech text-slate-400 uppercase">Total Study Time</div>
          <div className="font-heading font-black text-3xl text-purple-300 mt-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" /> {Math.round(user.totalStudyMinutes / 60)}h {user.totalStudyMinutes % 60}m
          </div>
          <div className="text-xs text-slate-400 mt-1">Over 74 distinct sessions</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
          <div className="text-[11px] font-mono-tech text-slate-400 uppercase">Gates Cleared</div>
          <div className="font-heading font-black text-3xl text-amber-300 mt-1 flex items-center gap-2">
            <Swords className="w-6 h-6 text-amber-400" /> {user.gatesCleared} Raids
          </div>
          <div className="text-xs text-slate-400 mt-1">Rank E through S</div>
        </div>
      </div>

      {/* Heatmap Activity Grid */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading font-bold text-lg text-slate-100">
            HUNTER STUDY CHRONICLE (18-WEEK RETROSPECTIVE)
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-slate-400">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-slate-900 border border-slate-800" />
            <div className="w-2.5 h-2.5 rounded-xs bg-cyan-950 border border-cyan-800/40" />
            <div className="w-2.5 h-2.5 rounded-xs bg-cyan-800 border border-cyan-600" />
            <div className="w-2.5 h-2.5 rounded-xs bg-cyan-600 border border-cyan-400" />
            <div className="w-2.5 h-2.5 rounded-xs bg-cyan-400 border border-white" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Blocks */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1.5 min-w-[700px]">
            {grid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    title={`${day.minutes} minutes of focused study`}
                    className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${levelColor(day.level)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono-tech">
          <span>Active Streak Multiplier: 1.5x active on all Dungeon Gates</span>
          <span className="text-cyan-400">Consistent daily study shields against knowledge decay</span>
        </div>
      </div>
    </div>
  );
};
