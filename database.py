"""
StudyBuddy AI - Database & Storage Layer
Monarch Hunter System - Persistent SQLite storage for users, stats, dungeon runs, shadows, skills, and exams.
"""

import os
import sqlite3
import json
from datetime import datetime, date

DB_PATH = os.path.join(os.path.dirname(__file__), "studybuddy.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # User profile & Hunter stats
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hunter_name TEXT NOT NULL,
        hunter_class TEXT DEFAULT 'Shadow Monarch',
        hunter_rank TEXT DEFAULT 'E',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        xp_next INTEGER DEFAULT 1000,
        mana INTEGER DEFAULT 100,
        max_mana INTEGER DEFAULT 100,
        stat_points INTEGER DEFAULT 5,
        stat_str INTEGER DEFAULT 10,
        stat_agi INTEGER DEFAULT 10,
        stat_int INTEGER DEFAULT 10,
        stat_vit INTEGER DEFAULT 10,
        stat_sen INTEGER DEFAULT 10,
        current_title TEXT DEFAULT 'Awakened Novice',
        streak_days INTEGER DEFAULT 1,
        last_active_date TEXT,
        created_at TEXT
    )
    """)

    # Shadow Army soldiers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shadow_army (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        shadow_name TEXT NOT NULL,
        shadow_grade TEXT NOT NULL,
        shadow_type TEXT NOT NULL,
        power_bonus INTEGER DEFAULT 100,
        extracted_from TEXT,
        unlocked_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Skill tree unlocks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        skill_level INTEGER DEFAULT 1,
        unlocked_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Dungeon raid battle logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dungeon_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        dungeon_name TEXT NOT NULL,
        dungeon_rank TEXT NOT NULL,
        boss_name TEXT,
        questions_answered INTEGER,
        accuracy_percent REAL,
        xp_earned INTEGER,
        victory INTEGER DEFAULT 1,
        run_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Exam command center milestones
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_title TEXT NOT NULL,
        subject TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        target_score INTEGER DEFAULT 90,
        syllabus_progress INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Flashcard revision lab
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty INTEGER DEFAULT 1,
        next_review_date TEXT,
        times_reviewed INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Seed default user if not exists
    cursor.execute("SELECT COUNT(*) as cnt FROM users")
    if cursor.fetchone()["cnt"] == 0:
        today_str = date.today().isoformat()
        cursor.execute("""
        INSERT INTO users (
            username, hunter_name, hunter_class, hunter_rank,
            level, xp, xp_next, mana, max_mana,
            stat_points, stat_str, stat_agi, stat_int, stat_vit, stat_sen,
            current_title, streak_days, last_active_date, created_at
        ) VALUES (
            'hunter_default', 'Sung Jin-Study', 'Shadow Monarch', 'B',
            24, 3850, 5000, 180, 200,
            12, 45, 38, 72, 40, 50,
            'Monarch of Knowledge', 7, ?, ?
        )
        """, (today_str, datetime.now().isoformat()))
        user_id = cursor.lastrowid

        # Seed initial shadows
        shadows = [
            (user_id, "Igris the Bloodred Knight", "Marshal", "Knight", 650, "Red Knight Throne Trial", datetime.now().isoformat()),
            (user_id, "Tank the Frost Bear", "Elite Knight", "Beast", 420, "Glacial Core Dungeon", datetime.now().isoformat()),
            (user_id, "Iron the Vanguard", "Knight", "Infantry", 380, "Demon Castle Gate", datetime.now().isoformat())
        ]
        cursor.executemany("""
        INSERT INTO shadow_army (user_id, shadow_name, shadow_grade, shadow_type, power_bonus, extracted_from, unlocked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, shadows)

        # Seed initial exam
        cursor.execute("""
        INSERT INTO exams (user_id, exam_title, subject, exam_date, target_score, syllabus_progress, notes)
        VALUES (?, 'Final Calculus & Linear Algebra', 'Mathematics', '2026-11-15', 95, 68, 'Master eigenvalues, Taylor series, and line integrals.')
        """, (user_id,))

        # Seed flashcards
        cards = [
            (user_id, "Computer Science", "What is the time complexity of QuickSelect average case?", "O(N) time complexity average case", 2, today_str, 3),
            (user_id, "Mathematics", "What is the derivative of arcsin(x)?", "1 / sqrt(1 - x^2)", 3, today_str, 2),
            (user_id, "Physics", "State Snell's Law of refraction.", "n1 * sin(theta1) = n2 * sin(theta2)", 1, today_str, 4),
            (user_id, "Data Structures", "What is the amortized cost of inserting into an expandable dynamic array?", "O(1) amortized cost per append", 2, today_str, 5)
        ]
        cursor.executemany("""
        INSERT INTO flashcards (user_id, subject, question, answer, difficulty, next_review_date, times_reviewed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, cards)

    conn.commit()
    conn.close()

def get_current_user():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id ASC LIMIT 1")
    user = dict(cursor.fetchone())
    conn.close()
    return user

def update_user_stats(user_id, **kwargs):
    conn = get_connection()
    cursor = conn.cursor()
    set_clause = ", ".join([f"{k} = ?" for k in kwargs.keys()])
    values = list(kwargs.values()) + [user_id]
    cursor.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()

def add_dungeon_run(user_id, dungeon_name, dungeon_rank, boss_name, questions_answered, accuracy_percent, xp_earned, victory=1):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO dungeon_runs (user_id, dungeon_name, dungeon_rank, boss_name, questions_answered, accuracy_percent, xp_earned, victory, run_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, dungeon_name, dungeon_rank, boss_name, questions_answered, accuracy_percent, xp_earned, victory, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_shadows(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shadow_army WHERE user_id = ?", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_shadow(user_id, shadow_name, shadow_grade, shadow_type, power_bonus, extracted_from):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO shadow_army (user_id, shadow_name, shadow_grade, shadow_type, power_bonus, extracted_from, unlocked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, shadow_name, shadow_grade, shadow_type, power_bonus, extracted_from, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_exams(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exams WHERE user_id = ? ORDER BY exam_date ASC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_flashcards(user_id, subject=None):
    conn = get_connection()
    cursor = conn.cursor()
    if subject and subject != "All":
        cursor.execute("SELECT * FROM flashcards WHERE user_id = ? AND subject = ?", (user_id, subject))
    else:
        cursor.execute("SELECT * FROM flashcards WHERE user_id = ?", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
