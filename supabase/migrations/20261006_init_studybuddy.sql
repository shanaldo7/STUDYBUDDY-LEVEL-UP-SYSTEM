-- StudyBuddy AI - Monarch Hunter System
-- PostgreSQL / Supabase Database Schema Migration
-- Unified data model for both Streamlit and Vercel web application

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Maps to Supabase Auth / Google OAuth)
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

-- 2. Hunter Profiles table (Core progression)
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
    study_goal TEXT,
    preferred_difficulty TEXT DEFAULT 'Normal',
    daily_goal_minutes INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quests table
CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER DEFAULT 1,
    reward_xp INTEGER DEFAULT 100,
    reward_points INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    icon TEXT,
    completion_id TEXT UNIQUE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dungeon Runs (History & Boss clears)
CREATE TABLE IF NOT EXISTS dungeon_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dungeon_name TEXT NOT NULL,
    dungeon_rank TEXT NOT NULL,
    boss_name TEXT,
    questions_answered INTEGER DEFAULT 0,
    accuracy_percent REAL DEFAULT 100.0,
    xp_earned INTEGER DEFAULT 0,
    victory INTEGER DEFAULT 1,
    completion_id TEXT UNIQUE,
    run_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quiz Results
CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    completion_id TEXT UNIQUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shadow Army (Unlocked Shadows)
CREATE TABLE IF NOT EXISTS shadow_army (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shadow_name TEXT NOT NULL,
    shadow_grade TEXT NOT NULL,
    shadow_type TEXT NOT NULL,
    power_bonus INTEGER DEFAULT 100,
    extracted_from TEXT,
    perk_description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Skills Tree Unlocks
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    skill_level INTEGER DEFAULT 1,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_id)
);

-- 8. Flashcards / Revision Lab
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    next_review_date TEXT,
    times_reviewed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Exam Milestones
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    target_score INTEGER DEFAULT 90,
    syllabus_progress INTEGER DEFAULT 0,
    notes TEXT,
    topics_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Focus & Study Sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INTEGER DEFAULT 25,
    xp_earned INTEGER DEFAULT 50,
    completed BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. User Settings & Preferences
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_subject TEXT,
    difficulty TEXT DEFAULT 'Normal',
    daily_goal INTEGER DEFAULT 50,
    sound_enabled BOOLEAN DEFAULT TRUE,
    voice_enabled BOOLEAN DEFAULT TRUE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    ai_provider TEXT DEFAULT 'gemini',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Syllabi (Multiple programs/semesters per user)
CREATE TABLE IF NOT EXISTS syllabi (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program TEXT NOT NULL,
    semester TEXT NOT NULL,
    institution TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Syllabus Subjects (Scoped to user & syllabus)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    syllabus_id TEXT NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    color TEXT,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Syllabus Units / Modules
CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Syllabus Topics
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Topic Progress (Real evidence-based mastery tracking)
CREATE TABLE IF NOT EXISTS topic_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    progress_percentage REAL DEFAULT 0.0,
    status TEXT DEFAULT 'NOT_STARTED',
    quizzes_taken INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    dungeons_cleared INTEGER DEFAULT 0,
    study_minutes INTEGER DEFAULT 0,
    quests_completed INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_topic_progress UNIQUE (user_id, topic_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_dungeon_runs_user ON dungeon_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_shadows_user ON shadow_army(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_user ON syllabi(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user ON topic_progress(user_id);
