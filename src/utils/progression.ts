/**
 * StudyBuddy AI - Central Progression Engine
 * Authoritative system for Leveling, Ranks, XP Calculations, Achievements, and Unlocks.
 */

import { 
  HunterUser, 
  HunterRank, 
  DailyQuest, 
  DungeonGate, 
  Boss, 
  ShadowSoldier, 
  SkillNode, 
  Achievement 
} from '../types/hunter';

/**
 * Calculates Rank based on Level
 */
export function calculateRankFromLevel(level: number): HunterRank {
  if (level >= 50) return 'S';
  if (level >= 40) return 'A';
  if (level >= 30) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  if (level >= 5) return 'E';
  return 'F';
}

/**
 * Calculate next XP threshold
 */
export function calculateXpThreshold(level: number): number {
  return Math.round(1000 * Math.pow(1.28, Math.max(0, level - 1)));
}

/**
 * Check if a Dungeon Gate is unlocked based on user level
 */
export function isGateUnlocked(gate: DungeonGate, userLevel: number): { unlocked: boolean; requiredLevel: number } {
  const req = gate.requiredLevel || 1;
  return {
    unlocked: userLevel >= req,
    requiredLevel: req
  };
}

/**
 * Check if a Boss is unlocked based on user level
 */
export function isBossUnlocked(boss: Boss, userLevel: number): { unlocked: boolean; requiredLevel: number } {
  const req = boss.requiredLevel || 1;
  return {
    unlocked: userLevel >= req,
    requiredLevel: req
  };
}

/**
 * Initial dynamic achievement roster
 */
export function createInitialAchievements(): Achievement[] {
  return [
    {
      id: 'ach_first_quest',
      key: 'FIRST_QUEST',
      name: 'Awakening Call',
      description: 'Claim your very first Daily Quest reward.',
      category: 'Quest',
      xpReward: 200,
      unlocked: false,
      icon: 'Scroll',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'ach_first_dungeon',
      key: 'FIRST_DUNGEON',
      name: 'Gate Infiltrator',
      description: 'Conquer your first Dungeon Gate study trial.',
      category: 'Combat',
      xpReward: 350,
      unlocked: false,
      icon: 'Swords',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'ach_boss_slayer',
      key: 'BOSS_SLAYER',
      name: 'Shadow Extraction',
      description: 'Defeat a Raid Boss and extract a Shadow Soldier.',
      category: 'Combat',
      xpReward: 600,
      unlocked: false,
      icon: 'Crown',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'ach_quiz_master',
      key: 'QUIZ_MASTER',
      name: 'Scholar of the Monarch',
      description: 'Score 100% on any subject quiz.',
      category: 'Mastery',
      xpReward: 400,
      unlocked: false,
      icon: 'Award',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'ach_level_5',
      key: 'LEVEL_5',
      name: 'Rank E Ascendant',
      description: 'Reach Hunter Level 5.',
      category: 'Mastery',
      xpReward: 500,
      unlocked: false,
      icon: 'Zap',
      progress: 1,
      maxProgress: 5
    },
    {
      id: 'ach_level_10',
      key: 'LEVEL_10',
      name: 'Rank D Veteran',
      description: 'Reach Hunter Level 10.',
      category: 'Mastery',
      xpReward: 1000,
      unlocked: false,
      icon: 'Shield',
      progress: 1,
      maxProgress: 10
    },
    {
      id: 'ach_streak_3',
      key: 'STREAK_3',
      name: 'Discipline Invariant',
      description: 'Maintain an unbroken 3-day study streak.',
      category: 'Endurance',
      xpReward: 450,
      unlocked: false,
      icon: 'Flame',
      progress: 1,
      maxProgress: 3
    },
    {
      id: 'ach_focus_50',
      key: 'FOCUS_50',
      name: 'Deep Work Resonance',
      description: 'Complete at least 50 minutes in the Focus Room.',
      category: 'Endurance',
      xpReward: 300,
      unlocked: false,
      icon: 'Clock',
      progress: 0,
      maxProgress: 50
    }
  ];
}

/**
 * Evaluates achievements on state change and returns newly unlocked ones
 */
export function evaluateAchievements(
  currentAchievements: Achievement[],
  user: HunterUser,
  quests: DailyQuest[],
  shadows: ShadowSoldier[]
): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = [];

  const updatedAchievements = currentAchievements.map(ach => {
    if (ach.unlocked) return ach;

    let shouldUnlock = false;
    let currentProg = ach.progress;

    switch (ach.key) {
      case 'FIRST_QUEST': {
        const claimedCount = quests.filter(q => q.claimed).length;
        currentProg = Math.min(ach.maxProgress, claimedCount);
        shouldUnlock = claimedCount >= 1;
        break;
      }
      case 'FIRST_DUNGEON': {
        currentProg = Math.min(ach.maxProgress, user.gatesCleared);
        shouldUnlock = user.gatesCleared >= 1;
        break;
      }
      case 'BOSS_SLAYER': {
        currentProg = Math.min(ach.maxProgress, shadows.length);
        shouldUnlock = shadows.length >= 1;
        break;
      }
      case 'LEVEL_5': {
        currentProg = Math.min(ach.maxProgress, user.level);
        shouldUnlock = user.level >= 5;
        break;
      }
      case 'LEVEL_10': {
        currentProg = Math.min(ach.maxProgress, user.level);
        shouldUnlock = user.level >= 10;
        break;
      }
      case 'STREAK_3': {
        currentProg = Math.min(ach.maxProgress, user.streakDays);
        shouldUnlock = user.streakDays >= 3;
        break;
      }
      case 'FOCUS_50': {
        currentProg = Math.min(ach.maxProgress, user.totalStudyMinutes);
        shouldUnlock = user.totalStudyMinutes >= 50;
        break;
      }
    }

    if (shouldUnlock && !ach.unlocked) {
      const unlockedAch: Achievement = {
        ...ach,
        unlocked: true,
        progress: ach.maxProgress,
        unlockedAt: new Date().toISOString()
      };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return { ...ach, progress: currentProg };
  });

  return { updatedAchievements, newlyUnlocked };
}
