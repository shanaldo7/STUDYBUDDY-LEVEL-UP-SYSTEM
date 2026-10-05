/**
 * StudyBuddy AI - Monarch Hunter Study System
 * Main Web Application Entry Point
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
  AIProviderConfig 
} from './types/hunter';
import { 
  initialUser, 
  initialDailyQuests, 
  initialGates, 
  initialBosses, 
  initialQuestions, 
  initialShadows, 
  initialSkills, 
  initialFlashcards, 
  initialExams 
} from './data/initialData';
import { getDefaultAIConfig } from './utils/gemini';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
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
import { SystemNotificationModal, SystemNotification } from './components/SystemNotificationModal';
import { CinematicBackground } from './components/CinematicBackground';
import { ScrollProgress } from './components/ScrollProgress';
import { soundManager } from './utils/audio';

export default function App() {
  // Load state from localStorage or default
  const [user, setUser] = useState<HunterUser>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_user');
      return saved ? JSON.parse(saved) : initialUser;
    } catch {
      return initialUser;
    }
  });

  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_quests');
      return saved ? JSON.parse(saved) : initialDailyQuests;
    } catch {
      return initialDailyQuests;
    }
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_questions');
      return saved ? JSON.parse(saved) : initialQuestions;
    } catch {
      return initialQuestions;
    }
  });

  const [shadows, setShadows] = useState<ShadowSoldier[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_shadows');
      return saved ? JSON.parse(saved) : initialShadows;
    } catch {
      return initialShadows;
    }
  });

  const [skills, setSkills] = useState<SkillNode[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_skills');
      return saved ? JSON.parse(saved) : initialSkills;
    } catch {
      return initialSkills;
    }
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_cards');
      return saved ? JSON.parse(saved) : initialFlashcards;
    } catch {
      return initialFlashcards;
    }
  });

  const [exams, setExams] = useState<ExamMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('studybuddy_hunter_exams');
      return saved ? JSON.parse(saved) : initialExams;
    } catch {
      return initialExams;
    }
  });

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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studybuddy_hunter_user', JSON.stringify(user));
      localStorage.setItem('studybuddy_hunter_quests', JSON.stringify(dailyQuests));
      localStorage.setItem('studybuddy_hunter_questions', JSON.stringify(questions));
      localStorage.setItem('studybuddy_hunter_shadows', JSON.stringify(shadows));
      localStorage.setItem('studybuddy_hunter_skills', JSON.stringify(skills));
      localStorage.setItem('studybuddy_hunter_cards', JSON.stringify(flashcards));
      localStorage.setItem('studybuddy_hunter_exams', JSON.stringify(exams));
    } catch {
      // Ignore
    }
  }, [user, dailyQuests, questions, shadows, skills, flashcards, exams]);

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
        } else if (newLevel >= 30 && newRank === 'B') {
          newRank = 'A';
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

      return {
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
    });
  };

  // Claim Daily Quest Reward
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
  const handleDungeonVictory = (gate: DungeonGate, rewardXp: number, rewardGold: number) => {
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
  const handleTakeDamage = (dmg: number) => {
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
    setUser(prev => ({
      ...prev,
      statPoints: prev.statPoints - 1,
      stats: {
        ...prev.stats,
        [statName]: prev.stats[statName] + 1
      }
    }));
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
              onClaimQuest={handleClaimQuest}
              onSelectGate={(gate) => {
                setActiveDungeonGate(gate);
                setCurrentTab('dungeon');
              }}
              onNavigate={(tab) => setCurrentTab(tab)}
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

          {currentTab === 'dungeon' && (
            <DungeonBattleView
              user={user}
              gates={initialGates}
              questions={questions}
              initialGate={activeDungeonGate}
              onVictory={handleDungeonVictory}
              onTakeDamage={handleTakeDamage}
              onBack={() => setCurrentTab('dashboard')}
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
              onAddQuestion={(q) => setQuestions(prev => [
                { ...q, id: `q_${Date.now()}` },
                ...prev
              ])}
              onEarnXp={(xp) => addXpAndCheckLevel(xp)}
            />
          )}

          {currentTab === 'character' && (
            <CharacterView
              user={user}
              onAllocateStat={handleAllocateStat}
              onSetTitle={(title) => setUser(prev => ({ ...prev, currentTitle: title }))}
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
              onAddCard={(card) => setFlashcards(prev => [
                { ...card, id: `fc_${Date.now()}` },
                ...prev
              ])}
              onGradeCard={() => {
                addXpAndCheckLevel(45);
              }}
            />
          )}

          {currentTab === 'focus' && (
            <FocusRoomView
              user={user}
              onCompleteSession={handleCompleteFocusSession}
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
        </main>
      </div>

      {/* System Notification Overlay Modal */}
      <SystemNotificationModal
        notification={notification}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
