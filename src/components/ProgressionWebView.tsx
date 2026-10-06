/**
 * StudyBuddy AI - Monarch Hunter Progression Web
 * Visual RPG-style progression web & dynamic academic constellation.
 * Dynamically constructs branches from the student's actual syllabus,
 * calculates authentic Study Power, and visualizes real-time mastery.
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  HunterUser, 
  Syllabus, 
  SyllabusSubject, 
  SyllabusTopic,
  TopicStatus 
} from '../types/hunter';
import { 
  buildProgressionWebGraph, 
  calculateStudyPower, 
  WebGraphNode, 
  AttributeAffinity,
  ATTRIBUTE_DEFINITIONS 
} from '../utils/progressionWebData';
import { ProgressionWeb3D } from './ProgressionWeb3D';
import { soundManager } from '../utils/audio';
import { 
  Network, 
  Compass, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Swords, 
  Target, 
  Brain, 
  Timer, 
  Bot, 
  ChevronRight, 
  ExternalLink,
  ShieldAlert,
  Layers,
  Zap,
  BookOpen,
  X
} from 'lucide-react';

interface ProgressionWebViewProps {
  user: HunterUser;
  activeSyllabus?: Syllabus | null;
  onNavigate: (tab: 'dashboard' | 'syllabus' | 'dungeon' | 'boss' | 'quizzes' | 'character' | 'skills' | 'revision' | 'focus' | 'ai') => void;
  onStartQuizWithTopic: (subject: string, unit?: string, topic?: string) => void;
  onStartDungeonWithTopic: (subject: string, unit?: string, topic?: string) => void;
  onStartFocusWithTopic: (subject: string, topic?: string) => void;
  onRecordTopicActivity?: (subjectName: string, topicName: string, activity: { quizPassed?: boolean; dungeonCleared?: boolean; studyMinutes?: number }) => void;
  onEarnXp?: (xp: number) => void;
  onLoadSampleSyllabus?: () => void;
}

export const ProgressionWebView: React.FC<ProgressionWebViewProps> = ({
  user,
  activeSyllabus,
  onNavigate,
  onStartQuizWithTopic,
  onStartDungeonWithTopic,
  onStartFocusWithTopic,
  onRecordTopicActivity,
  onEarnXp,
  onLoadSampleSyllabus
}) => {
  // View mode: '3d' (Three.js WebGL 3D Core), 'orbital' (Radial 2D SVG web), or 'matrix' (Hierarchical RPG tree)
  const [viewMode, setViewMode] = useState<'3d' | 'orbital' | 'matrix'>('3d');
  
  // Interactive graph controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MASTERED' | 'IN_PROGRESS' | 'WEAKEST'>('ALL');
  
  // Selected Node for Hunter Intel Modal
  const [selectedNode, setSelectedNode] = useState<WebGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<WebGraphNode | null>(null);
  
  // Core Pulse & Level-up Preview Animation State
  const [isCorePulsing, setIsCorePulsing] = useState<boolean>(false);
  const [showLevelUpPreview, setShowLevelUpPreview] = useState<boolean>(false);
  const [quickTrainingSuccess, setQuickTrainingSuccess] = useState<string | null>(null);

  // SVG dimensions
  const SVG_SIZE = 1000;
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Build real graph data based on authentic user & active syllabus
  const { nodes, edges, metrics } = useMemo(() => {
    return buildProgressionWebGraph(user, activeSyllabus || null, SVG_SIZE, SVG_SIZE);
  }, [user, activeSyllabus]);

  // Filtered nodes based on search & status filter
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => {
      // Core is always visible
      if (node.type === 'core') return true;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(query);
        const matchesSub = node.subtitle?.toLowerCase().includes(query);
        const matchesSubject = node.subjectName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub && !matchesSubject) return false;
      }

      // Status filter
      if (statusFilter === 'MASTERED') {
        return node.mastery >= 85 || node.status === 'MASTERED';
      }
      if (statusFilter === 'IN_PROGRESS') {
        return node.mastery > 0 && node.mastery < 85;
      }
      if (statusFilter === 'WEAKEST') {
        return node.mastery < 50;
      }

      return true;
    });
  }, [nodes, searchQuery, statusFilter]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    soundManager.playSfx('click');
    setZoomLevel(prev => Math.min(prev + 0.2, 2.4));
  };

  const handleZoomOut = () => {
    soundManager.playSfx('click');
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    soundManager.playSfx('click');
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Trigger core pulse
  const triggerCorePulse = () => {
    soundManager.playSfx('levelup');
    setIsCorePulsing(true);
    setTimeout(() => setIsCorePulsing(false), 1200);
  };

  // Quick training drill action: updates actual user state and database
  const handleQuickTrainTopic = (node: WebGraphNode) => {
    soundManager.playSfx('victory');
    setQuickTrainingSuccess(`+30 XP & Topic Mastery Acquired for "${node.title}"!`);

    if (onEarnXp) {
      onEarnXp(30);
    }

    if (onRecordTopicActivity && node.subjectName) {
      onRecordTopicActivity(node.subjectName, node.title, { quizPassed: true, studyMinutes: 10 });
    }

    setTimeout(() => {
      setQuickTrainingSuccess(null);
    }, 3500);
  };

  // Focus on weakest branch
  const handleFocusWeakest = () => {
    soundManager.playSfx('click');
    setStatusFilter('WEAKEST');
    // Find weakest topic node
    const topicNodes = nodes.filter(n => n.type === 'topic');
    if (topicNodes.length > 0) {
      const weakest = [...topicNodes].sort((a, b) => a.mastery - b.mastery)[0];
      if (weakest) {
        setSelectedNode(weakest);
        // Pan towards node
        const cx = SVG_SIZE / 2;
        const cy = SVG_SIZE / 2;
        setPanOffset({
          x: (cx - weakest.x) * 0.6,
          y: (cy - weakest.y) * 0.6
        });
        setZoomLevel(1.3);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Top Protocol Header & Hunter Stats */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#091024] via-[#0d1630] to-[#16102c] p-5 sm:p-6 shadow-[0_0_35px_-10px_rgba(6,182,212,0.3)]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono-tech text-xs font-bold text-cyan-400 tracking-widest uppercase">
                SYSTEM AWAKENING PROTOCOL · RECURSIVE MATRIX
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-monarch text-slate-50 tracking-wide flex items-center gap-3">
              <span>🕸️ PROGRESSION WEB</span>
              <span className="text-xs px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-mono-tech">
                RANK {user.hunterRank}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              {activeSyllabus ? (
                <>
                  Dynamic neural constellation linked to <strong className="text-cyan-300">{activeSyllabus.program} ({activeSyllabus.semester})</strong>. Every quiz, gate victory, and flashcard recall strengthens your academic branches.
                </>
              ) : (
                <>
                  Foundational Hunter Matrix. Connect your syllabus in <strong className="text-cyan-300">My Syllabus</strong> to project your custom course branches and topic spheres.
                </>
              )}
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-[#060a17]/80 p-3 rounded-lg border border-cyan-500/20 backdrop-blur-sm">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] font-mono-tech text-slate-400 uppercase">STUDY POWER</div>
              <div className="text-lg sm:text-xl font-bold font-mono-tech text-cyan-400 flex items-center gap-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                {metrics.studyPower.toLocaleString()}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] font-mono-tech text-slate-400 uppercase">CORE LEVEL</div>
              <div className="text-lg sm:text-xl font-bold font-mono-tech text-amber-400 flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                LV.{user.level}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] font-mono-tech text-slate-400 uppercase">TOTAL XP</div>
              <div className="text-lg sm:text-xl font-bold font-mono-tech text-purple-300 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {user.xp.toLocaleString()}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] font-mono-tech text-slate-400 uppercase">MASTERY</div>
              <div className="text-lg sm:text-xl font-bold font-mono-tech text-emerald-400 flex items-center gap-1">
                <Target className="w-4 h-4 text-emerald-400" />
                {metrics.overallMastery}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip & Interactive Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#080d1e] p-3 rounded-xl border border-cyan-500/20">
        {/* Left: View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode switch */}
          <div className="inline-flex rounded-lg bg-slate-900/80 p-1 border border-slate-800">
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setViewMode('3d');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Core Web</span>
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setViewMode('orbital');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'orbital'
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Web</span>
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('click');
                setViewMode('matrix');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'matrix'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matrix Tree</span>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex rounded-lg bg-slate-900/80 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => { soundManager.playSfx('click'); setStatusFilter('ALL'); }}
              className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'ALL' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({nodes.length})
            </button>
            <button
              onClick={() => { soundManager.playSfx('click'); setStatusFilter('MASTERED'); }}
              className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'MASTERED' ? 'bg-emerald-500/30 text-emerald-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Mastered ({metrics.masteredTopics})
            </button>
            <button
              onClick={() => { soundManager.playSfx('click'); setStatusFilter('IN_PROGRESS'); }}
              className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'IN_PROGRESS' ? 'bg-indigo-500/30 text-indigo-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              In Progress ({metrics.inProgressTopics})
            </button>
            <button
              onClick={handleFocusWeakest}
              className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'WEAKEST' ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-amber-400/80 hover:text-amber-300'}`}
            >
              ⚠️ Weakest Branch
            </button>
          </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level-up pulse simulation button */}
          <button
            onClick={() => {
              triggerCorePulse();
              setShowLevelUpPreview(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 flex items-center gap-1 transition-all"
            title="Simulate Hunter Core Resonance"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Awaken Core</span>
          </button>
        </div>
      </div>

      {/* No Syllabus Notice Banner if applicable */}
      {!activeSyllabus && (
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-[#091228] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-cyan-300">CORE AWAITING SYLLABUS CALIBRATION</div>
              <div className="text-xs text-slate-400 mt-0.5">
                The Progression Web is currently running on base Hunter Pillars. Upload or paste your course syllabus in "My Syllabus" to awaken custom academic branches!
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('syllabus')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Go to My Syllabus</span>
            </button>
            {onLoadSampleSyllabus && (
              <button
                onClick={onLoadSampleSyllabus}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                ⚡ Load Sample BCA Tree
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick feedback toast */}
      {quickTrainingSuccess && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/70 text-emerald-200 text-xs font-mono-tech flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{quickTrainingSuccess}</span>
          </div>
          <button onClick={() => setQuickTrainingSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Visual Display: 3D WebGL, 2D Orbital SVG Web, or Hierarchical Matrix */}
      {viewMode === '3d' ? (
        <ProgressionWeb3D
          user={user}
          activeSyllabus={activeSyllabus}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNode={selectedNode}
          isLevelUpAnimating={showLevelUpPreview}
          onSkipLevelUp={() => setShowLevelUpPreview(false)}
          onFallbackTo2D={() => setViewMode('orbital')}
        />
      ) : viewMode === 'orbital' ? (
        <div className="relative w-full h-[620px] sm:h-[720px] bg-[#050814] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-[inset_0_0_80px_rgba(3,7,18,0.9)]">
          {/* Subtle Cyber Grid Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
          />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-[#090d1f]/90 border border-cyan-500/30 rounded-lg p-1.5 flex flex-col gap-1 backdrop-blur-md shadow-lg">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
                title="Reset View"
                aria-label="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Scale indicator */}
            <div className="px-2.5 py-1 rounded bg-[#090d1f]/80 border border-cyan-500/20 text-[10px] font-mono-tech text-cyan-400">
              SCALE: {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          {/* Legend / Attribute Affinities */}
          <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1.5 bg-[#090d1f]/90 border border-cyan-500/25 p-3 rounded-lg backdrop-blur-md shadow-lg max-w-[210px]">
            <div className="text-[10px] font-mono-tech font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
              ATTRIBUTE AFFINITIES
            </div>
            {Object.values(ATTRIBUTE_DEFINITIONS).map(attr => (
              <div key={attr.type} className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: attr.color }} />
                  <span className="font-mono-tech font-semibold">{attr.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono-tech">{attr.type}</span>
              </div>
            ))}
          </div>

          {/* Interactive SVG Canvas */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              {/* Core Glow Filter */}
              <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="16" result="blur1" />
                <feGaussianBlur stdDeviation="30" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Node Radiant Glow Filter */}
              <filter id="nodeGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Linear Gradients for Edges */}
              <linearGradient id="edgeGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="edgeGradPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Zoom / Pan Container */}
            <g
              transform={`translate(${panOffset.x + (SVG_SIZE / 2) * (1 - zoomLevel)}, ${
                panOffset.y + (SVG_SIZE / 2) * (1 - zoomLevel)
              }) scale(${zoomLevel})`}
            >
              {/* Concentric Orbital Rings */}
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={160}
                fill="none"
                stroke="rgba(6, 182, 212, 0.08)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={240}
                fill="none"
                stroke="rgba(6, 182, 212, 0.15)"
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={380}
                fill="none"
                stroke="rgba(129, 140, 248, 0.1)"
                strokeWidth="1"
                strokeDasharray="3 5"
              />

              {/* Edges / Energy Circuits */}
              {edges.map(edge => {
                const isHovered = hoveredNode?.id === edge.sourceId || hoveredNode?.id === edge.targetId;
                const isSelected = selectedNode?.id === edge.sourceId || selectedNode?.id === edge.targetId;
                const strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : Math.max(1.5, edge.strength * 2.5);
                const strokeOpacity = isSelected ? 0.95 : isHovered ? 0.8 : Math.max(0.25, edge.strength * 0.7);

                return (
                  <g key={edge.id}>
                    {/* Underlying Glow Track */}
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke={edge.color}
                      strokeWidth={strokeWidth + 3}
                      strokeOpacity={strokeOpacity * 0.25}
                    />

                    {/* Active Energy Line */}
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke={edge.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={edge.animated ? '6 4' : undefined}
                      className={edge.animated ? 'animate-dashFlow' : undefined}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {visibleNodes.map(node => {
                const isCore = node.type === 'core';
                const isSubjectOrPillar = node.type === 'subject' || node.type === 'pillar';
                const isTopic = node.type === 'topic';
                const isHovered = hoveredNode?.id === node.id;
                const isSelected = selectedNode?.id === node.id;

                if (isCore) {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => {
                        triggerCorePulse();
                        setSelectedNode(node);
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer"
                    >
                      {/* Outer Radiant Shockwave Aura */}
                      <circle
                        r={node.radius + (isCorePulsing ? 32 : 16)}
                        fill="none"
                        stroke="rgba(6, 182, 212, 0.4)"
                        strokeWidth="2"
                        strokeDasharray="6 8"
                        className={isCorePulsing ? 'animate-ping' : 'animate-spin-slow'}
                        filter="url(#coreGlow)"
                      />

                      {/* Rotating Outer Tech Ring */}
                      <circle
                        r={node.radius + 8}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="12 14"
                        strokeOpacity="0.8"
                        className="animate-spin-reverse-slow"
                      />

                      {/* Center Core Sphere */}
                      <circle
                        r={node.radius}
                        fill="url(#coreSphereGradient)"
                        stroke={isCorePulsing ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isCorePulsing ? 4 : 2.5}
                        filter="url(#coreGlow)"
                      />

                      {/* Radial Core Gradient */}
                      <radialGradient id="coreSphereGradient" cx="40%" cy="40%" r="65%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="60%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#082f49" />
                      </radialGradient>

                      {/* Center Core HUD Text */}
                      <text
                        y="-14"
                        textAnchor="middle"
                        fill="#e0f2fe"
                        fontSize="10"
                        fontWeight="bold"
                        letterSpacing="1.5"
                        fontFamily="monospace"
                      >
                        SYSTEM CORE
                      </text>
                      <text
                        y="6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="18"
                        fontWeight="900"
                        fontFamily="sans-serif"
                      >
                        LV.{node.level}
                      </text>
                      <text
                        y="22"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        PWR {metrics.studyPower}
                      </text>
                    </g>
                  );
                }

                if (isSubjectOrPillar) {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => {
                        soundManager.playSfx('click');
                        setSelectedNode(node);
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer transition-transform duration-200"
                    >
                      {/* Aura */}
                      <circle
                        r={node.radius + (isSelected ? 10 : isHovered ? 6 : 2)}
                        fill="none"
                        stroke={node.color}
                        strokeWidth="1.5"
                        strokeOpacity={isSelected ? 0.9 : 0.4}
                        strokeDasharray="4 4"
                      />

                      {/* Outer Progress Ring */}
                      <circle
                        r={node.radius}
                        fill="#0b1329"
                        stroke="#1e293b"
                        strokeWidth="4"
                      />
                      <circle
                        r={node.radius}
                        fill="none"
                        stroke={node.color}
                        strokeWidth="4"
                        strokeDasharray={`${(node.mastery / 100) * 2 * Math.PI * node.radius} ${2 * Math.PI * node.radius}`}
                        strokeLinecap="round"
                        transform="rotate(-90)"
                      />

                      {/* Inner Emblem */}
                      <circle
                        r={node.radius - 6}
                        fill="#080e22"
                        stroke={node.color}
                        strokeWidth="1.5"
                        strokeOpacity="0.7"
                      />

                      {/* Node Text & Value */}
                      <text
                        y="-4"
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {node.attribute.type}
                      </text>
                      <text
                        y="12"
                        textAnchor="middle"
                        fill={node.color}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.mastery}%
                      </text>

                      {/* Subject Name label below */}
                      <text
                        y={node.radius + 16}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        {node.title.length > 18 ? node.title.slice(0, 16) + '...' : node.title}
                      </text>
                    </g>
                  );
                }

                // Topic Node
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => {
                      soundManager.playSfx('click');
                      setSelectedNode(node);
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer"
                  >
                    {/* Mastery Aura */}
                    {node.status === 'MASTERED' && (
                      <circle
                        r={node.radius + 5}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeOpacity="0.7"
                        strokeDasharray="2 3"
                        filter="url(#nodeGlow)"
                      />
                    )}

                    {/* Node Base */}
                    <circle
                      r={node.radius}
                      fill={node.status === 'MASTERED' ? '#075985' : node.status === 'IN_PROGRESS' ? '#581c87' : '#0f172a'}
                      stroke={node.color}
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter={node.status === 'MASTERED' ? 'url(#nodeGlow)' : undefined}
                    />

                    {/* Progress percentage or icon */}
                    <text
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.status === 'MASTERED' ? '★' : `${node.mastery}%`}
                    </text>

                    {/* Topic Name label */}
                    {(isHovered || isSelected || node.status === 'MASTERED') && (
                      <g transform={`translate(0, ${node.radius + 12})`}>
                        <rect
                          x={-(node.title.length * 3.2)}
                          y="-8"
                          width={node.title.length * 6.4}
                          height="14"
                          fill="#090d1f"
                          stroke={node.color}
                          strokeWidth="0.8"
                          rx="3"
                          opacity="0.95"
                        />
                        <text
                          y="2"
                          textAnchor="middle"
                          fill="#f1f5f9"
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="sans-serif"
                        >
                          {node.title.length > 22 ? node.title.slice(0, 20) + '...' : node.title}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Quick HUD Node Inspector Preview (Bottom Left) */}
          {hoveredNode && hoveredNode.type !== 'core' && (
            <div className="absolute bottom-4 left-4 z-20 bg-[#090d20]/95 border border-cyan-500/40 p-3 rounded-lg backdrop-blur-md shadow-2xl max-w-xs animate-fadeIn pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                <span className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-wider">
                  {hoveredNode.type.toUpperCase()} · {hoveredNode.attribute.name}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-100 truncate">{hoveredNode.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Mastery: <span className="font-mono-tech font-bold text-cyan-300">{hoveredNode.mastery}%</span>
                {hoveredNode.subtitle && ` · ${hoveredNode.subtitle}`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono-tech mt-1">
                Click to inspect & start knowledge trial
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Hierarchical Matrix Tree View */
        <div className="bg-[#060a18] rounded-2xl border border-cyan-500/20 p-5 sm:p-6 space-y-6">
          {/* Matrix Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#090f26] border border-cyan-500/25">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono-tech text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                LV.{user.level}
              </div>
              <div>
                <div className="font-monarch font-bold text-base text-slate-100">
                  MONARCH CORE · POWER MATRIX
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Rank {user.hunterRank} · {metrics.studyPower.toLocaleString()} Study Power · {metrics.overallMastery}% Syllabus Mastery
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerCorePulse();
                  setShowLevelUpPreview(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Level Up</span>
              </button>
            </div>
          </div>

          {/* Matrix Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {nodes.filter(n => n.type === 'subject' || n.type === 'pillar').map(branchNode => {
              const childTopics = nodes.filter(n => n.parentId === branchNode.id);
              return (
                <div 
                  key={branchNode.id}
                  className="rounded-xl border border-slate-800 bg-[#080d20] p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-all group"
                >
                  <div>
                    {/* Branch Title & Attribute */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{branchNode.attribute.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {branchNode.title}
                          </div>
                          <div className="text-[10px] font-mono-tech text-slate-400 uppercase">
                            {branchNode.attribute.name} · {branchNode.attribute.type}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono-tech font-bold text-cyan-400">
                        {branchNode.mastery}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${branchNode.mastery}%`,
                          backgroundColor: branchNode.color
                        }}
                      />
                    </div>

                    {/* Child Topics List */}
                    <div className="space-y-1.5 mb-4">
                      {childTopics.map(topic => (
                        <div
                          key={topic.id}
                          onClick={() => {
                            soundManager.playSfx('click');
                            setSelectedNode(topic);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-cyan-500/30 cursor-pointer transition-all text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: topic.status === 'MASTERED' ? '#38bdf8' : topic.status === 'IN_PROGRESS' ? '#a855f7' : '#475569' 
                              }}
                            />
                            <span className="text-slate-200 truncate">{topic.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="font-mono-tech text-[10px] text-slate-400">
                              {topic.mastery}%
                            </span>
                            {topic.status === 'MASTERED' && (
                              <span className="text-amber-400 text-xs">★</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Branch Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono-tech">
                      {branchNode.attribute.bonusText}
                    </span>
                    <button
                      onClick={() => {
                        soundManager.playSfx('click');
                        setSelectedNode(branchNode);
                      }}
                      className="text-xs font-mono-tech text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <span>Branch Intel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Study Power Mathematical Breakdown Card */}
      <div className="p-5 rounded-xl border border-cyan-500/20 bg-[#080d22] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-3">
          <div>
            <div className="font-monarch font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>HUNTER COMBAT POWER FORMULATION</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Deterministic calculation rooted entirely in your persistent database records.
            </div>
          </div>
          <div className="font-mono-tech text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            TOTAL STUDY POWER: <strong className="text-cyan-400 font-bold">{metrics.studyPower.toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">LEVEL POWER</div>
            <div className="font-mono-tech font-bold text-slate-200 mt-1">+{metrics.breakdown.levelPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Lv.{user.level} × 25</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">XP MANA</div>
            <div className="font-mono-tech font-bold text-purple-300 mt-1">+{metrics.breakdown.xpPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{user.xp.toLocaleString()} XP ÷ 50</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">ATTRIBUTES</div>
            <div className="font-mono-tech font-bold text-cyan-300 mt-1">+{metrics.breakdown.statPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Stats Allocated × 2</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">SYLLABUS MASTERY</div>
            <div className="font-mono-tech font-bold text-emerald-300 mt-1">+{metrics.breakdown.masteryPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{metrics.masteredTopics} Mastered Topics</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">DUNGEON CLEARS</div>
            <div className="font-mono-tech font-bold text-amber-300 mt-1">+{metrics.breakdown.combatPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{user.gatesCleared} Gates Cleared</div>
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono-tech text-slate-400 uppercase">STREAK MULTIPLIER</div>
            <div className="font-mono-tech font-bold text-rose-300 mt-1">+{metrics.breakdown.streakPower}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{user.streakDays} Days × 6</div>
          </div>
        </div>
      </div>

      {/* HUNTER INTEL MODAL: Node Detail & Action Launcher */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-[#090f24] rounded-2xl border border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-36 h-36 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: selectedNode.glowColor }} />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border"
                  style={{
                    backgroundColor: `${selectedNode.color}20`,
                    borderColor: selectedNode.color,
                    color: selectedNode.color
                  }}
                >
                  {selectedNode.type === 'core' ? '👑' : selectedNode.attribute.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tech uppercase tracking-widest text-cyan-400">
                      {selectedNode.type.toUpperCase()} INTEL
                    </span>
                    <span 
                      className="text-[10px] font-mono-tech px-2 py-0.5 rounded uppercase"
                      style={{
                        backgroundColor: `${selectedNode.color}20`,
                        color: selectedNode.color
                      }}
                    >
                      {selectedNode.attribute.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 mt-0.5">{selectedNode.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Node Progress & Attribute Stat */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Node Mastery Calibration:</span>
                <span className="font-mono-tech font-bold text-cyan-300">{selectedNode.mastery}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${selectedNode.mastery}%`,
                    backgroundColor: selectedNode.color
                  }}
                />
              </div>

              {selectedNode.subtitle && (
                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono-tech">
                  {selectedNode.subtitle}
                </div>
              )}
            </div>

            {/* Real Stats if topic node */}
            {selectedNode.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono-tech uppercase">QUIZZES</div>
                  <div className="font-bold text-cyan-300 font-mono-tech mt-0.5">
                    {selectedNode.stats.quizzesPassed}/{selectedNode.stats.quizzesTaken}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono-tech uppercase">DUNGEONS</div>
                  <div className="font-bold text-purple-300 font-mono-tech mt-0.5">
                    {selectedNode.stats.dungeonsCleared}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono-tech uppercase">FOCUS MINS</div>
                  <div className="font-bold text-emerald-300 font-mono-tech mt-0.5">
                    {selectedNode.stats.studyMinutes}m
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono-tech uppercase">QUESTS</div>
                  <div className="font-bold text-amber-300 font-mono-tech mt-0.5">
                    {selectedNode.stats.questsCompleted}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for this Node */}
            <div className="space-y-2 pt-2 border-t border-cyan-500/20">
              <div className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-wider">
                TACTICAL DEPLOYMENT
              </div>

              {selectedNode.type === 'core' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onNavigate('character');
                    }}
                    className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Character Attributes</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onNavigate('skills');
                    }}
                    className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Hunter Skill Tree</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onStartQuizWithTopic(selectedNode.subjectName || selectedNode.title, undefined, selectedNode.title);
                    }}
                    className="p-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    <Target className="w-4 h-4" />
                    <span>Launch Knowledge Trial</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onStartDungeonWithTopic(selectedNode.subjectName || selectedNode.title, undefined, selectedNode.title);
                    }}
                    className="p-2.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Enter Dungeon Gate</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      onStartFocusWithTopic(selectedNode.subjectName || selectedNode.title, selectedNode.title);
                    }}
                    className="p-2.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Timer className="w-4 h-4 text-emerald-400" />
                    <span>Focus Sanctuary (Timer)</span>
                  </button>

                  <button
                    onClick={() => handleQuickTrainTopic(selectedNode)}
                    className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-semibold text-xs hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Quick Drill (+30 XP)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL UP CELEBRATION PREVIEW MODAL */}
      {showLevelUpPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-md bg-[#091228] rounded-2xl border-2 border-cyan-400 p-6 text-center space-y-4 shadow-[0_0_60px_rgba(6,182,212,0.5)] relative overflow-hidden"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl animate-bounce shadow-[0_0_30px_rgba(6,182,212,0.6)]">
              👑
            </div>

            <div>
              <div className="font-mono-tech text-xs tracking-widest text-cyan-400 uppercase font-bold">
                SYSTEM AWAKENING NOTICE
              </div>
              <h2 className="text-2xl font-black font-monarch text-white mt-1">
                LEVEL UP: {user.level} → {user.level + 1}
              </h2>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-left space-y-2 text-xs font-mono-tech">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>+1 ATTRIBUTE POINT</span>
                <span className="text-emerald-400">UNSPENT</span>
              </div>
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>+120 XP SURGE</span>
                <span className="text-cyan-400">+POWER</span>
              </div>
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span>NEW NODE UNLOCKED</span>
                <span className="text-amber-400">★ READY</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your neural capacity expands. All cognitive faculties have sharpened, strengthening your branch connections in the Progression Web.
            </p>

            <button
              onClick={() => {
                soundManager.playSfx('click');
                setShowLevelUpPreview(false);
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-colors shadow-lg"
            >
              Acknowledge Awakening
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
