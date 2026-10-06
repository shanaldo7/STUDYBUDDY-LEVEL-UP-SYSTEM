"""
StudyBuddy AI - Database & Storage Layer
Monarch Hunter System - Dual-engine repository supporting PostgreSQL (Supabase / Production) 
and SQLite (Local Development) with identical user-scoped data models.
"""

import os
import sqlite3
import json
from datetime import datetime, date

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
DB_PATH = os.path.join(os.path.dirname(__file__), "studybuddy.db")

# Try importing psycopg2 for PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

def is_postgres():
    return bool(DATABASE_URL and HAS_PSYCOPG2)

def get_connection():
    if is_postgres():
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    if is_postgres():
        cursor.execute("""
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
            study_goal TEXT,
            preferred_difficulty TEXT DEFAULT 'Normal',
            daily_goal_minutes INTEGER DEFAULT 50,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS units (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
            subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

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
        """)
    else:
        # SQLite schema
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            google_user_id TEXT UNIQUE,
            auth_user_id TEXT UNIQUE,
            email TEXT UNIQUE,
            display_name TEXT,
            avatar_url TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        """)

        # Migration check: Ensure columns exist in SQLite users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [row["name"] for row in cursor.fetchall()]
        if "email" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        if "google_user_id" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN google_user_id TEXT")
        if "auth_user_id" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN auth_user_id TEXT")
        if "display_name" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN display_name TEXT")
        if "avatar_url" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        if "created_at" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
        if "updated_at" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at TEXT")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
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
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS quests (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            current_progress INTEGER DEFAULT 0,
            target_progress INTEGER DEFAULT 1,
            reward_xp INTEGER DEFAULT 100,
            reward_points INTEGER DEFAULT 1,
            completed INTEGER DEFAULT 0,
            claimed INTEGER DEFAULT 0,
            icon TEXT,
            completion_id TEXT UNIQUE,
            completed_at TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS dungeon_runs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            dungeon_name TEXT NOT NULL,
            dungeon_rank TEXT NOT NULL,
            boss_name TEXT,
            questions_answered INTEGER,
            accuracy_percent REAL,
            xp_earned INTEGER,
            victory INTEGER DEFAULT 1,
            completion_id TEXT UNIQUE,
            run_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS shadow_army (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            shadow_name TEXT NOT NULL,
            shadow_grade TEXT NOT NULL,
            shadow_type TEXT NOT NULL,
            power_bonus INTEGER DEFAULT 100,
            extracted_from TEXT,
            perk_description TEXT,
            unlocked_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            skill_name TEXT NOT NULL,
            branch TEXT NOT NULL,
            skill_level INTEGER DEFAULT 1,
            unlocked INTEGER DEFAULT 0,
            unlocked_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            difficulty INTEGER DEFAULT 1,
            next_review_date TEXT,
            times_reviewed INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            exam_title TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_date TEXT NOT NULL,
            target_score INTEGER DEFAULT 90,
            syllabus_progress INTEGER DEFAULT 0,
            notes TEXT,
            topics_json TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS syllabi (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            program TEXT NOT NULL,
            semester TEXT NOT NULL,
            institution TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            syllabus_id TEXT NOT NULL,
            name TEXT NOT NULL,
            code TEXT,
            description TEXT,
            color TEXT,
            icon TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (syllabus_id) REFERENCES syllabi(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS units (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            unit_id TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (unit_id) REFERENCES units(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topic_progress (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            progress_percentage REAL DEFAULT 0.0,
            status TEXT DEFAULT 'NOT_STARTED',
            quizzes_taken INTEGER DEFAULT 0,
            quizzes_passed INTEGER DEFAULT 0,
            dungeons_cleared INTEGER DEFAULT 0,
            study_minutes INTEGER DEFAULT 0,
            quests_completed INTEGER DEFAULT 0,
            last_practiced TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (topic_id) REFERENCES topics(id),
            UNIQUE(user_id, topic_id)
        );
        """)

    conn.commit()
    conn.close()

