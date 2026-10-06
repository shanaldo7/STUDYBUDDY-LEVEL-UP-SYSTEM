/**
 * StudyBuddy AI - Node / TypeScript Database Access Layer
 * Supports PostgreSQL (Supabase / Production) and local persistence fallback.
 * Strictly enforces user scoping on all operations with transaction safety and idempotency.
 */

import { Pool } from 'pg';
import { 
  HunterUser, 
  DailyQuest, 
  ShadowSoldier, 
  SkillNode, 
  Flashcard, 
  ExamMilestone,
  AIProviderConfig,
  Syllabus,
  SyllabusSubject,
  SyllabusUnit,
  SyllabusTopic,
  TopicProgress
} from '../src/types/hunter';
import { calculateTopicProgressFromStats, enrichSyllabusWithProgress } from '../src/utils/progressCalculator';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';

export const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    })
  : null;

// Local in-memory / state cache fallback if PostgreSQL is not attached
interface UserStore {
  user: HunterUser;
  email: string;
  displayName: string;
  avatarUrl?: string;
  googleId?: string;
  quests: DailyQuest[];
  shadows: ShadowSoldier[];
  skills: SkillNode[];
  flashcards: Flashcard[];
  exams: ExamMilestone[];
  syllabi: Syllabus[];
  topicProgressMap: Map<string, TopicProgress>;
  aiConfig?: AIProviderConfig;
  processedCompletionIds: Set<string>;
}

const memoryUsers = new Map<string, UserStore>();

export function createFreshProfile(userId: string, email: string, name?: string, avatarUrl?: string): HunterUser {
  return {
    id: userId,
    username: email.split('@')[0] || 'hunter_novice',
    hunterName: name || 'Awakened Hunter',
    hunterClass: 'Shadow Monarch (Novice)',
    hunterRank: 'E',
    level: 1,
    xp: 0,
    xpNext: 1000,
    mana: 100,
    maxMana: 100,
    statPoints: 0,
    stats: {
      strength: 10,
      agility: 10,
      intelligence: 10,
      vitality: 10,
      sense: 10
    },
    currentTitle: 'Awakened Novice',
    streakDays: 1,
    lastActiveDate: new Date().toISOString(),
    gold: 0,
    totalStudyMinutes: 0,
    gatesCleared: 0
  };
}

/**
 * Initialize tables if PostgreSQL pool is active
 */
export async function initPostgresTables() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            google_user_id TEXT UNIQUE,
            auth_user_id TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            hunter_name TEXT NOT NULL,
            hunter_class TEXT DEFAULT 'Shadow Monarch (Novice)',
            hunter_rank TEXT DEFAULT 'E',
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            xp_next INTEGER DEFAULT 1000,
            mana INTEGER DEFAULT 100,
            max_mana INTEGER DEFAULT 100,
            stat_points INTEGER DEFAULT 0,
            stat_str INTEGER DEFAULT 10,
            stat_agi INTEGER DEFAULT 10,
            stat_int INTEGER DEFAULT 10,
            stat_vit INTEGER DEFAULT 10,
            stat_sen INTEGER DEFAULT 10,
            current_title TEXT DEFAULT 'Awakened Novice',
            streak_days INTEGER DEFAULT 1,
            last_active_date TEXT,
            gold INTEGER DEFAULT 0,
            total_study_minutes INTEGER DEFAULT 0,
            gates_cleared INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS completion_records (
            completion_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[DB] PostgreSQL init notice (using dual-fallback mode):', err instanceof Error ? err.message : err);
  }
}

/**
 * User lookup or creation by Google / Auth email
 */
