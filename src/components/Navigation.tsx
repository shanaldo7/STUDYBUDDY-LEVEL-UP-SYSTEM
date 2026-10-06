import React from 'react';
import { 
  LayoutDashboard, 
  Swords, 
  Crown, 
  BookOpen, 
  UserCheck, 
  Ghost, 
  GitFork, 
  FlaskConical, 
  Timer, 
  ShieldAlert, 
  Target, 
  Bot, 
  Calendar,
  Menu,
  X,
  Settings,
  Network,
  HelpCircle
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export type NavTab = 
  | 'dashboard'
  | 'progression-web'
  | 'syllabus'
  | 'dungeon'
  | 'boss'
  | 'quizzes'
  | 'character'
  | 'shadows'
  | 'skills'
  | 'revision'
  | 'focus'
  | 'guild'
  | 'exam'
  | 'ai'
  | 'ai-config'
  | 'calendar'
  | 'user-guide';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  unclaimedQuestsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onToggleMobile,
  unclaimedQuestsCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number | string; highlight?: boolean }[] = [
    { id: 'dashboard', label: 'Command Deck', icon: LayoutDashboard, badge: unclaimedQuestsCount > 0 ? unclaimedQuestsCount : undefined },
    { id: 'user-guide', label: '📖 User Guide', icon: HelpCircle, highlight: true },
    { id: 'progression-web', label: 'Progression Web', icon: Network, highlight: true },
    { id: 'syllabus', label: 'My Syllabus', icon: BookOpen, highlight: true },
    { id: 'dungeon', label: 'Dungeon Gates', icon: Swords, highlight: true },
    { id: 'boss', label: 'Boss Trials', icon: Crown, highlight: true },
    { id: 'quizzes', label: 'Knowledge Trials', icon: Target },
    { id: 'character', label: 'Hunter Attributes', icon: UserCheck },
    { id: 'shadows', label: 'Shadow Army', icon: Ghost },
    { id: 'skills', label: 'Skill Tree', icon: GitFork },
    { id: 'revision', label: 'Revision Lab', icon: FlaskConical },
    { id: 'focus', label: 'Focus Sanctuary', icon: Timer },
    { id: 'guild', label: 'Guild Hall', icon: ShieldAlert },
    { id: 'exam', label: 'Exam Command', icon: Target },
    { id: 'ai', label: 'Hunter AI Guide', icon: Bot },
    { id: 'ai-config', label: 'AI Configuration', icon: Settings },
    { id: 'calendar', label: 'Streak Calendar', icon: Calendar },
  ];

  const handleTabClick = (tab: NavTab) => {
    soundManager.playSfx('click');
    onSelectTab(tab);
    if (isOpenMobile) {
      onToggleMobile();
    }
  };

  return (
    <>
      {/* Mobile top hamburger bar toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#090d1a] border-b border-cyan-500/20 text-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-heading font-bold text-sm tracking-wider text-cyan-400">HUNTER SYSTEM MENU</span>
        </div>
        <button 
          onClick={onToggleMobile} 
          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop / Drawer Mobile */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#070b16] border-r border-cyan-500/20 
          transform transition-transform duration-300 ease-in-out flex flex-col justify-between
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <span className="font-monarch font-extrabold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                  STUDYBUDDY
                </span>
              </div>
              <div className="text-[10px] font-mono-tech tracking-widest text-cyan-400/80 mt-0.5">
                MONARCH HUNTER PROTOCOL
              </div>
            </div>
            {/* Close button on mobile drawer */}
            <button 
              onClick={onToggleMobile} 
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            <div className="px-3 py-1.5 text-[11px] font-mono-tech uppercase tracking-wider text-slate-500 font-semibold">
              System Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group
                    ${isActive 
                      ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                    <span className="font-heading tracking-wide text-[13px]">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-tech bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 group-hover:animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-cyan-500/10 text-xs text-slate-500 font-mono-tech">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ONLINE
            </span>
            <span>v2.8-MONARCH</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div 
          onClick={onToggleMobile}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
};
