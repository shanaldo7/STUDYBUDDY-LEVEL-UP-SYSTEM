/**
 * StudyBuddy AI - Monarch Hunter Study System Types
 */

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

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
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  rank: 'S' | 'S+';
  hp: number;
  maxHp: number;
  specialty: string;
  lore: string;
  phases: number;
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
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
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
  dependsOn?: string;
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

