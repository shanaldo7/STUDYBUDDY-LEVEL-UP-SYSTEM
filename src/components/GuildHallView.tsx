import React from 'react';
import { HunterUser } from '../types/hunter';
import { 
  ShieldAlert, 
  Trophy, 
  Users, 
  Crown, 
  Sparkles, 
  Flame,
  Globe
} from 'lucide-react';

interface GuildHallViewProps {
  user: HunterUser;
}

export const GuildHallView: React.FC<GuildHallViewProps> = ({ user }) => {
  const leaderboard = [
    { rank: 1, name: 'Sung Jin-Woo', title: 'Shadow Monarch', rankLetter: 'S', level: 146, hours: 582, avatar: '👑' },
    { rank: 2, name: 'Cha Hae-In', title: 'Radiant Sword', rankLetter: 'S', level: 118, hours: 440, avatar: '⚔️' },
    { rank: 3, name: 'Choi Jong-In', title: 'The Ultimate Flame', rankLetter: 'S', level: 98, hours: 390, avatar: '🔥' },
    { rank: 4, name: 'Baek Yoonho', title: 'White Tiger Guildmaster', rankLetter: 'S', level: 92, hours: 360, avatar: '🐯' },
    { rank: 12, name: `${user.hunterName} (You)`, title: user.currentTitle, rankLetter: user.hunterRank, level: user.level, hours: Math.round(user.totalStudyMinutes / 60), isUser: true, avatar: '⚡' }
  ];

  const globalRaidHp = 342000;
  const globalRaidMax = 500000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">
            GLOBAL HUNTER ALLIANCE
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            GUILD HALL & WORLD RANKINGS
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono-tech text-emerald-300">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>GLOBAL CO-OP RAID ACTIVE</span>
        </div>
      </div>

      {/* Global Community Study Raid Banner */}
      <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-[#200a12] via-[#14060c] to-[#0a0306] p-6 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono-tech font-bold uppercase">
              WORLD EVENT: THE FINALS WEEK RED GATE
            </span>
            <h2 className="font-heading font-black text-2xl text-slate-100 mt-1">
              Cataclysmic Calamity: Archdemon of Exam Fatigue
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              All registered hunters worldwide chip away at the Calamity's HP by completing study sessions. 
              Each 25 minutes of deep focus delivers 250 collective raid damage!
            </p>
          </div>

          <div className="text-right font-mono-tech">
            <div className="text-xl font-bold text-red-400">
              {globalRaidHp.toLocaleString()} / {globalRaidMax.toLocaleString()} HP
            </div>
            <div className="text-xs text-slate-400">68.4% Remaining</div>
          </div>
        </div>

        {/* Global Raid HP Bar */}
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-red-500/40 mt-4 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full"
            style={{ width: `${(globalRaidHp / globalRaidMax) * 100}%` }}
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-xl border border-cyan-500/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold">LEADERBOARD</span>
            <h3 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> TOP HUNTER ARCHIVES
            </h3>
          </div>
          <span className="text-xs font-mono-tech text-slate-400">Refreshes Hourly</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-[11px] font-mono-tech text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Hunter</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Hunter Rank</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3 text-right">Study Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {leaderboard.map((row) => (
                <tr 
                  key={row.rank}
                  className={`
                    transition-colors
                    ${row.isUser 
                      ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 text-cyan-200' 
                      : 'hover:bg-slate-900/40 text-slate-300'}
                  `}
                >
                  <td className="px-5 py-3.5 font-mono-tech">
                    {row.rank === 1 && '🥇 #1'}
                    {row.rank === 2 && '🥈 #2'}
                    {row.rank === 3 && '🥉 #3'}
                    {row.rank > 3 && `#${row.rank}`}
                  </td>
                  <td className="px-5 py-3.5 flex items-center gap-2">
                    <span>{row.avatar}</span>
                    <span className="font-heading font-bold text-slate-100">{row.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs italic text-purple-300/90">{row.title}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-monarch font-bold ${row.rankLetter === 'S' ? 'border-amber-400 text-amber-300 bg-amber-950/40' : 'border-indigo-400 text-indigo-300 bg-indigo-950/40'}`}>
                      RANK {row.rankLetter}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono-tech font-bold text-cyan-400">LV.{row.level}</td>
                  <td className="px-5 py-3.5 font-mono-tech text-right text-slate-200">{row.hours} Hours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
