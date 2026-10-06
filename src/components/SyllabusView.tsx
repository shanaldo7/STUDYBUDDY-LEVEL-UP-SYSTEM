/**
 * StudyBuddy AI - Monarch Hunter Syllabus Command Center
 * The foundational learning realm: Analyzes syllabus PDFs/text, tracks unit/topic mastery,
 * and launches dynamic syllabus-grounded quizzes, dungeon runs, and study plans.
 */

import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Play, 
  Swords, 
  Target, 
  Timer, 
  Layers, 
  FolderPlus, 
  Check, 
  X, 
  Loader2,
  ListOrdered
} from 'lucide-react';
import { 
  Syllabus, 
  SyllabusSubject, 
  SyllabusUnit, 
  SyllabusTopic, 
  AIProviderConfig 
} from '../types/hunter';
import { extractTextFromFile } from '../utils/pdfParser';
import { analyzeSyllabusWithAI, generateSyllabusStudyPlan } from '../utils/syllabusAI';
import { enrichSyllabusWithProgress, getWeakTopics } from '../utils/progressCalculator';
import { soundManager } from '../utils/audio';

interface SyllabusViewProps {
  syllabi: Syllabus[];
  activeSyllabus: Syllabus | null;
  onSaveSyllabus: (syllabus: Syllabus) => Promise<void>;
  onSetActiveSyllabus: (syllabusId: string) => void;
  onStartQuiz: (subjectName: string, unitName?: string, topicName?: string) => void;
  onStartDungeon: (subjectName: string, unitName?: string, topicName?: string) => void;
  onStartFocus: (subjectName: string, topicName?: string) => void;
  aiConfig?: AIProviderConfig;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  syllabi,
  activeSyllabus,
  onSaveSyllabus,
  onSetActiveSyllabus,
  onStartQuiz,
  onStartDungeon,
  onStartFocus,
  aiConfig
}) => {
  // Navigation & View States
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false);

  // Add / Import Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStep, setImportStep] = useState<'input' | 'analyzing' | 'review'>('input');
  const [inputMethod, setInputMethod] = useState<'paste' | 'upload' | 'manual'>('paste');
  
  // Modal Form Fields
  const [programInput, setProgramInput] = useState('');
  const [semesterInput, setSemesterInput] = useState('');
  const [institutionInput, setInstitutionInput] = useState('');
  const [syllabusTextInput, setSyllabusTextInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Review & Staging Syllabus Tree
  const [stagedSyllabus, setStagedSyllabus] = useState<Syllabus | null>(null);
  
  // Study Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle Subject Expansion
  const toggleSubject = (subjectId: string) => {
    soundManager.playSfx('click');
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  // Toggle Unit Expansion
  const toggleUnit = (unitId: string) => {
    soundManager.playSfx('click');
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Expand / Collapse All
  const expandAll = () => {
    if (!activeSyllabus) return;
    const subMap: Record<string, boolean> = {};
    const unitMap: Record<string, boolean> = {};
    activeSyllabus.subjects.forEach(s => {
      subMap[s.id] = true;
      (s.units || []).forEach(u => {
        unitMap[u.id] = true;
      });
    });
    setExpandedSubjects(subMap);
    setExpandedUnits(unitMap);
  };

  const collapseAll = () => {
    setExpandedSubjects({});
    setExpandedUnits({});
  };

  // Handle File Upload (PDF, TXT, MD)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setAnalysisError(null);
      setUploadedFileName(file.name);
      soundManager.playSfx('levelup');

      const result = await extractTextFromFile(file);
      setSyllabusTextInput(result.text);

      // Auto-populate program / semester hints if found in filename
      if (!programInput && /bca|btech|bsc|mca|bba|mba|class/i.test(file.name)) {
        const match = file.name.match(/(BCA|B\.?Tech|BSc|MCA|BBA|MBA|Class\s*\d+)/i);
        if (match) setProgramInput(match[0].toUpperCase());
      }
      if (!semesterInput && /sem|semester|term|year/i.test(file.name)) {
        const match = file.name.match(/(Semester\s*\d+|Sem\s*\d+|Year\s*\d+)/i);
        if (match) setSemesterInput(match[0]);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to extract text from file');
    } finally {
      setIsUploading(false);
    }
  };

  // Run AI / Local Analysis on Input
  const handleAnalyzeSyllabus = async () => {
    if (inputMethod !== 'manual' && !syllabusTextInput.trim()) {
      setAnalysisError('Please paste syllabus text or upload a document first.');
      return;
    }

    try {
      setImportStep('analyzing');
      setAnalysisError(null);
      soundManager.playSfx('levelup');

      const program = programInput.trim() || 'Academic Program';
      const semester = semesterInput.trim() || 'Semester 1';

      if (inputMethod === 'manual') {
        // Create clean empty structure for manual entry
        const manualSyllabus: Syllabus = {
          id: `syl_${Date.now()}`,
          userId: '',
          program,
          semester,
          institution: institutionInput.trim() || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subjects: [
            {
              id: `sub_${Date.now()}_1`,
              syllabusId: `syl_${Date.now()}`,
              name: 'Subject 1',
              code: 'SUB101',
              units: [
                {
                  id: `unt_${Date.now()}_1`,
                  subjectId: `sub_${Date.now()}_1`,
                  name: 'Unit 1: Foundations',
                  topics: [
                    {
                      id: `top_${Date.now()}_1`,
                      unitId: `unt_${Date.now()}_1`,
                      subjectId: `sub_${Date.now()}_1`,
                      name: 'Core Concept A'
                    }
                  ]
                }
              ]
            }
          ]
        };
        setStagedSyllabus(enrichSyllabusWithProgress(manualSyllabus));
        setImportStep('review');
        return;
      }

      const parsed = await analyzeSyllabusWithAI(
        syllabusTextInput,
        {
          program: programInput.trim(),
          semester: semesterInput.trim(),
          institution: institutionInput.trim()
        },
        aiConfig
      );

      const syllabusId = `syl_${Date.now()}`;
      const subjects: SyllabusSubject[] = parsed.subjects.map((s, sIdx) => {
        const subId = `sub_${Date.now()}_${sIdx}`;
        return {
          id: subId,
          syllabusId,
          name: s.name,
          code: s.code,
          description: s.description,
          units: (s.units || []).map((u, uIdx) => {
            const unitId = `unt_${Date.now()}_${sIdx}_${uIdx}`;
            return {
              id: unitId,
              subjectId: subId,
              name: u.name,
              topics: (u.topics || []).map((tName, tIdx) => ({
                id: `top_${Date.now()}_${sIdx}_${uIdx}_${tIdx}`,
                unitId,
                subjectId: subId,
                name: tName
              }))
            };
          })
        };
      });

      const structuredSyllabus: Syllabus = {
        id: syllabusId,
        userId: '',
        program: parsed.program || program,
        semester: parsed.semester || semester,
        institution: parsed.institution || institutionInput.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subjects
      };

      setStagedSyllabus(enrichSyllabusWithProgress(structuredSyllabus));
      setImportStep('review');
      soundManager.playSfx('victory');
    } catch (err: any) {
      setImportStep('input');
      setAnalysisError(err.message || 'Syllabus analysis failed. Please retry.');
    }
  };

  // Staged Syllabus Modifications (in Review screen)
  const addSubjectToStaged = () => {
    if (!stagedSyllabus) return;
    const subId = `sub_${Date.now()}`;
    const newSubject: SyllabusSubject = {
      id: subId,
      syllabusId: stagedSyllabus.id,
      name: `New Subject ${stagedSyllabus.subjects.length + 1}`,
      units: [
        {
          id: `unt_${Date.now()}`,
          subjectId: subId,
          name: 'Unit 1: Overview',
          topics: [
            {
              id: `top_${Date.now()}`,
              unitId: `unt_${Date.now()}`,
              subjectId: subId,
              name: 'Topic 1'
            }
          ]
        }
      ]
    };
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: [...stagedSyllabus.subjects, newSubject]
    }));
  };

  const removeSubjectFromStaged = (subjectIndex: number) => {
    if (!stagedSyllabus) return;
    const updated = stagedSyllabus.subjects.filter((_, idx) => idx !== subjectIndex);
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: updated
    }));
  };

  const addUnitToStaged = (subjectIndex: number) => {
    if (!stagedSyllabus) return;
    const subject = stagedSyllabus.subjects[subjectIndex];
    const unitId = `unt_${Date.now()}`;
    const newUnit: SyllabusUnit = {
      id: unitId,
      subjectId: subject.id,
      name: `Unit ${subject.units.length + 1}: Core Concepts`,
      topics: [
        {
          id: `top_${Date.now()}`,
          unitId,
          subjectId: subject.id,
          name: 'Fundamental Concept'
        }
      ]
    };
    const updatedSubjects = [...stagedSyllabus.subjects];
    updatedSubjects[subjectIndex] = {
      ...subject,
      units: [...subject.units, newUnit]
    };
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: updatedSubjects
    }));
  };

  const removeUnitFromStaged = (subjectIndex: number, unitIndex: number) => {
    if (!stagedSyllabus) return;
    const subject = stagedSyllabus.subjects[subjectIndex];
    const updatedUnits = subject.units.filter((_, idx) => idx !== unitIndex);
    const updatedSubjects = [...stagedSyllabus.subjects];
    updatedSubjects[subjectIndex] = { ...subject, units: updatedUnits };
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: updatedSubjects
    }));
  };

  const addTopicToStaged = (subjectIndex: number, unitIndex: number) => {
    if (!stagedSyllabus) return;
    const subject = stagedSyllabus.subjects[subjectIndex];
    const unit = subject.units[unitIndex];
    const newTopic: SyllabusTopic = {
      id: `top_${Date.now()}`,
      unitId: unit.id,
      subjectId: subject.id,
      name: 'New Concept'
    };
    const updatedTopics = [...unit.topics, newTopic];
    const updatedUnits = [...subject.units];
    updatedUnits[unitIndex] = { ...unit, topics: updatedTopics };
    const updatedSubjects = [...stagedSyllabus.subjects];
    updatedSubjects[subjectIndex] = { ...subject, units: updatedUnits };
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: updatedSubjects
    }));
  };

  const removeTopicFromStaged = (subjectIndex: number, unitIndex: number, topicIndex: number) => {
    if (!stagedSyllabus) return;
    const subject = stagedSyllabus.subjects[subjectIndex];
    const unit = subject.units[unitIndex];
    const updatedTopics = unit.topics.filter((_, idx) => idx !== topicIndex);
    const updatedUnits = [...subject.units];
    updatedUnits[unitIndex] = { ...unit, topics: updatedTopics };
    const updatedSubjects = [...stagedSyllabus.subjects];
    updatedSubjects[subjectIndex] = { ...subject, units: updatedUnits };
    setStagedSyllabus(enrichSyllabusWithProgress({
      ...stagedSyllabus,
      subjects: updatedSubjects
    }));
  };

  // Confirm and Save Syllabus
  const handleConfirmSyllabus = async () => {
    if (!stagedSyllabus || stagedSyllabus.subjects.length === 0) return;
    soundManager.playSfx('victory');
    await onSaveSyllabus(stagedSyllabus);
    setShowAddModal(false);
    setStagedSyllabus(null);
    setImportStep('input');
    setSyllabusTextInput('');
    setUploadedFileName('');
  };

  // Handle Study Plan Generation
  const handleGenerateStudyPlan = async () => {
    if (!activeSyllabus) return;
    setShowPlanModal(true);
    setIsGeneratingPlan(true);
    soundManager.playSfx('levelup');

    const weakList = getWeakTopics(activeSyllabus).map(w => ({
      subjectName: w.subjectName,
      topicName: w.topicName,
      progress: w.progressPercentage
    }));

    const syllabusOverview = {
      program: activeSyllabus.program,
      semester: activeSyllabus.semester,
      subjects: activeSyllabus.subjects.map(s => ({
        name: s.name,
        topicsCount: s.units.reduce((acc, u) => acc + u.topics.length, 0)
      }))
    };

    const plan = await generateSyllabusStudyPlan(syllabusOverview, weakList, aiConfig);
    setStudyPlan(plan);
    setIsGeneratingPlan(false);
    soundManager.playSfx('victory');
  };

  // Filter topics based on search
  const filteredSubjects = (activeSyllabus?.subjects || []).filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchSub = sub.name.toLowerCase().includes(query) || sub.code?.toLowerCase().includes(query);
    const matchTopic = (sub.units || []).some(u => 
      u.name.toLowerCase().includes(query) || 
      (u.topics || []).some(t => t.name.toLowerCase().includes(query))
    );
    return matchSub || matchTopic;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-500/30 p-6 md:p-8 shadow-2xl shadow-cyan-950/20">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Syllabus Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight font-rajdhani">
              {activeSyllabus ? `${activeSyllabus.program} — ${activeSyllabus.semester}` : 'MY SYLLABUS'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl font-sans">
              {activeSyllabus 
                ? 'Your personalized curriculum hierarchy. Every quiz, dungeon trial, and quest dynamically adapts to these topics.'
                : 'Tell StudyBuddy what you are studying to construct your hunter learning world.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Semester Switcher Dropdown */}
            {syllabi.length > 0 && (
              <div className="relative">
                <select
                  value={activeSyllabus?.id || ''}
                  onChange={(e) => onSetActiveSyllabus(e.target.value)}
                  className="appearance-none bg-slate-900/90 border border-cyan-500/40 text-cyan-200 text-sm font-semibold rounded-xl px-4 py-2.5 pr-9 hover:border-cyan-400 transition cursor-pointer shadow-lg shadow-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {syllabi.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.program} ({s.semester}) {s.isActive ? '★ Active' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            )}

            {/* Action Buttons */}
            {activeSyllabus && (
              <>
                <button
                  onClick={handleGenerateStudyPlan}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-rajdhani font-bold text-sm tracking-wide shadow-lg shadow-blue-900/40 transition border border-blue-400/30 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  Tactical Study Plan
                </button>

                <button
                  onClick={() => setIsEditingSyllabus(!isEditingSyllabus)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold tracking-wide transition border active:scale-95 cursor-pointer ${
                    isEditingSyllabus 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditingSyllabus ? 'Done Editing' : 'Edit Syllabus'}
                </button>
              </>
            )}

            <button
              onClick={() => {
                setImportStep('input');
                setSyllabusTextInput('');
                setProgramInput(activeSyllabus?.program || '');
                setSemesterInput('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-rajdhani font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {activeSyllabus ? 'Import Another' : 'Add Syllabus'}
            </button>
          </div>
        </div>

        {/* Overall Progress Gauge */}
        {activeSyllabus && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center font-rajdhani font-black text-xl text-cyan-300 shadow-inner">
                {activeSyllabus.progressPercentage || 0}%
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase">Curriculum Completion</div>
                <div className="text-base font-bold text-white font-rajdhani">
                  {activeSyllabus.subjects.length} Subjects · {activeSyllabus.subjects.reduce((acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0), 0)} Mastery Topics
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="w-full bg-slate-950/80 rounded-full h-3 border border-slate-800 overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-700 shadow-sm shadow-cyan-500"
                  style={{ width: `${activeSyllabus.progressPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <button 
                onClick={expandAll}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 transition"
              >
                Expand All
              </button>
              <button 
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 transition"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State / Call to Action */}
      {!activeSyllabus && (
        <div className="rounded-2xl bg-slate-900/50 border border-dashed border-cyan-500/30 p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/10">
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold font-rajdhani text-white">System Protocol: No Syllabus Configured</h3>
            <p className="text-sm text-slate-400">
              Provide your course syllabus via PDF upload or text paste. StudyBuddy AI will deconstruct it into subjects, units, and mastery topics to generate your trials.
            </p>
          </div>
          <button
            onClick={() => {
              setImportStep('input');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-rajdhani font-black text-base shadow-xl shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add My Syllabus Now
          </button>
        </div>
      )}

      {/* Active Syllabus Subjects Tree */}
      {activeSyllabus && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search subjects, units, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition shadow-inner font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-sans">
              No subjects or topics match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredSubjects.map((subject, sIdx) => {
              const isSubExpanded = expandedSubjects[subject.id] ?? true;
              const subProgress = subject.progressPercentage || 0;

              return (
                <div 
                  key={subject.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition shadow-xl overflow-hidden"
                >
                  {/* Subject Header */}
                  <div 
                    onClick={() => toggleSubject(subject.id)}
                    className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-cyan-300">
                        {isSubExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-rajdhani font-black text-xl text-white tracking-wide">
                            {subject.name}
                          </span>
                          {subject.code && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {subject.code}
                            </span>
                          )}
                        </div>
                        {subject.description && (
                          <p className="text-xs text-slate-400 mt-0.5 font-sans line-clamp-1">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400 block">Mastery</span>
                        <span className="font-rajdhani font-black text-lg text-cyan-300">
                          {subProgress}%
                        </span>
                      </div>
                      <div className="w-28 bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${subProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Units & Topics Subtree */}
                  {isSubExpanded && (
                    <div className="p-4 md:p-6 pt-0 space-y-4 border-t border-slate-800/60 bg-slate-950/40">
                      {(subject.units || []).map((unit, uIdx) => {
                        const isUnitExp = expandedUnits[unit.id] ?? true;
                        const unitProg = unit.progressPercentage || 0;

                        return (
                          <div 
                            key={unit.id}
                            className="rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden"
                          >
                            {/* Unit Header */}
                            <div 
                              onClick={() => toggleUnit(unit.id)}
                              className="p-3.5 px-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-slate-400">
                                  {isUnitExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </span>
                                <Layers className="w-4 h-4 text-cyan-400" />
                                <span className="font-rajdhani font-bold text-slate-200 text-base">
                                  {unit.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">
                                  {unit.topics.length} topics
                                </span>
                                <span className="text-xs font-mono font-bold text-cyan-400">
                                  {unitProg}%
                                </span>
                              </div>
                            </div>

                            {/* Topics List */}
                            {isUnitExp && (
                              <div className="p-3 space-y-2">
                                {(unit.topics || []).map((topic, tIdx) => {
                                  const prog = topic.progress?.progressPercentage || 0;
                                  const status = topic.progress?.status || 'NOT_STARTED';

                                  return (
                                    <div 
                                      key={topic.id}
                                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/50 hover:border-cyan-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Status Indicator */}
                                        {status === 'MASTERED' ? (
                                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0" title="Mastered (85%+)">
                                            <Check className="w-3.5 h-3.5" />
                                          </div>
                                        ) : status === 'IN_PROGRESS' ? (
                                          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0" title="In Progress">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0" title="Not Started">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                          </div>
                                        )}

                                        <div>
                                          <div className="font-sans font-medium text-sm text-slate-200 group-hover:text-white transition">
                                            {topic.name}
                                          </div>
                                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                                            <span>Quizzes: {topic.progress?.quizzesPassed || 0}/{topic.progress?.quizzesTaken || 0}</span>
                                            <span>·</span>
                                            <span>Dungeon Clears: {topic.progress?.dungeonsCleared || 0}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Launchers & Progress */}
                                      <div className="flex items-center gap-3 self-end sm:self-center">
                                        <div className="text-right hidden xs:block">
                                          <div className="text-xs font-mono font-bold text-cyan-300">
                                            {prog}%
                                          </div>
                                          <div className="w-20 bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full ${
                                                prog >= 85 ? 'bg-emerald-500' : prog >= 40 ? 'bg-cyan-500' : 'bg-slate-600'
                                              }`}
                                              style={{ width: `${prog}%` }}
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => onStartQuiz(subject.name, unit.name, topic.name)}
                                            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-xs font-rajdhani font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                                            title="Launch AI Quiz on this topic"
                                          >
                                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                                            Quiz
                                          </button>

                                          <button
                                            onClick={() => onStartDungeon(subject.name, unit.name, topic.name)}
                                            className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-rajdhani font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                                            title="Launch Dungeon Battle for this topic"
                                          >
                                            <Swords className="w-3.5 h-3.5 text-red-400" />
                                            Dungeon
                                          </button>

                                          <button
                                            onClick={() => onStartFocus(subject.name, topic.name)}
                                            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-xs font-rajdhani font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                                            title="Start Pomodoro study timer on this topic"
                                          >
                                            <Timer className="w-3.5 h-3.5 text-cyan-400" />
                                            Focus
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================
          ADD / IMPORT SYLLABUS MODAL
          ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 md:p-8 shadow-2xl shadow-cyan-950/40 my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Step 1: Input Details & Upload */}
            {importStep === 'input' && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase">
                    <BookOpen className="w-3.5 h-3.5" />
                    Syllabus Input Wizard
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black font-rajdhani text-white mt-1">
                    ADD YOUR SYLLABUS
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    Paste your curriculum text or upload a PDF syllabus. StudyBuddy AI will parse it into subjects, units, and topics.
                  </p>
                </div>

                {analysisError && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {/* Course Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Study Program *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BCA, B.Tech CSE, Class 12"
                      value={programInput}
                      onChange={(e) => setProgramInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Semester / Year *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Semester 3, Term 2"
                      value={semesterInput}
                      onChange={(e) => setSemesterInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Institution (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. University XYZ"
                      value={institutionInput}
                      onChange={(e) => setInstitutionInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Input Method Switcher */}
                <div className="flex border-b border-slate-800 gap-4 text-sm font-rajdhani font-bold">
                  <button
                    onClick={() => setInputMethod('paste')}
                    className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
                      inputMethod === 'paste'
                        ? 'border-cyan-500 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Paste Syllabus Text
                  </button>
                  <button
                    onClick={() => setInputMethod('upload')}
                    className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
                      inputMethod === 'upload'
                        ? 'border-cyan-500 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload PDF / Document
                  </button>
                  <button
                    onClick={() => setInputMethod('manual')}
                    className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
                      inputMethod === 'manual'
                        ? 'border-cyan-500 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Create Manually
                  </button>
                </div>

                {/* Tab: Paste Text */}
                {inputMethod === 'paste' && (
                  <div className="space-y-2">
                    <textarea
                      rows={8}
                      placeholder={`Paste your syllabus text here...\n\nExample:\nPython Programming\nUnit 1: Introduction\n- Variables\n- Data Types\n- Operators\n\nUnit 2: Functions\n- Function definition\n- Parameters\n- Recursion\n\nDatabase Management Systems\nUnit 1: DBMS Basics\n- Database concepts\n- ER model\n- Keys`}
                      value={syllabusTextInput}
                      onChange={(e) => setSyllabusTextInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Tab: Upload File */}
                {inputMethod === 'upload' && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.txt,.md,.docx"
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition group"
                    >
                      <Upload className="w-10 h-10 text-cyan-400 mx-auto group-hover:scale-110 transition" />
                      <div className="mt-3 font-rajdhani font-bold text-white text-base">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to Upload Syllabus PDF or Document'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports .pdf, .txt, .md. Text will be extracted client-side automatically.
                      </p>
                    </div>

                    {isUploading && (
                      <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 font-mono">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting text from document...
                      </div>
                    )}

                    {syllabusTextInput && !isUploading && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono max-h-32 overflow-y-auto">
                        <div className="text-[10px] text-cyan-400 uppercase mb-1">Extracted Text Preview:</div>
                        {syllabusTextInput.slice(0, 300)}...
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Manual Creation Info */}
                {inputMethod === 'manual' && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="text-white font-bold">Manual Subject Builder</p>
                    <p>You can define your subjects, units, and topics in the next review screen with full add/delete/edit controls.</p>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-rajdhani font-bold text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnalyzeSyllabus}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-rajdhani font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {inputMethod === 'manual' ? 'Proceed to Builder' : 'Analyze Syllabus'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Analysis In-Progress Animation */}
            {importStep === 'analyzing' && (
              <div className="py-16 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <div className="absolute inset-3 rounded-full border-4 border-blue-500/20 border-b-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-xs text-cyan-400 uppercase tracking-widest animate-pulse">
                    Tactical Matrix Scan
                  </div>
                  <h3 className="text-2xl font-black font-rajdhani text-white">
                    Deconstructing Syllabus Architecture...
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Identifying subjects, isolating core modules, and structuring atomic concept trees for Hunter mastery tracking.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Interactive Review & Customization Screen */}
            {importStep === 'review' && stagedSyllabus && (
              <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Syllabus Detected & Ready for Review
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black font-rajdhani text-white mt-1">
                    REVIEW & CUSTOMIZE YOUR CURRICULUM
                  </h2>
                  <p className="text-xs text-slate-400">
                    Edit names, add missing modules, or remove unwanted items before confirming.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm font-mono">
                  <span className="text-slate-300">{stagedSyllabus.program} — {stagedSyllabus.semester}</span>
                  <span className="text-cyan-400">{stagedSyllabus.subjects.length} Subjects</span>
                </div>

                {/* Subjects Review List */}
                <div className="space-y-4">
                  {stagedSyllabus.subjects.map((sub, sIdx) => (
                    <div key={sub.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                      {/* Subject Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs font-mono text-cyan-400 font-bold">#{sIdx + 1}</span>
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => {
                              const updated = [...stagedSyllabus.subjects];
                              updated[sIdx].name = e.target.value;
                              setStagedSyllabus({ ...stagedSyllabus, subjects: updated });
                            }}
                            className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-sm font-bold text-white w-full"
                          />
                        </div>
                        <button
                          onClick={() => removeSubjectFromStaged(sIdx)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Units */}
                      <div className="pl-4 border-l-2 border-slate-800 space-y-3">
                        {(sub.units || []).map((unit, uIdx) => (
                          <div key={unit.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={unit.name}
                                onChange={(e) => {
                                  const updated = [...stagedSyllabus.subjects];
                                  updated[sIdx].units[uIdx].name = e.target.value;
                                  setStagedSyllabus({ ...stagedSyllabus, subjects: updated });
                                }}
                                className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-2.5 py-1 text-xs font-semibold text-cyan-200 w-full"
                              />
                              <button
                                onClick={() => removeUnitFromStaged(sIdx, uIdx)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Topics */}
                            <div className="pl-3 space-y-1.5">
                              {(unit.topics || []).map((topic, tIdx) => (
                                <div key={topic.id} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  <input
                                    type="text"
                                    value={topic.name}
                                    onChange={(e) => {
                                      const updated = [...stagedSyllabus.subjects];
                                      updated[sIdx].units[uIdx].topics[tIdx].name = e.target.value;
                                      setStagedSyllabus({ ...stagedSyllabus, subjects: updated });
                                    }}
                                    className="bg-transparent hover:bg-slate-950 focus:bg-slate-950 border border-transparent focus:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-300 w-full"
                                  />
                                  <button
                                    onClick={() => removeTopicFromStaged(sIdx, uIdx, tIdx)}
                                    className="text-slate-600 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              <button
                                onClick={() => addTopicToStaged(sIdx, uIdx)}
                                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1 pt-1"
                              >
                                <Plus className="w-3 h-3" /> Add Topic
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => addUnitToStaged(sIdx)}
                          className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <FolderPlus className="w-3.5 h-3.5" /> Add Unit / Module
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addSubjectToStaged}
                    className="w-full py-2.5 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-500 text-cyan-300 font-rajdhani font-bold text-sm flex items-center justify-center gap-2 hover:bg-cyan-500/5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Subject
                  </button>
                </div>

                {/* Review Confirm Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setImportStep('input')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-rajdhani font-bold text-sm cursor-pointer"
                  >
                    Back to Edit Input
                  </button>
                  <button
                    onClick={handleConfirmSyllabus}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-rajdhani font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirm &amp; Initialize Study World
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          AI STUDY PLAN MODAL
          ========================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-blue-500/40 p-6 md:p-8 shadow-2xl shadow-blue-950/40 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tactical Protocol Engine
                </div>
                <h2 className="text-2xl md:text-3xl font-black font-rajdhani text-white mt-1">
                  TODAY&apos;S SYLLABUS MISSION PROTOCOL
                </h2>
                <p className="text-xs text-slate-400">
                  Targeted study sequence generated from your active curriculum and weakest concept areas.
                </p>
              </div>

              {isGeneratingPlan ? (
                <div className="py-12 text-center space-y-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-slate-400">Synthesizing optimal study regimen...</p>
                </div>
              ) : studyPlan ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 font-sans">
                    {studyPlan.summary}
                  </div>

                  <div className="space-y-3">
                    {(studyPlan.missions || []).map((mission: any, mIdx: number) => (
                      <div 
                        key={mIdx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {mission.type}
                            </span>
                            <span className="font-rajdhani font-bold text-white text-base">
                              {mission.title}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-cyan-400">
                            {mission.subject} → {mission.topic}
                          </div>
                          <p className="text-xs text-slate-400">
                            {mission.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-amber-400 block">
                            +{mission.rewardXp} XP
                          </span>
                          <button
                            onClick={() => {
                              setShowPlanModal(false);
                              if (mission.type === 'quiz') onStartQuiz(mission.subject, undefined, mission.topic);
                              else if (mission.type === 'dungeon') onStartDungeon(mission.subject, undefined, mission.topic);
                              else onStartFocus(mission.subject, mission.topic);
                            }}
                            className="mt-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-rajdhani font-bold text-xs transition cursor-pointer"
                          >
                            Engage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
