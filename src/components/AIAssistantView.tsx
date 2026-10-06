import React, { useState } from 'react';
import { HunterUser, AIProviderConfig, Syllabus } from '../types/hunter';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  User, 
  Settings
} from 'lucide-react';
import { askHunterGuide } from '../utils/gemini';
import { soundManager } from '../utils/audio';
import { getWeakTopics } from '../utils/progressCalculator';
import { sanitizeSystemGuideResponse } from '../utils/responseSanitizer';
import { normalizeHunterName } from '../utils/hunterIdentity';

interface Message {
  id: string;
  sender: 'hunter' | 'guide';
  text: string;
  timestamp: string;
}

interface AIAssistantViewProps {
  user: HunterUser;
  aiConfig?: AIProviderConfig;
  activeSyllabus?: Syllabus | null;
  onOpenConfig?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ 
  user, 
  aiConfig, 
  activeSyllabus,
  onOpenConfig 
}) => {
  const hasKey = Boolean(aiConfig?.apiKey && aiConfig.apiKey.trim().length > 3) || aiConfig?.provider === 'ollama';
  const displayName = normalizeHunterName(user.hunterName);
  const weakTopics = getWeakTopics(activeSyllabus || null).slice(0, 4);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_1',
      sender: 'guide',
      text: `⚔️ **Welcome, ${displayName}.**\n\nI am your StudyBuddy System Guide.\n\nWhat concept or syllabus topic do you want to master today? You can ask for a definition, exam notes, practice questions, or ask what to study next.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "what is statistoic",
    "what is mean",
    "explain statistics in detail",
    "give me exam answer for statistics",
    "quiz me on statistics",
    "what should i study next?",
    "what is qualitative data"
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    soundManager.playSfx('click');
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'hunter',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let syllabusSystemContext = '';
      if (activeSyllabus) {
        syllabusSystemContext += `Program: ${activeSyllabus.program} (${activeSyllabus.semester})\n`;
        syllabusSystemContext += `Subjects: ${activeSyllabus.subjects.map(s => s.name).join(', ')}\n`;
        if (weakTopics.length > 0) {
          syllabusSystemContext += `Current Focus Topics: ${weakTopics.map(w => `${w.subjectName} → ${w.topicName}`).join(', ')}`;
        }
      }

      const response = await askHunterGuide(text, aiConfig, syllabusSystemContext);
      soundManager.playSfx('attack');
      const cleanText = sanitizeSystemGuideResponse(response);
      const guideMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'guide',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, guideMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'guide',
        text: '⚠️ The System Guide is temporarily unable to reach the AI core.\n\nLocal study guidance is still available.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[11px] font-mono-tech text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> ARCHITECT INTELLIGENCE CORE
          </span>
          <h1 className="font-monarch font-bold text-2xl text-slate-100">
            HUNTER SYSTEM AI ASSISTANT
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono-tech text-cyan-300">
            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold tracking-wider">THE SYSTEM GUIDE</span>
            <span className="text-slate-600">·</span>
            <span className={hasKey ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {hasKey ? 'ONLINE' : 'LOCAL MODE'}
            </span>
          </div>
          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
              title="Configure AI Provider & Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!hasKey && (
        <div className="glass-panel p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-amber-200">AI is not configured. Add an API key to activate the AI system.</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Model selection is completely automatic. Select your provider and enter your API key to connect live tactical reasoning. All other features remain 100% active with built-in heuristic guides.
              </p>
            </div>
          </div>
          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider shadow-md transition-all hover:scale-105 shrink-0"
            >
              Configure AI
            </button>
          )}
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <span className="text-slate-500 font-mono-tech shrink-0">Tactical Directives:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat History Box */}
      <div className="glass-panel rounded-2xl border border-cyan-500/30 flex flex-col h-[520px] overflow-hidden">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isGuide = m.sender === 'guide';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 ${isGuide ? 'justify-start' : 'justify-end'}`}
              >
                {isGuide && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div 
                  className={`
                    max-w-2xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed
                    ${isGuide 
                      ? 'bg-slate-900/80 border border-cyan-500/30 text-slate-200' 
                      : 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-100'}
                  `}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono-tech text-slate-500 mb-1.5 pb-1 border-b border-slate-800">
                    <span className={isGuide ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                      {isGuide ? 'THE SYSTEM GUIDE' : displayName}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-200">
                    {m.text}
                  </div>
                </div>

                {!isGuide && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs font-mono-tech text-cyan-400 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <span>SYSTEM GUIDE GENERATING EXPLANATION...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#070b16]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask the Hunter System Guide about any academic topic, formula, or exam concept..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/70"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
            >
              <span>Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
