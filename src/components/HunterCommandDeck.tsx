import React, { useState, useEffect, useRef } from 'react';
import { NavTab } from './Navigation';
import { 
  LayoutDashboard, 
  HelpCircle,
  Network, 
  BookOpen, 
  Swords, 
  Crown, 
  Target, 
  UserCheck, 
  Ghost, 
  GitFork, 
  FlaskConical, 
  Timer, 
  ShieldAlert, 
  Bot, 
  Settings, 
  Calendar,
  Search,
  X,
  Palette,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HunterCommandDeckProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenCardCustomizer?: () => void;
  onTriggerLevelUpPreview?: () => void;
  onOpenResetModal?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Core Operations' | 'Character & Power' | 'Focus & Mastery' | 'System & Settings' | 'Quick Actions';
  icon: React.ElementType;
  tab?: NavTab;
  action?: () => void;
  shortcut?: string;
}

export const HunterCommandDeck: React.FC<HunterCommandDeckProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenCardCustomizer,
  onTriggerLevelUpPreview,
  onOpenResetModal,
  isMuted,
  onToggleMute
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commandItems: CommandItem[] = [
    // Core Operations
    { id: 'dashboard', title: 'Command Deck (Dashboard)', subtitle: 'Daily quests, active stats, level progress & quick portal', category: 'Core Operations', icon: LayoutDashboard, tab: 'dashboard', shortcut: '1' },
    { id: 'user-guide', title: '📖 System User Guide', subtitle: 'Complete in-app RPG manual & student survival handbook', category: 'Core Operations', icon: HelpCircle, tab: 'user-guide', shortcut: 'G' },
    { id: 'progression-web', title: 'Progression Web 3D', subtitle: 'Curriculum skill tree, topic nodes & spatial graph', category: 'Core Operations', icon: Network, tab: 'progression-web', shortcut: 'W' },
    { id: 'syllabus', title: 'My Syllabus & Topics', subtitle: 'Manage curriculum, subjects, units, and progress', category: 'Core Operations', icon: BookOpen, tab: 'syllabus', shortcut: 'S' },
    { id: 'dungeon', title: 'Dungeon Gates', subtitle: 'Clear timed combat study runs against rank monsters', category: 'Core Operations', icon: Swords, tab: 'dungeon', shortcut: 'D' },
    { id: 'boss', title: 'Monarch Boss Trials', subtitle: 'Epic chapter boss exams and shadow extraction', category: 'Core Operations', icon: Crown, tab: 'boss', shortcut: 'B' },
    { id: 'quizzes', title: 'Knowledge Trials (Quizzes)', subtitle: 'Syllabus-aligned active recall and mastery testing', category: 'Core Operations', icon: Target, tab: 'quizzes', shortcut: 'Q' },

    // Character & Power
    { id: 'character', title: 'Hunter Attributes & 3D Card', subtitle: 'Allocate stat points, view titles and holographic license', category: 'Character & Power', icon: UserCheck, tab: 'character', shortcut: 'C' },
    { id: 'shadows', title: 'Shadow Army', subtitle: 'Manage extracted shadows for passive study XP bonuses', category: 'Character & Power', icon: Ghost, tab: 'shadows', shortcut: 'A' },
    { id: 'skills', title: 'Skill Tree Matrix', subtitle: 'Cognitive buffs, exam shields, and focus passives', category: 'Character & Power', icon: GitFork, tab: 'skills', shortcut: 'K' },

    // Focus & Mastery
    { id: 'revision', title: 'Revision Lab (Flashcards)', subtitle: 'Spaced repetition flashcards with SM-2 algorithm', category: 'Focus & Mastery', icon: FlaskConical, tab: 'revision', shortcut: 'R' },
    { id: 'focus', title: 'Focus Sanctuary', subtitle: 'Deep work Pomodoro timer with procedural ambient soundscapes', category: 'Focus & Mastery', icon: Timer, tab: 'focus', shortcut: 'F' },
    { id: 'guild', title: 'Guild Hall', subtitle: 'Study parties, guild raids, and peer accountability', category: 'Focus & Mastery', icon: ShieldAlert, tab: 'guild' },
    { id: 'exam', title: 'Exam Command Center', subtitle: 'Exam countdowns, syllabus readiness & battle roadmaps', category: 'Focus & Mastery', icon: Target, tab: 'exam', shortcut: 'E' },

    // System & Settings
    { id: 'ai', title: 'Hunter AI Guide', subtitle: 'AI study mentor grounded in your active syllabus context', category: 'System & Settings', icon: Bot, tab: 'ai', shortcut: 'H' },
    { id: 'ai-config', title: 'AI Model & Provider Config', subtitle: 'Select Gemini, Gemma, OpenRouter, Groq, or Ollama', category: 'System & Settings', icon: Settings, tab: 'ai-config' },
    { id: 'calendar', title: 'Streak & Activity Calendar', subtitle: 'Track historical study momentum and milestones', category: 'System & Settings', icon: Calendar, tab: 'calendar' },

    // Quick Actions
    { 
      id: 'shadow-holo-cards', 
      title: 'Shadow Army Holographic Codex', 
      subtitle: 'Inspect character holographic cards, stats & deploy soldiers', 
      category: 'Quick Actions', 
      icon: Sparkles, 
      action: () => {
        onSelectTab('shadows');
        onClose();
      } 
    },
    { 
      id: 'sound-toggle', 
      title: isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects', 
      subtitle: isMuted ? 'Turn procedural game SFX back on' : 'Silence sound synthesizer', 
      category: 'Quick Actions', 
      icon: isMuted ? VolumeX : Volume2, 
      action: onToggleMute 
    },
    ...(onTriggerLevelUpPreview ? [{
      id: 'test-levelup',
      title: 'Preview Level-Up Fanfare',
      subtitle: 'Trigger full-screen level up announcement and fanfare',
      category: 'Quick Actions' as const,
      icon: Sparkles,
      action: onTriggerLevelUpPreview
    }] : []),
    ...(onOpenResetModal ? [{
      id: 'reset-progress',
      title: 'Reset Hunter Progress (Safe Dialog)',
      subtitle: 'Open the verified progression reset confirmation modal',
      category: 'Quick Actions' as const,
      icon: RotateCcw,
      action: onOpenResetModal
    }] : [])
  ];

  // Filter items
  const filtered = commandItems.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep index in bounds
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Execute selected item
  const handleExecute = (item: CommandItem) => {
    soundManager.playSfx('click');
    onClose();
    if (item.action) {
      item.action();
    } else if (item.tab) {
      onSelectTab(item.tab);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleExecute(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#080d1a] border border-cyan-500/30 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-cyan-500/20 bg-slate-950/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search system operation... (e.g. syllabus, card, boss, guide)"
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm font-heading font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono-tech text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono-tech text-xs">
              No matching operations found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => handleExecute(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer group
                    ${isSelected 
                      ? 'bg-gradient-to-r from-cyan-950/90 to-indigo-950/70 border border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] text-cyan-200' 
                      : 'border border-transparent hover:bg-slate-900/60 text-slate-400'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      p-2 rounded-lg border transition-colors
                      ${isSelected ? 'bg-cyan-950 border-cyan-400/60 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-cyan-400'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-slate-100 group-hover:text-cyan-300 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono-tech px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono-tech text-slate-400">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-cyan-400' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="p-3 border-t border-cyan-500/20 bg-slate-950/90 flex items-center justify-between text-[11px] font-mono-tech text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400/80">STUDYBUDDY: LEVEL UP GRIMOIRE</span>
        </div>
      </div>
    </div>
  );
};