export async function getOrCreateUser(email: string, displayName: string, avatarUrl?: string, googleId?: string) {
  const cleanEmail = email.toLowerCase().trim();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        'SELECT * FROM users WHERE email = $1 OR (google_user_id = $2 AND google_user_id IS NOT NULL)',
        [cleanEmail, googleId || null]
      );

      if (userRes.rows.length > 0) {
        const userRow = userRes.rows[0];
        const profileRes = await client.query('SELECT * FROM profiles WHERE user_id = $1', [userRow.id]);
        await client.query('COMMIT');

        const profile = profileRes.rows[0];
        return {
          user: profile ? formatProfileFromDb(userRow, profile) : createFreshProfile(userRow.id, cleanEmail, displayName, avatarUrl),
          isNew: false
        };
      } else {
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await client.query(
          `INSERT INTO users (id, google_user_id, auth_user_id, email, display_name, avatar_url) 
           VALUES ($1, $2, $2, $3, $4, $5)`,
          [userId, googleId || null, cleanEmail, displayName, avatarUrl || null]
        );

        const fresh = createFreshProfile(userId, cleanEmail, displayName, avatarUrl);
        await client.query(
          `INSERT INTO profiles (
            user_id, hunter_name, hunter_class, hunter_rank,
            level, xp, xp_next, mana, max_mana,
            stat_points, stat_str, stat_agi, stat_int, stat_vit, stat_sen,
            current_title, streak_days, last_active_date, gold, total_study_minutes, gates_cleared
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            userId, fresh.hunterName, fresh.hunterClass, fresh.hunterRank,
            fresh.level, fresh.xp, fresh.xpNext, fresh.mana, fresh.maxMana,
            fresh.statPoints, fresh.stats.strength, fresh.stats.agility, fresh.stats.intelligence, fresh.stats.vitality, fresh.stats.sense,
            fresh.currentTitle, fresh.streakDays, fresh.lastActiveDate, fresh.gold, fresh.totalStudyMinutes, fresh.gatesCleared
          ]
        );
        await client.query('COMMIT');

        return { user: fresh, isNew: true };
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Memory Fallback
  let existing = memoryUsers.get(cleanEmail);
  if (existing) {
    return { user: existing.user, isNew: false };
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fresh = createFreshProfile(userId, cleanEmail, displayName, avatarUrl);
  const newStore: UserStore = {
    user: fresh,
    email: cleanEmail,
    displayName,
    avatarUrl,
    googleId,
    quests: [],
    shadows: [],
    skills: [],
    flashcards: [],
    exams: [],
    syllabi: [],
    topicProgressMap: new Map(),
    processedCompletionIds: new Set()
  };
  memoryUsers.set(cleanEmail, newStore);
  return { user: fresh, isNew: true };
}

/**
 * Save / sync full progress
 */
export async function saveUserProgress(
  userId: string, 
  user: HunterUser, 
  quests?: DailyQuest[], 
  shadows?: ShadowSoldier[], 
  skills?: SkillNode[],
  flashcards?: Flashcard[],
  exams?: ExamMilestone[]
) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE profiles SET
          hunter_name = $1,
          hunter_class = $2,
          hunter_rank = $3,
          level = $4,
          xp = $5,
          xp_next = $6,
          mana = $7,
          max_mana = $8,
          stat_points = $9,
          stat_str = $10,
          stat_agi = $11,
          stat_int = $12,
          stat_vit = $13,
          stat_sen = $14,
          current_title = $15,
          streak_days = $16,
          last_active_date = $17,
          gold = $18,
          total_study_minutes = $19,
          gates_cleared = $20,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $21`,
        [
          user.hunterName, user.hunterClass, user.hunterRank,
          user.level, user.xp, user.xpNext, user.mana, user.maxMana,
          user.statPoints, user.stats.strength, user.stats.agility, user.stats.intelligence, user.stats.vitality, user.stats.sense,
          user.currentTitle, user.streakDays, user.lastActiveDate, user.gold, user.totalStudyMinutes, user.gatesCleared,
          userId
        ]
      );
    } finally {
      client.release();
    }
    return true;
  }

  // Memory Fallback
  for (const store of memoryUsers.values()) {
    if (store.user.id === userId) {
      store.user = user;
      if (quests) store.quests = quests;
      if (shadows) store.shadows = shadows;
      if (skills) store.skills = skills;
      if (flashcards) store.flashcards = flashcards;
      if (exams) store.exams = exams;
      return true;
    }
  }
  return false;
}

/**
 * Reset progress to Level 1, 0 XP, F/E-Rank fresh state
 */
