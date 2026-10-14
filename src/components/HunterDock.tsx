import React, { useState } from 'react';
import { NavTab } from './Navigation';
import { 
  LayoutDashboard, 
  HelpCircle,
  Network, 
  BookOpen, 
  Swords, 
  Crown, 
  UserCheck, 
  Bot, 
  Ghost, 
  Timer, 
  Compass,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HunterDockProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCommandDeck: () => void;
  unclaimedQuestsCount: number;
}

interface DockItem {
  id: NavTab | 'more';
  label: string;
  icon: React.ElementType;
  badge?: number;
  color: string;
}

export const HunterDock: React.FC<HunterDockProps> = ({
  currentTab,
  onSelectTab,
  onOpenCommandDeck,
  unclaimedQuestsCount
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const dockItems: DockItem[] = [
    { id: 'dashboard', label: 'Command Deck', icon: LayoutDashboard, badge: unclaimedQuestsCount > 0 ? unclaimedQuestsCount : undefined, color: 'text-cyan-400' },
    { id: 'user-guide', label: 'User Guide', icon: HelpCircle, color: 'text-amber-400' },
    { id: 'progression-web', label: 'Progression Web', icon: Network, color: 'text-purple-400' },
    { id: 'syllabus', label: 'My Syllabus', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'dungeon', label: 'Dungeon Gates', icon: Swords, color: 'text-blue-400' },
    { id: 'boss', label: 'Boss Trials', icon: Crown, color: 'text-rose-400' },
    { id: 'character', label: 'Hunter Card 3D', icon: UserCheck, color: 'text-indigo-400' },
    { id: 'ai', label: 'System AI', icon: Bot, color: 'text-teal-400' },
    { id: 'shadows', label: 'Shadow Army', icon: Ghost, color: 'text-violet-400' },
    { id: 'focus', label: 'Focus Sanctuary', icon: Timer, color: 'text-sky-400' },
    { id: 'more', label: 'All Operations (⌘K)', icon: Compass, color: 'text-amber-300' }
  ];

  const handleClick = (item: DockItem) => {
    soundManager.playSfx('click');
    if (item.id === 'more') {
      onOpenCommandDeck();
    } else {
      onSelectTab(item.id as NavTab);
    }
  };

  return (
    <nav 
      aria-label="Hunter System Dock"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] transition-all"
    >
      {/* Floating 3D HUD Dock Container */}
      <div className="relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-2xl sm:rounded-full bg-[#070b16]/90 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.8)] overflow-x-auto no-scrollbar scroll-smooth">
        {/* Glow halo under dock */}
        <div className="absolute inset-x-8 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div 
              key={item.id} 
              className="relative flex flex-col items-center group"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Tooltip Hover Label */}
              {isHovered && (
                <div className="absolute -top-10 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-500/40 text-[11px] font-heading font-bold text-slate-100 whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.7)] pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{item.label}</span>
                </div>
              )}

              {/* 3D Interactive Dock Button */}
              <button
                onClick={() => handleClick(item)}
                className={`
                  relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer
                  hover:-translate-y-1.5 hover:scale-115 active:scale-95 flex items-center justify-center
                  ${isActive 
                    ? 'bg-gradient-to-b from-cyan-950/90 to-[#0c142b] border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-300' 
                    : 'bg-slate-900/40 border border-transparent hover:border-slate-700/80 hover:bg-slate-800/60 text-slate-400 hover:text-slate-100'
                  }
                `}
                aria-label={item.label}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? item.color : 'group-hover:' + item.color}`} />

                {/* Notification Badge */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono-tech bg-amber-500 text-slate-950 font-black border border-amber-300 animate-pulse">
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Rune Dot */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