def get_or_create_user(email, display_name="Hunter", avatar_url=None, google_id=None):
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Look up user by email or google_id
    if is_postgres():
        cursor.execute("SELECT * FROM users WHERE email = %s OR (google_user_id = %s AND google_user_id IS NOT NULL)", (email, google_id))
    else:
        cursor.execute("SELECT * FROM users WHERE email = ? OR (google_user_id = ? AND google_user_id IS NOT NULL)", (email, google_id))
    
    row = cursor.fetchone()
    now_str = datetime.now().isoformat()

    if row:
        user_dict = dict(row)
        user_id = user_dict["id"]
        # Fetch profile
        if is_postgres():
            cursor.execute("SELECT * FROM profiles WHERE user_id = %s", (user_id,))
        else:
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
        profile_row = cursor.fetchone()
        profile_dict = dict(profile_row) if profile_row else None
        conn.close()
        return user_dict, profile_dict, False # False = not newly created
    else:
        # Create brand-new Level 1 user
        user_id = f"usr_{int(datetime.now().timestamp())}_{os.urandom(3).hex()}"
        if is_postgres():
            cursor.execute("""
            INSERT INTO users (id, google_user_id, auth_user_id, email, display_name, avatar_url, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (user_id, google_id, google_id, email, display_name, avatar_url))

            cursor.execute("""
            INSERT INTO profiles (
                user_id, hunter_name, hunter_class, hunter_rank,
                level, xp, xp_next, mana, max_mana,
                stat_points, stat_str, stat_agi, stat_int, stat_vit, stat_sen,
                current_title, streak_days, last_active_date, gold, total_study_minutes, gates_cleared
            ) VALUES (
                %s, %s, 'Shadow Monarch (Novice)', 'E',
                1, 0, 1000, 100, 100,
                0, 10, 10, 10, 10, 10,
                'Awakened Novice', 1, %s, 0, 0, 0
            )
            """, (user_id, display_name, now_str))
        else:
            uname = email.split('@')[0] if email else 'hunter'
            hname = display_name or 'Awakened Hunter'
            try:
                cursor.execute("""
                INSERT INTO users (id, username, hunter_name, google_user_id, auth_user_id, email, display_name, avatar_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, uname, hname, google_id, google_id, email, display_name, avatar_url, now_str, now_str))
            except Exception:
                cursor.execute("""
                INSERT INTO users (username, hunter_name, google_user_id, auth_user_id, email, display_name, avatar_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (uname, hname, google_id, google_id, email, display_name, avatar_url, now_str, now_str))
                user_id = str(cursor.lastrowid)

            cursor.execute("""
            INSERT OR REPLACE INTO profiles (
                user_id, hunter_name, hunter_class, hunter_rank,
                level, xp, xp_next, mana, max_mana,
                stat_points, stat_str, stat_agi, stat_int, stat_vit, stat_sen,
                current_title, streak_days, last_active_date, gold, total_study_minutes, gates_cleared,
                created_at, updated_at
            ) VALUES (
                ?, ?, 'Shadow Monarch (Novice)', 'E',
                1, 0, 1000, 100, 100,
                0, 10, 10, 10, 10, 10,
                'Awakened Novice', 1, ?, 0, 0, 0,
                ?, ?
            )
            """, (user_id, display_name, now_str, now_str, now_str))

        conn.commit()

        # Re-fetch new records
        if is_postgres():
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user_dict = dict(cursor.fetchone())
            cursor.execute("SELECT * FROM profiles WHERE user_id = %s", (user_id,))
            profile_dict = dict(cursor.fetchone())
        else:
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_dict = dict(cursor.fetchone())
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
            profile_dict = dict(cursor.fetchone())

        conn.close()
        return user_dict, profile_dict, True # True = newly created

def get_current_user():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at ASC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        user, profile, _ = get_or_create_user("novice@studybuddy.ai", "Novice Hunter")
        return {**user, **profile}
    user_dict = dict(row)
    conn.close()
    return user_dict

def reset_user_progress(user_id):
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    now_str = datetime.now().isoformat()
    if is_postgres():
        # Reset profile to Level 1, 0 XP, fresh stats
        cursor.execute("""
        UPDATE profiles SET
            level = 1,
            xp = 0,
            xp_next = 1000,
            hunter_rank = 'E',
            hunter_class = 'Shadow Monarch (Novice)',
            current_title = 'Awakened Novice',
            mana = 100,
            max_mana = 100,
            stat_points = 0,
            stat_str = 10,
            stat_agi = 10,
            stat_int = 10,
            stat_vit = 10,
            stat_sen = 10,
            streak_days = 1,
            gold = 0,
            total_study_minutes = 0,
            gates_cleared = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = %s
        """, (user_id,))

        # Clear progress tables for this user
        cursor.execute("DELETE FROM quests WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM dungeon_runs WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM shadow_army WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM skills WHERE user_id = %s", (user_id,))
    else:
        cursor.execute("""
        UPDATE profiles SET
            level = 1,
            xp = 0,
            xp_next = 1000,
            hunter_rank = 'E',
            hunter_class = 'Shadow Monarch (Novice)',
            current_title = 'Awakened Novice',
            mana = 100,
            max_mana = 100,
            stat_points = 0,
            stat_str = 10,
            stat_agi = 10,
            stat_int = 10,
            stat_vit = 10,
            stat_sen = 10,
            streak_days = 1,
            gold = 0,
            total_study_minutes = 0,
            gates_cleared = 0,
            updated_at = ?
        WHERE user_id = ?
        """, (now_str, user_id))

        cursor.execute("DELETE FROM quests WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM dungeon_runs WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM shadow_army WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM skills WHERE user_id = ?", (user_id,))

    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