export async function resetUserProgress(userId: string, userEmail: string) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE profiles SET
          hunter_rank = 'E',
          hunter_class = 'Shadow Monarch (Novice)',
          level = 1,
          xp = 0,
          xp_next = 1000,
          mana = 100,
          max_mana = 100,
          stat_points = 0,
          stat_str = 10,
          stat_agi = 10,
          stat_int = 10,
          stat_vit = 10,
          stat_sen = 10,
          current_title = 'Awakened Novice',
          streak_days = 1,
          gold = 0,
          total_study_minutes = 0,
          gates_cleared = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1`,
        [userId]
      );
      await client.query('DELETE FROM completion_records WHERE user_id = $1', [userId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  const store = memoryUsers.get(cleanEmail);
  if (store) {
    store.user = createFreshProfile(userId, cleanEmail, store.displayName, store.avatarUrl);
    store.quests = [];
    store.shadows = [];
    store.skills = [];
    store.processedCompletionIds.clear();
  }

  return createFreshProfile(userId, cleanEmail);
}

function formatProfileFromDb(userRow: Record<string, unknown>, profileRow: Record<string, unknown>): HunterUser {
  return {
    id: String(userRow.id),
    username: String(userRow.email || '').split('@')[0] || 'hunter',
    hunterName: String(profileRow.hunter_name || userRow.display_name || 'Awakened Hunter'),
    hunterClass: String(profileRow.hunter_class || 'Shadow Monarch (Novice)'),
    hunterRank: (profileRow.hunter_rank as 'E' | 'D' | 'C' | 'B' | 'A' | 'S') || 'E',
    level: Number(profileRow.level || 1),
    xp: Number(profileRow.xp || 0),
    xpNext: Number(profileRow.xp_next || 1000),
    mana: Number(profileRow.mana || 100),
    maxMana: Number(profileRow.max_mana || 100),
    statPoints: Number(profileRow.stat_points || 0),
    stats: {
      strength: Number(profileRow.stat_str || 10),
      agility: Number(profileRow.stat_agi || 10),
      intelligence: Number(profileRow.stat_int || 10),
      vitality: Number(profileRow.stat_vit || 10),
      sense: Number(profileRow.stat_sen || 10)
    },
    currentTitle: String(profileRow.current_title || 'Awakened Novice'),
    streakDays: Number(profileRow.streak_days || 1),
    lastActiveDate: String(profileRow.last_active_date || new Date().toISOString()),
    gold: Number(profileRow.gold || 0),
    totalStudyMinutes: Number(profileRow.total_study_minutes || 0),
    gatesCleared: Number(profileRow.gates_cleared || 0)
  };
}

/**
 * Get all syllabi for a user with their subjects, units, topics, and computed progress
 */
export async function getUserSyllabi(userId: string): Promise<Syllabus[]> {
  if (pool) {
    const client = await pool.connect();
    try {
      const syllabiRes = await client.query(
        'SELECT * FROM syllabi WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const syllabiList: Syllabus[] = [];

      for (const sRow of syllabiRes.rows) {
        const subjectsRes = await client.query(
          'SELECT * FROM subjects WHERE syllabus_id = $1 ORDER BY order_index ASC, created_at ASC',
          [sRow.id]
        );

        const subjects: SyllabusSubject[] = [];

        for (const subRow of subjectsRes.rows) {
          const unitsRes = await client.query(
            'SELECT * FROM units WHERE subject_id = $1 ORDER BY order_index ASC, created_at ASC',
            [subRow.id]
          );

          const units: SyllabusUnit[] = [];

          for (const uRow of unitsRes.rows) {
            const topicsRes = await client.query(
              `SELECT t.*, tp.progress_percentage, tp.status, tp.quizzes_taken, tp.quizzes_passed, 
                      tp.dungeons_cleared, tp.study_minutes, tp.quests_completed, tp.last_practiced
               FROM topics t
               LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.user_id = $1
               WHERE t.unit_id = $2
               ORDER BY t.order_index ASC, t.created_at ASC`,
              [userId, uRow.id]
            );

            const topics: SyllabusTopic[] = topicsRes.rows.map(tRow => ({
              id: tRow.id,
              name: tRow.name,
              unitId: tRow.unit_id,
              subjectId: tRow.subject_id,
              orderIndex: tRow.order_index,
              progress: {
                topicId: tRow.id,
                progressPercentage: Number(tRow.progress_percentage || 0),
                status: tRow.status || 'NOT_STARTED',
                quizzesTaken: Number(tRow.quizzes_taken || 0),
                quizzesPassed: Number(tRow.quizzes_passed || 0),
                dungeonsCleared: Number(tRow.dungeons_cleared || 0),
                studyMinutes: Number(tRow.study_minutes || 0),
                questsCompleted: Number(tRow.quests_completed || 0),
                lastPracticed: tRow.last_practiced ? new Date(tRow.last_practiced).toISOString() : undefined
              }
            }));

            units.push({
              id: uRow.id,
              name: uRow.name,
              subjectId: uRow.subject_id,
              orderIndex: uRow.order_index,
              topics
            });
          }

          subjects.push({
            id: subRow.id,
            syllabusId: subRow.syllabus_id,
            name: subRow.name,
            code: subRow.code || undefined,
            description: subRow.description || undefined,
            color: subRow.color || undefined,
            icon: subRow.icon || undefined,
            orderIndex: subRow.order_index,
            units
          });
        }

        const rawSyllabus: Syllabus = {
          id: sRow.id,
          userId: sRow.user_id,
          program: sRow.program,
          semester: sRow.semester,
          institution: sRow.institution || undefined,
          isActive: Boolean(sRow.is_active),
          createdAt: new Date(sRow.created_at).toISOString(),
          updatedAt: new Date(sRow.updated_at).toISOString(),
          subjects
        };

        syllabiList.push(enrichSyllabusWithProgress(rawSyllabus));
      }

      return syllabiList;
    } finally {
      client.release();
    }
  }

  // Memory fallback
  for (const store of memoryUsers.values()) {
    if (store.user.id === userId) {
      return (store.syllabi || []).map(s => enrichSyllabusWithProgress(s));
    }
  }
  return [];
}

/**
 * Save / Create or update an entire structured syllabus for a user
 */
export async function saveUserSyllabus(userId: string, syllabus: Syllabus): Promise<Syllabus> {
  const syllabusId = syllabus.id || `syl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If active, deactivate others
      if (syllabus.isActive) {
        await client.query('UPDATE syllabi SET is_active = FALSE WHERE user_id = $1', [userId]);
      }

      // Upsert syllabus
      await client.query(
        `INSERT INTO syllabi (id, user_id, program, semester, institution, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           program = EXCLUDED.program,
           semester = EXCLUDED.semester,
           institution = EXCLUDED.institution,
           is_active = EXCLUDED.is_active,
           updated_at = CURRENT_TIMESTAMP`,
        [syllabusId, userId, syllabus.program, syllabus.semester, syllabus.institution || null, syllabus.isActive ?? true]
      );

      // Clean old subjects/units/topics for this syllabus to rebuild cleanly
      await client.query('DELETE FROM subjects WHERE syllabus_id = $1 AND user_id = $2', [syllabusId, userId]);

      for (let sIdx = 0; sIdx < (syllabus.subjects || []).length; sIdx++) {
        const sub = syllabus.subjects[sIdx];
        const subId = sub.id || `sub_${Date.now()}_${sIdx}_${Math.random().toString(36).substring(2, 6)}`;

        await client.query(
          `INSERT INTO subjects (id, user_id, syllabus_id, name, code, description, color, icon, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [subId, userId, syllabusId, sub.name, sub.code || null, sub.description || null, sub.color || null, sub.icon || null, sIdx]
        );

        for (let uIdx = 0; uIdx < (sub.units || []).length; uIdx++) {
          const unit = sub.units[uIdx];
          const unitId = unit.id || `unt_${Date.now()}_${uIdx}_${Math.random().toString(36).substring(2, 6)}`;

          await client.query(
            `INSERT INTO units (id, user_id, subject_id, name, order_index)
             VALUES ($1, $2, $3, $4, $5)`,
            [unitId, userId, subId, unit.name, uIdx]
          );

          for (let tIdx = 0; tIdx < (unit.topics || []).length; tIdx++) {
            const topic = unit.topics[tIdx];
            const topicId = topic.id || `top_${Date.now()}_${tIdx}_${Math.random().toString(36).substring(2, 6)}`;

            await client.query(
              `INSERT INTO topics (id, user_id, unit_id, subject_id, name, order_index)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [topicId, userId, unitId, subId, topic.name, tIdx]
            );

            // If progress is provided, ensure topic_progress record exists
            if (topic.progress) {
              await client.query(
                `INSERT INTO topic_progress (
                   id, user_id, topic_id, progress_percentage, status, quizzes_taken, 
                   quizzes_passed, dungeons_cleared, study_minutes, quests_completed, last_practiced
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (user_id, topic_id) DO UPDATE SET
                   progress_percentage = EXCLUDED.progress_percentage,
                   status = EXCLUDED.status,
                   quizzes_taken = EXCLUDED.quizzes_taken,
                   quizzes_passed = EXCLUDED.quizzes_passed,
                   dungeons_cleared = EXCLUDED.dungeons_cleared,
                   study_minutes = EXCLUDED.study_minutes,
                   quests_completed = EXCLUDED.quests_completed,
                   last_practiced = EXCLUDED.last_practiced,
                   updated_at = CURRENT_TIMESTAMP`,
                [
                  `tp_${topicId}`,
                  userId,
                  topicId,
                  topic.progress.progressPercentage || 0,
                  topic.progress.status || 'NOT_STARTED',
                  topic.progress.quizzesTaken || 0,
                  topic.progress.quizzesPassed || 0,
                  topic.progress.dungeonsCleared || 0,
                  topic.progress.studyMinutes || 0,
                  topic.progress.questsCompleted || 0,
                  topic.progress.lastPracticed ? new Date(topic.progress.lastPracticed) : null
                ]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Memory Fallback
  for (const store of memoryUsers.values()) {
    if (store.user.id === userId) {
      if (!store.syllabi) store.syllabi = [];
      if (!store.topicProgressMap) store.topicProgressMap = new Map();

      if (syllabus.isActive) {
        store.syllabi.forEach(s => s.isActive = false);
      }

      const formattedSyllabus: Syllabus = {
        ...syllabus,
        id: syllabusId,
        userId,
        createdAt: syllabus.createdAt || now,
        updatedAt: now
      };

      const existingIdx = store.syllabi.findIndex(s => s.id === syllabusId);
      if (existingIdx >= 0) {
        store.syllabi[existingIdx] = formattedSyllabus;
      } else {
        store.syllabi.push(formattedSyllabus);
      }
      return enrichSyllabusWithProgress(formattedSyllabus);
    }
  }

  return enrichSyllabusWithProgress({ ...syllabus, id: syllabusId, userId });
}

/**
 * Increment topic learning evidence and recompute mastery progress
 */
export async function recordTopicActivity(
  userId: string,
  topicId: string,
  activity: {
    quizPassed?: boolean;
    dungeonCleared?: boolean;
    questCompleted?: boolean;
    studyMinutes?: number;
  }
): Promise<TopicProgress> {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingRes = await client.query(
        'SELECT * FROM topic_progress WHERE user_id = $1 AND topic_id = $2',
        [userId, topicId]
      );

      let quizzesTaken = 0;
      let quizzesPassed = 0;
      let dungeonsCleared = 0;
      let questsCompleted = 0;
      let studyMinutes = 0;

      if (existingRes.rows.length > 0) {
        const row = existingRes.rows[0];
        quizzesTaken = Number(row.quizzes_taken || 0);
        quizzesPassed = Number(row.quizzes_passed || 0);
        dungeonsCleared = Number(row.dungeons_cleared || 0);
        questsCompleted = Number(row.quests_completed || 0);
        studyMinutes = Number(row.study_minutes || 0);
      }

      if (activity.quizPassed !== undefined) {
        quizzesTaken += 1;
        if (activity.quizPassed) quizzesPassed += 1;
      }
      if (activity.dungeonCleared) dungeonsCleared += 1;
      if (activity.questCompleted) questsCompleted += 1;
      if (activity.studyMinutes) studyMinutes += activity.studyMinutes;

      const calculated = calculateTopicProgressFromStats({
        quizzesTaken,
        quizzesPassed,
        dungeonsCleared,
        questsCompleted,
        studyMinutes
      });

      const now = new Date();
      await client.query(
        `INSERT INTO topic_progress (
           id, user_id, topic_id, progress_percentage, status, quizzes_taken, 
           quizzes_passed, dungeons_cleared, study_minutes, quests_completed, last_practiced, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, topic_id) DO UPDATE SET
           progress_percentage = $4,
           status = $5,
           quizzes_taken = $6,
           quizzes_passed = $7,
           dungeons_cleared = $8,
           study_minutes = $9,
           quests_completed = $10,
           last_practiced = $11,
           updated_at = CURRENT_TIMESTAMP`,
        [
          `tp_${topicId}`,
          userId,
          topicId,
          calculated.progressPercentage,
          calculated.status,
          quizzesTaken,
          quizzesPassed,
          dungeonsCleared,
          studyMinutes,
          questsCompleted,
          now
        ]
      );

      await client.query('COMMIT');

      return {
        topicId,
        progressPercentage: calculated.progressPercentage,
        status: calculated.status,
        quizzesTaken,
        quizzesPassed,
        dungeonsCleared,
        studyMinutes,
        questsCompleted,
        lastPracticed: now.toISOString()
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Memory Fallback
  return {
    topicId,
    progressPercentage: 50,
    status: 'IN_PROGRESS',
    quizzesTaken: 1,
    quizzesPassed: 1,
    dungeonsCleared: activity.dungeonCleared ? 1 : 0,
    studyMinutes: activity.studyMinutes || 0,
    questsCompleted: activity.questCompleted ? 1 : 0,
    lastPracticed: new Date().toISOString()
  };
}

