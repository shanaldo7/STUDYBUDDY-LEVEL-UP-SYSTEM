/**
 * StudyBuddy AI - Monarch Hunter Study System Types
 */

export type HunterRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface TopicProgress {
  topicId: string;
  progressPercentage: number; // 0 to 100
  status: TopicStatus;
  quizzesTaken: number;
  quizzesPassed: number;
  dungeonsCleared: number;
  studyMinutes: number;
  questsCompleted: number;
  lastPracticed?: string;
}

export interface SyllabusTopic {
  id: string;
  name: string;
  unitId: string;
  subjectId: string;
  orderIndex?: number;
  progress?: TopicProgress;
}

export interface SyllabusUnit {
  id: string;
  name: string;
  subjectId: string;
  orderIndex?: number;
  topics: SyllabusTopic[];
  progressPercentage?: number;
}

export interface SyllabusSubject {
  id: string;
  syllabusId: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  icon?: string;
  orderIndex?: number;
  units: SyllabusUnit[];
  progressPercentage?: number;
}

export interface Syllabus {
  id: string;
  userId: string;
  program: string; // e.g. "BCA", "B.Tech CSE", "Class 12 Science", "Medical"
  semester: string; // e.g. "Semester 3", "Year 1", "Term 2"
  institution?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjects: SyllabusSubject[];
  progressPercentage?: number;
}

export interface HunterUser {
  id: string;
  username: string;
  hunterName: string;
  hunterClass: string;
  hunterRank: HunterRank;
  level: number;
  xp: number;
  xpNext: number;
  mana: number;
  maxMana: number;
  statPoints: number;
  stats: {
    strength: number;     // Grit & Work Ethic
    agility: number;      // Problem Solving Speed
    intelligence: number; // Deep Concept Mastery
    vitality: number;     // Study Endurance
    sense: number;        // Intuition & Analysis
  };
  currentTitle: string;
  streakDays: number;
  lastActiveDate: string;
  gold: number;
  totalStudyMinutes: number;
  gatesCleared: number;
  email?: string;
  avatarUrl?: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardXp: number;
  rewardPoints: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  subject?: string;
  completionId?: string;
}

export interface DungeonGate {
  id: string;
  name: string;
  rank: HunterRank;
  subject: string;
  description: string;
  monsterName: string;
  monsterHp: number;
  maxHp: number;
  monsterType: string;
  rewardXp: number;
  rewardGold: number;
  color: string;
  requiredLevel: number;
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';
  hp: number;
  maxHp: number;
  specialty: string;
  lore: string;
  phases: number;
  requiredLevel: number;
  xpBonus: number;
  element?: string;
  extractableShadow: {
    name: string;
    grade: string;
    type: string;
    power: number;
  };
}

export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
}

export interface ShadowSoldier {
  id: string;
  name: string;
  grade: 'Normal' | 'Elite' | 'Knight' | 'Elite Knight' | 'Marshal' | 'Grand Marshal';
  type: string;
  powerBonus: number;
  extractedFrom: string;
  perkDescription: string;
  unlockedAt: string;
}

export interface SkillNode {
  id: string;
  name: string;
  branch: 'Shadow' | 'Cognitive' | 'Battle';
  description: string;
  cost: number;
  unlocked: boolean;
  level: number;
  maxLevel: number;
  icon: string;
  requiredLevel: number;
  dependsOn?: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'Quest' | 'Combat' | 'Mastery' | 'Endurance';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  progress: number;
  maxProgress: number;
}

export interface Flashcard {
  id: string;
  subject: string;
  question: string;
  answer: string;
  difficulty: number; // 1 to 5
  nextReview: string;
  reviewsCount: number;
}

export interface ExamMilestone {
  id: string;
  title: string;
  subject: string;
  date: string;
  targetScore: number;
  syllabusProgress: number;
  notes: string;
  topics: { name: string; completed: boolean }[];
}

export interface CombatLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'player-hit' | 'monster-hit' | 'heal' | 'system' | 'loot';
}

export type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'groq' | 'together' | 'ollama' | 'custom';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}
