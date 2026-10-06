/**
 * StudyBuddy AI - Monarch Hunter Study System
 * Main Web Application Entry Point with Google Auth, Cloud Progress Persistence, and Safe Reset
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  HunterUser, 
  DailyQuest, 
  DungeonGate, 
  Boss, 
  QuizQuestion, 
  ShadowSoldier, 
  SkillNode, 
  Flashcard, 
  ExamMilestone,
  AIProviderConfig,
  Syllabus 
} from './types/hunter';
import { 
  createFreshHunterUser,
  createFreshDailyQuests,
  initialGates, 
  initialBosses, 
  initialQuestions, 
  initialSkills, 
  initialFlashcards, 
  initialExams 
} from './data/initialData';
import { getDefaultAIConfig } from './utils/gemini';
import { 
  checkCurrentSession, 
  loginWithGoogle, 
  logoutUser, 
  scheduleCloudSync, 
  requestProgressReset 
} from './utils/auth';
import { enrichSyllabusWithProgress } from './utils/progressCalculator';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProgressionWebView } from './components/ProgressionWebView';
import { SyllabusView } from './components/SyllabusView';
import { createSampleBcaSyllabus } from './utils/progressionWebData';
import { DungeonBattleView } from './components/DungeonBattleView';
import { BossBattleView } from './components/BossBattleView';
import { QuizzesView } from './components/QuizzesView';
import { CharacterView } from './components/CharacterView';
import { ShadowArmyView } from './components/ShadowArmyView';
import { SkillTreeView } from './components/SkillTreeView';
import { RevisionLabView } from './components/RevisionLabView';
import { FocusRoomView } from './components/FocusRoomView';
import { GuildHallView } from './components/GuildHallView';
import { ExamCommandView } from './components/ExamCommandView';
import { AIAssistantView } from './components/AIAssistantView';
import { AIConfigView } from './components/AIConfigView';
import { ProgressCalendarView } from './components/ProgressCalendarView';
import { UserGuideView } from './components/UserGuideView';
import { SystemNotificationModal, SystemNotification } from './components/SystemNotificationModal';
import { CinematicBackground } from './components/CinematicBackground';
import { ScrollProgress } from './components/ScrollProgress';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { soundManager } from './utils/audio';

export default function App() {
  // Authentication & Session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Hunter progression state
  const [user, setUser] = useState<HunterUser>(() => createFreshHunterUser());
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => createFreshDailyQuests());
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => initialQuestions);
  const [shadows, setShadows] = useState<ShadowSoldier[]>([]);
  const [skills, setSkills] = useState<SkillNode[]>(() => initialSkills);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => initialFlashcards);
  const [exams, setExams] = useState<ExamMilestone[]>(() => initialExams);

  // Syllabus state
  const [syllabi, setSyllabi] = useState<Syllabus[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_syllabi');
      return saved ? (JSON.parse(saved) as Syllabus[]).map(s => enrichSyllabusWithProgress(s)) : [];
    } catch {
      return [];
    }
  });

  // Drill selections triggered from syllabus view
  const [drillTopicForQuiz, setDrillTopicForQuiz] = useState<{ subject: string; unit?: string; topic?: string } | undefined>(undefined);
  const [drillTopicForDungeon, setDrillTopicForDungeon] = useState<{ subject: string; unit?: string; topic?: string } | undefined>(undefined);
  const [drillTopicForFocus, setDrillTopicForFocus] = useState<{ subject: string; topic?: string } | undefined>(undefined);

  const activeSyllabus = syllabi.find(s => s.isActive) || syllabi[0] || null;

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeDungeonGate, setActiveDungeonGate] = useState<DungeonGate | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Flexible Multi-Provider AI Configuration
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    try {
      const saved = sessionStorage.getItem('studybuddy_ai_config');
      return saved ? JSON.parse(saved) : getDefaultAIConfig();
    } catch {
      return getDefaultAIConfig();
    }
  });

  const handleUpdateAiConfig = (newConfig: AIProviderConfig) => {
    setAiConfig(newConfig);
    try {
      sessionStorage.setItem('studybuddy_ai_config', JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
  };

  // System notification modal state
  const [notification, setNotification] = useState<SystemNotification>({
    isOpen: false,
    type: 'levelup',
    title: '',
    message: ''
  });

  // 1. Initial Session Check on Mount
  useEffect(() => {
    async function initSession() {
      try {
        const session = await checkCurrentSession();
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          // Fetch user's syllabi from server
          const token = sessionStorage.getItem('studybuddy_auth_token');
          if (token) {
            try {
              const sRes = await fetch('/api/syllabus/list', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (sRes.ok) {
                const sData = await sRes.json();
                if (sData.syllabi && Array.isArray(sData.syllabi) && sData.syllabi.length > 0) {
                  const enriched = sData.syllabi.map((s: Syllabus) => enrichSyllabusWithProgress(s));
                  setSyllabi(enriched);
                  localStorage.setItem('studybuddy_syllabi', JSON.stringify(enriched));
                }
              }
            } catch (sErr) {
              console.warn('[Fetch Syllabi Err]:', sErr);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('[Session Init Error]:', err);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    }
    initSession();
  }, []);

  // 2. Auto-sync progress to cloud when state changes
  useEffect(() => {
    if (!isAuthenticated) return;
    scheduleCloudSync(user, dailyQuests, shadows, skills, flashcards, exams);
  }, [user, dailyQuests, shadows, skills, flashcards, exams, isAuthenticated]);

  // Handle Google Login
  const handleGoogleLogin = async (email: string, displayName: string, photoUrl?: string) => {
    const result = await loginWithGoogle(email, displayName, photoUrl);
    setUser(result.user);
    setIsAuthenticated(true);

    // Fetch user syllabi
    const token = sessionStorage.getItem('studybuddy_auth_token');
    if (token) {
      try {
        const sRes = await fetch('/api/syllabus/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.syllabi && Array.isArray(sData.syllabi)) {
            const enriched = sData.syllabi.map((s: Syllabus) => enrichSyllabusWithProgress(s));
            setSyllabi(enriched);
            localStorage.setItem('studybuddy_syllabi', JSON.stringify(enriched));
          }
        }
      } catch (sErr) {
        console.warn('[Fetch Syllabi on Login Err]:', sErr);
      }
    }

    if (result.isNewUser) {
      setShowOnboarding(true);
      // New users get clean Level 1 state
      setDailyQuests(createFreshDailyQuests());
      setShadows([]);
    } else {
      setShowWelcomeBack(true);
    }
  };

  // Syllabus management handlers
  const handleSaveSyllabus = async (newSyllabus: Syllabus) => {
    const token = sessionStorage.getItem('studybuddy_auth_token');
    const enriched = enrichSyllabusWithProgress({ ...newSyllabus, userId: user.id });

    setSyllabi(prev => {
      const others = prev.filter(s => s.id !== enriched.id).map(s => enriched.isActive ? { ...s, isActive: false } : s);
      const updated = [enriched, ...others];
      localStorage.setItem('studybuddy_syllabi', JSON.stringify(updated));
      return updated;
    });

    if (token) {
      try {
        await fetch('/api/syllabus/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ syllabus: enriched })
        });
      } catch (err) {
        console.warn('[Save Syllabus Server Error]:', err);
      }
    }

    addXpAndCheckLevel(250);
    setNotification({
      isOpen: true,
      type: 'rankup',
      title: '[SYLLABUS WORLD INITIALIZED]',
      message: `Curriculum calibrated: ${enriched.program} (${enriched.semester}) with ${enriched.subjects.length} subjects. +250 XP awarded!`,
      subtext: 'Your quizzes, dungeon runs, and daily missions are now anchored to your exact syllabus.'
    });
  };

  const handleSetActiveSyllabus = (syllabusId: string) => {
    setSyllabi(prev => {
      const updated = prev.map(s => ({
        ...s,
        isActive: s.id === syllabusId
      }));
      localStorage.setItem('studybuddy_syllabi', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadSampleSyllabus = async () => {
    const sample = createSampleBcaSyllabus(user.id);
    await handleSaveSyllabus(sample);
  };

  const handleRecordTopicActivity = async (
    subjectName: string, 
    topicName: string, 
    activity: { quizPassed?: boolean; dungeonCleared?: boolean; questCompleted?: boolean; studyMinutes?: number }
  ) => {
    if (!activeSyllabus) return;

    let targetTopicId = '';
    for (const sub of activeSyllabus.subjects) {
      if (sub.name === subjectName || !subjectName) {
        for (const u of sub.units) {
          for (const t of u.topics) {
            if (t.name === topicName) {
              targetTopicId = t.id;
              break;
            }
          }
        }
      }
    }

    if (!targetTopicId) return;

    setSyllabi(prev => {
      const updated = prev.map(s => {
        if (s.id !== activeSyllabus.id) return s;
        const updatedSubjects = s.subjects.map(sub => ({
          ...sub,
          units: sub.units.map(u => ({
            ...u,
            topics: u.topics.map(t => {
              if (t.id !== targetTopicId) return t;
              const cur = t.progress || {
                topicId: t.id,
                progressPercentage: 0,
                status: 'NOT_STARTED' as const,
                quizzesTaken: 0,
                quizzesPassed: 0,
                dungeonsCleared: 0,
                studyMinutes: 0,
                questsCompleted: 0
              };
              const nextQuizzesTaken = cur.quizzesTaken + (activity.quizPassed !== undefined ? 1 : 0);
              const nextQuizzesPassed = cur.quizzesPassed + (activity.quizPassed ? 1 : 0);
              const nextDungeons = cur.dungeonsCleared + (activity.dungeonCleared ? 1 : 0);
              const nextMins = cur.studyMinutes + (activity.studyMinutes || 0);
              const nextQuests = cur.questsCompleted + (activity.questCompleted ? 1 : 0);

              return {
                ...t,
                progress: {
                  topicId: t.id,
                  progressPercentage: cur.progressPercentage,
                  status: cur.status,
                  quizzesTaken: nextQuizzesTaken,
                  quizzesPassed: nextQuizzesPassed,
                  dungeonsCleared: nextDungeons,
                  studyMinutes: nextMins,
                  questsCompleted: nextQuests,
                  lastPracticed: new Date().toISOString()
                }
              };
            })
          }))
        }));

        return enrichSyllabusWithProgress({ ...s, subjects: updatedSubjects });
      });

      localStorage.setItem('studybuddy_syllabi', JSON.stringify(updated));
      return updated;
    });

    const token = sessionStorage.getItem('studybuddy_auth_token');
    if (token) {
      try {
        await fetch('/api/syllabus/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ topicId: targetTopicId, activity })
        });
      } catch (err) {
        console.warn('[Sync Topic Activity Error]:', err);
      }
    }
  };

  // Handle Log Out
  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setUser(createFreshHunterUser());
    setShowOnboarding(false);
    setShowWelcomeBack(false);
  };

  // Handle Onboarding Completion
  const handleOnboardingComplete = (
    updatedFields: Partial<HunterUser>,
    meta: { goal: string; subject: string; difficulty: string; dailyMinutes: number }
  ) => {
    setUser(prev => {
      const updated = {
        ...prev,
        ...updatedFields,
        level: 1,
        xp: 0,
        xpNext: 1000,
        hunterRank: 'E' as const,
        currentTitle: 'Awakened Novice'
      };
      scheduleCloudSync(updated, dailyQuests, shadows, skills, flashcards, exams, true);
      return updated;
    });
    setShowOnboarding(false);
    setNotification({
      isOpen: true,
      type: 'rankup',
      title: '[SYSTEM INITIALIZED]',
      message: `Hunter Profile created. Welcome to StudyBuddy AI, ${updatedFields.hunterName || 'Hunter'}. Your progression begins at Level 1.`,
      subtext: `Target: ${meta.dailyMinutes} min/day · Discipline: ${meta.subject}`
    });
  };

  // Handle Reset Progress (Destructive confirmation)
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const fresh = await requestProgressReset('RESET');
      setUser(fresh);
      setDailyQuests(createFreshDailyQuests());
      setShadows([]);
      setSkills(initialSkills.map(s => ({ ...s, level: 0, unlocked: false })));
      soundManager.playSfx('levelup');
      setNotification({
        isOpen: true,
        type: 'rankup',
        title: '[SYSTEM RESET COMPLETE]',
        message: 'Your Hunter progression has been reset to Level 1 (0 XP, Rank E). Your Google account remains active.',
        subtext: 'A clean slate for your study journey.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Level Up check helper
  const addXpAndCheckLevel = (amount: number, goldAmount = 0) => {
    setUser(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpNext = prev.xpNext;
      let newStatPoints = prev.statPoints;
      let newMaxMana = prev.maxMana;
      let newRank = prev.hunterRank;
      let leveledUp = false;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.round(newXpNext * 1.3);
        newStatPoints += 3;
        newMaxMana += 25;
        leveledUp = true;

        if (newLevel >= 40 && newRank !== 'S') {
          newRank = 'S';
        } else if (newLevel >= 30 && (newRank === 'B' || newRank === 'C')) {
          newRank = 'A';
        } else if (newLevel >= 20 && (newRank === 'C' || newRank === 'D')) {
          newRank = 'B';
        } else if (newLevel >= 10 && newRank === 'E') {
          newRank = 'D';
        }
      }

      if (leveledUp) {
        soundManager.playSfx('levelup');
        setNotification({
          isOpen: true,
          type: 'levelup',
          title: `HUNTER LEVEL INCREASED TO LV.${newLevel}!`,
          message: `Your cognitive bandwidth expands. The System acknowledges your dedication and awards +3 Stat Points and +25 Max Mana.`,
          subtext: `Rank: ${newRank} · Next Threshold: ${newXpNext.toLocaleString()} XP`,
          bonusPoints: 3
        });
      }

      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpNext: newXpNext,
        statPoints: newStatPoints,
        maxMana: newMaxMana,
        mana: newMaxMana,
        hunterRank: newRank,
        gold: prev.gold + goldAmount
      };

      scheduleCloudSync(updated, dailyQuests, shadows, skills, flashcards, exams, leveledUp);
      return updated;
    });
  };

  // Claim Daily Quest Reward (Idempotent)
  const handleClaimQuest = (questId: string) => {
    const q = dailyQuests.find(quest => quest.id === questId);
    if (!q || q.claimed || !q.completed) return;

    setDailyQuests(prev => prev.map(quest => 
      quest.id === questId ? { ...quest, claimed: true } : quest
    ));

    setUser(prev => ({
      ...prev,
      statPoints: prev.statPoints + q.rewardPoints
    }));

    addXpAndCheckLevel(q.rewardXp);
  };

  // Dungeon Gate Cleared
  const handleDungeonVictory = (_gate: DungeonGate, rewardXp: number, rewardGold: number) => {
    setUser(prev => ({
      ...prev,
      gatesCleared: prev.gatesCleared + 1
    }));

    // Update quest progress
    setDailyQuests(prev => prev.map(q => {
      if (q.id === 'quest_2') {
        const nextVal = q.current + 1;
        return { ...q, current: nextVal, completed: nextVal >= q.target };
      }
      return q;
    }));

    addXpAndCheckLevel(rewardXp, rewardGold);
  };

  // Dungeon damage taken
  const handleTakeDamage = (_dmg: number) => {
    setUser(prev => ({
      ...prev,
      mana: Math.max(0, prev.mana - 15)
    }));
  };

  // Boss Slain & Shadow Extracted
  const handleExtractShadow = (boss: Boss) => {
    const newShadow: ShadowSoldier = {
      id: `shadow_${Date.now()}`,
      name: boss.extractableShadow.name,
      grade: boss.extractableShadow.grade as ShadowSoldier['grade'],
      type: boss.extractableShadow.type,
      powerBonus: boss.extractableShadow.power,
      extractedFrom: `${boss.name} Trial`,
      perkDescription: `+30% XP bonus and mastery over ${boss.specialty}`,
      unlockedAt: new Date().toISOString().split('T')[0]
    };

    setShadows(prev => [newShadow, ...prev]);

    setNotification({
      isOpen: true,
      type: 'arise',
      title: 'SHADOW SOLDIER EXTRACTED!',
      message: `${boss.extractableShadow.name} has answered the Monarch's call. Their soul now guards your study sanctuary and provides +${boss.extractableShadow.power} Combat Power.`,
      subtext: `Shadow Grade: ${boss.extractableShadow.grade}`
    });
  };

  // Allocate Stat Point
  const handleAllocateStat = (statName: keyof HunterUser['stats']) => {
    if (user.statPoints <= 0) return;
    setUser(prev => {
      const updated = {
        ...prev,
        statPoints: prev.statPoints - 1,
        stats: {
          ...prev.stats,
          [statName]: prev.stats[statName] + 1
        }
      };
      scheduleCloudSync(updated, dailyQuests, shadows, skills, flashcards, exams);
      return updated;
    });
  };

  // Upgrade Skill
  const handleUpgradeSkill = (skillId: string) => {
    const sk = skills.find(s => s.id === skillId);
    if (!sk || user.statPoints < sk.cost || sk.level >= sk.maxLevel) return;

    setUser(prev => ({
      ...prev,
      statPoints: prev.statPoints - sk.cost
    }));

    setSkills(prev => prev.map(s => 
      s.id === skillId ? { ...s, level: s.level + 1, unlocked: true } : s
    ));
  };

  // Complete Focus Session
  const handleCompleteFocusSession = (minutes: number, xpEarned: number) => {
    setUser(prev => ({
      ...prev,
      totalStudyMinutes: prev.totalStudyMinutes + minutes,
      mana: Math.min(prev.maxMana, prev.mana + 35)
    }));

    // Update quest 1
    setDailyQuests(prev => prev.map(q => {
      if (q.id === 'quest_1') {
        const nextVal = q.current + minutes;
        return { ...q, current: nextVal, completed: nextVal >= q.target };
      }
      return q;
    }));

    addXpAndCheckLevel(xpEarned);
  };

  // Exam Topic Checkpoint Toggle
  const handleToggleTopic = (examId: string, topicName: string) => {
    setExams(prev => prev.map(ex => {
      if (ex.id === examId) {
        const updated = ex.topics.map(t => 
          t.name === topicName ? { ...t, completed: !t.completed } : t
        );
        const compCount = updated.filter(t => t.completed).length;
        const progress = Math.round((compCount / updated.length) * 100);
        return { ...ex, topics: updated, syllabusProgress: progress };
      }
      return ex;
    }));
  };

  const unclaimedQuestsCount = dailyQuests.filter(q => q.completed && !q.claimed).length;
  const mainContainerRef = useRef<HTMLElement | null>(null);

  // If session is checking or unauthenticated, show Login Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#05070f] flex items-center justify-center font-mono-tech text-cyan-400 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span>AUTHENTICATING HUNTER SESSION...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleGoogleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Anime Dark-Fantasy Background & Particle Canvas */}
      <CinematicBackground />

      {/* Top Anime Scroll Progress Indicator */}
      <ScrollProgress containerRef={mainContainerRef} />

      {/* Top Header */}
      <div className="relative z-20">
        <Header
          user={user}
          onOpenCharacterSheet={() => setCurrentTab('character')}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            soundManager.setMuted(next);
          }}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-full relative z-10">
        {/* Navigation Sidebar */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'dungeon') {
              setActiveDungeonGate(undefined);
            }
          }}
          isOpenMobile={isMobileMenuOpen}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          unclaimedQuestsCount={unclaimedQuestsCount}
        />

        {/* Dynamic View Container */}
        <main ref={mainContainerRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth relative">
          {currentTab === 'dashboard' && (
            <DashboardView
              user={user}
              dailyQuests={dailyQuests}
              gates={initialGates}
              activeSyllabus={activeSyllabus}
              onClaimQuest={handleClaimQuest}
              onSelectGate={(gate) => {
                setActiveDungeonGate(gate);
                setCurrentTab('dungeon');
              }}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
              onAllocateStat={handleAllocateStat}
              onTriggerLevelUpPreview={() => {
                soundManager.playSfx('levelup');
                setNotification({
                  isOpen: true,
                  type: 'levelup',
                  title: `HUNTER AWAKENING: LEVEL UP (LV.${user.level + 1})!`,
                  message: `A sudden influx of mana surges through your consciousness. All cognitive faculties sharpen, unlocking +3 Stat Points and expanding your Mana Core.`,
                  subtext: `Rank ${user.hunterRank} · Threshold Next: ${(user.xpNext * 1.3).toLocaleString()} XP`,
                  bonusPoints: 3
                });
              }}
            />
          )}

          {currentTab === 'progression-web' && (
            <ProgressionWebView
              user={user}
              activeSyllabus={activeSyllabus}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
              onStartQuizWithTopic={(sub, unit, top) => {
                setDrillTopicForQuiz({ subject: sub, unit, topic: top });
                setCurrentTab('quizzes');
              }}
              onStartDungeonWithTopic={(sub, unit, top) => {
                setDrillTopicForDungeon({ subject: sub, unit, topic: top });
                setCurrentTab('dungeon');
              }}
              onStartFocusWithTopic={(sub, top) => {
                setDrillTopicForFocus({ subject: sub, topic: top });
                setCurrentTab('focus');
              }}
              onRecordTopicActivity={(sub, top, act) => handleRecordTopicActivity(sub, top, act)}
              onEarnXp={(xp) => addXpAndCheckLevel(xp)}
              onLoadSampleSyllabus={handleLoadSampleSyllabus}
            />
          )}

          {currentTab === 'syllabus' && (
            <SyllabusView
              syllabi={syllabi}
              activeSyllabus={activeSyllabus}
              onSaveSyllabus={handleSaveSyllabus}
              onSetActiveSyllabus={handleSetActiveSyllabus}
              onStartQuiz={(sub, unit, top) => {
                setDrillTopicForQuiz({ subject: sub, unit, topic: top });
                setCurrentTab('quizzes');
              }}
              onStartDungeon={(sub, unit, top) => {
                setDrillTopicForDungeon({ subject: sub, unit, topic: top });
                setCurrentTab('dungeon');
              }}
              onStartFocus={(sub, top) => {
                setDrillTopicForFocus({ subject: sub, topic: top });
                setCurrentTab('focus');
              }}
              aiConfig={aiConfig}
            />
          )}

          {currentTab === 'dungeon' && (
            <DungeonBattleView
              user={user}
              gates={initialGates}
              questions={questions}
              initialGate={activeDungeonGate}
              activeSyllabus={activeSyllabus}
              initialTopicSelection={drillTopicForDungeon}
              onVictory={handleDungeonVictory}
              onTakeDamage={handleTakeDamage}
              onRecordTopicActivity={(sub, top, act) => handleRecordTopicActivity(sub, top, act)}
              onBack={() => {
                setDrillTopicForDungeon(undefined);
                setCurrentTab('dashboard');
              }}
              aiConfig={aiConfig}
            />
          )}

          {currentTab === 'boss' && (
            <BossBattleView
              user={user}
              bosses={initialBosses}
              questions={questions}
              onExtractShadow={handleExtractShadow}
              onVictory={(xp, gold) => addXpAndCheckLevel(xp, gold)}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'quizzes' && (
            <QuizzesView
              user={user}
              questions={questions}
              activeSyllabus={activeSyllabus}
              initialTopicSelection={drillTopicForQuiz}
              onAddQuestion={(q) => setQuestions(prev => [
                { ...q, id: `q_${Date.now()}` },
                ...prev
              ])}
              onEarnXp={(xp) => addXpAndCheckLevel(xp)}
              onRecordTopicActivity={(sub, top, passed) => handleRecordTopicActivity(sub, top, { quizPassed: passed })}
              aiConfig={aiConfig}
            />
          )}

          {currentTab === 'character' && (
            <CharacterView
              user={user}
              onAllocateStat={handleAllocateStat}
              onSetTitle={(title) => setUser(prev => ({ ...prev, currentTitle: title }))}
              onOpenResetModal={() => setIsResetModalOpen(true)}
            />
          )}

          {currentTab === 'shadows' && (
            <ShadowArmyView
              user={user}
              shadows={shadows}
              onDeployShadow={() => {
                addXpAndCheckLevel(80);
              }}
            />
          )}

          {currentTab === 'skills' && (
            <SkillTreeView
              user={user}
              skills={skills}
              onUpgradeSkill={handleUpgradeSkill}
            />
          )}

          {currentTab === 'revision' && (
            <RevisionLabView
              user={user}
              flashcards={flashcards}
              activeSyllabus={activeSyllabus}
              onAddCard={(card) => setFlashcards(prev => [
                { ...card, id: `fc_${Date.now()}` },
                ...prev
              ])}
              onGradeCard={() => {
                addXpAndCheckLevel(45);
              }}
              onStartQuizOnTopic={(sub, top) => {
                setDrillTopicForQuiz({ subject: sub, topic: top });
                setCurrentTab('quizzes');
              }}
            />
          )}

          {currentTab === 'focus' && (
            <FocusRoomView
              user={user}
              activeSyllabus={activeSyllabus}
              initialTopicSelection={drillTopicForFocus}
              onCompleteSession={handleCompleteFocusSession}
              onRecordTopicActivity={(sub, top, act) => handleRecordTopicActivity(sub, top, act)}
            />
          )}

          {currentTab === 'guild' && (
            <GuildHallView user={user} />
          )}

          {currentTab === 'exam' && (
            <ExamCommandView
              user={user}
              exams={exams}
              onToggleTopic={handleToggleTopic}
              onAddExam={(exam) => setExams(prev => [
                { ...exam, id: `ex_${Date.now()}` },
                ...prev
              ])}
            />
          )}

          {currentTab === 'ai' && (
            <AIAssistantView 
              user={user} 
              aiConfig={aiConfig}
              activeSyllabus={activeSyllabus}
              onOpenConfig={() => setCurrentTab('ai-config')}
            />
          )}

          {currentTab === 'ai-config' && (
            <AIConfigView
              config={aiConfig}
              onSaveConfig={handleUpdateAiConfig}
            />
          )}

          {currentTab === 'calendar' && (
            <ProgressCalendarView user={user} />
          )}

          {currentTab === 'user-guide' && (
            <UserGuideView onNavigate={(tab) => setCurrentTab(tab)} />
          )}
        </main>
      </div>

      {/* Onboarding Modal for First-Time Users */}
      {showOnboarding && (
        <OnboardingModal
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Welcome Back Modal for Returning Users */}
      {showWelcomeBack && (
        <WelcomeBackModal
          user={user}
          onContinue={() => setShowWelcomeBack(false)}
        />
      )}

      {/* Safe Progress Reset Confirmation Dialog */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        isResetting={isResetting}
      />

      {/* System Notification Overlay Modal */}
      <SystemNotificationModal
        notification={notification}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
