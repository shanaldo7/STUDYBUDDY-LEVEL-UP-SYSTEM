"""
StudyBuddy AI - Monarch Hunter Study System
Main Application Flow & Navigation
Pages:
- 🏛️ Hunter Command Dashboard
- ⚔️ Dungeon Battles & Gates
- 👑 Boss Selector & Raid Trials
- 📜 Quizzes & Knowledge Trials
- 👤 Character & Power Stats
- 👥 Shadow Army ("Arise")
- 🌲 Skill Tree & Perks
- 🧪 Revision Lab & Flashcards
- ⏱️ Focus Room & Ambient Soundscapes
- 🛡️ Guild Hall & Leaderboards
- 🎯 Exam Command Center
- 🤖 Hunter System AI Assistant
- 📅 Progress Calendar & Streaks
"""

import os
import sys
import json
import random
from datetime import datetime, date
import database as db
import premium_hunter as hunter_ui
import ai_service

try:
    import streamlit as st
except ImportError:
    st = None

def run_streamlit_app():
    if st is None:
        print("Streamlit is not installed in current environment. Run 'pip install streamlit'.")
        return

    st.set_page_config(
        page_title="StudyBuddy AI - Monarch Hunter Study System",
        page_icon="⚔️",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    # Inject premium hunter dark fantasy styling
    st.markdown(hunter_ui.get_hunter_css(), unsafe_allow_html=True)

    # Initialize user state
    user = db.get_current_user()

    # Sidebar Navigation
    with st.sidebar:
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem 0; border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
            <div style="font-family: 'Cinzel', serif; font-size: 1.4rem; font-weight: 800; color: #38bdf8;">STUDYBUDDY AI</div>
            <div style="font-size: 0.75rem; color: #a855f7; letter-spacing: 0.15em; font-weight: 700;">MONARCH HUNTER SYSTEM</div>
            <div style="margin-top: 0.75rem;">
                <span class="rank-badge rank-{user['hunter_rank'].lower()}">RANK {user['hunter_rank']}</span>
                <span style="color: #94a3b8; font-size: 0.9rem; margin-left: 0.5rem;">LV.{user['level']}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        nav_choice = st.radio(
            "SYSTEM NAVIGATION",
            [
                "🏛️ Command Dashboard",
                "⚔️ Dungeon Battles",
                "👑 Boss Trials",
                "📜 Quizzes & Trials",
                "👤 Character & Power",
                "👥 Shadow Army",
                "🌲 Skill Tree",
                "🧪 Revision Lab",
                "⏱️ Focus Room",
                "🛡️ Guild Hall",
                "🎯 Exam Command Center",
                "🤖 Hunter AI Guide",
                "⚙️ AI Provider Config",
                "📅 Progress Calendar"
            ]
        )

        st.markdown("---")
        # Mana and Daily Streak indicators in sidebar
        st.markdown(f"""
        <div style="font-size: 0.85rem; color: #94a3b8;">
            <div>⚡ <b>MANA:</b> {user['mana']} / {user['max_mana']}</div>
            <div style="margin-top: 0.25rem;">🔥 <b>STREAK:</b> {user['streak_days']} Days</div>
            <div style="margin-top: 0.25rem;">✨ <b>POINTS:</b> {user['stat_points']} Available</div>
        </div>
        """, unsafe_allow_html=True)

    # 1. COMMAND DASHBOARD
    if "Command Dashboard" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER COMMAND DASHBOARD", "Status overview, daily quests, and gate portals", user["hunter_rank"], user["level"]), unsafe_allow_html=True)

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("HUNTER LEVEL", f"LV.{user['level']}", f"+{user['xp']} XP")
        with col2:
            st.metric("HUNTER RANK", f"Rank {user['hunter_rank']}", "Top 12%")
        with col3:
            st.metric("SHADOW SOLDIERS", "3 Extracted", "+1,450 Combat PWR")
        with col4:
            st.metric("DAILY STREAK", f"{user['streak_days']} Days", "Active multiplier x1.5")

        # XP Progress
        xp_pct = min(1.0, user['xp'] / max(1, user['xp_next']))
        st.markdown(f"**XP Progression:** {user['xp']} / {user['xp_next']} XP ({int(xp_pct * 100)}%)")
        st.progress(xp_pct)

        st.markdown(hunter_ui.render_system_dialog("DAILY QUEST DISPATCHED: Complete 2 Dungeon Gates and 1 Focus Session to avoid Hunter Penalty Quest.", "SYSTEM QUEST NOTIFICATION"), unsafe_allow_html=True)

        # Quick Gates
        st.subheader("⚡ ACTIVE DUNGEON GATES")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("""
            <div class="hunter-card">
                <span class="rank-badge rank-e">RANK E</span>
                <h4 style="margin: 0.5rem 0 0.25rem 0;">Goblin Library Cave</h4>
                <p style="color: #94a3b8; font-size: 0.85rem;">Subject: Computer Science Basics<br>Boss: Hobgoblin Archivist<br>Reward: +250 XP, 50 Gold</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button("RAID GATE E", key="gate_e"):
                st.session_state["active_gate"] = "E"
                st.rerun()

        with c2:
            st.markdown("""
            <div class="hunter-card hunter-card-monarch">
                <span class="rank-badge rank-c">RANK C</span>
                <h4 style="margin: 0.5rem 0 0.25rem 0;">Frost Algorithm Crypt</h4>
                <p style="color: #94a3b8; font-size: 0.85rem;">Subject: Data Structures & Math<br>Boss: Ice Golem Sentinel<br>Reward: +750 XP, Shadow Fragment</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button("RAID GATE C", key="gate_c"):
                st.session_state["active_gate"] = "C"
                st.rerun()

        with c3:
            st.markdown("""
            <div class="hunter-card hunter-card-crimson">
                <span class="rank-badge rank-s">RANK S</span>
                <h4 style="margin: 0.5rem 0 0.25rem 0;">Monarch's Red Gate</h4>
                <p style="color: #94a3b8; font-size: 0.85rem;">Subject: Advanced System Architecture<br>Boss: Igris the Red Knight<br>Reward: +3,000 XP, Shadow Extraction</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button("CHALLENGE S-GATE", key="gate_s"):
                st.session_state["active_gate"] = "S"
                st.rerun()

    # 2. DUNGEON BATTLES
    elif "Dungeon Battles" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("DUNGEON GATE EXPEDITIONS", "Battle monsters through rigorous recall and knowledge trials", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.info("⚔️ Dungeon Gates convert study questions into offensive spells. Answer correctly to strike the dungeon beasts; incorrect answers damage your Hunter HP.")

        dungeon_choice = st.selectbox("Select Dungeon Expedition", [
            "E-Rank: Goblin Knowledge Caverns (Beginner CS)",
            "D-Rank: Crypt of Derivatives (Calculus I)",
            "C-Rank: Obsidian Memory Vault (Data Structures)",
            "B-Rank: Thunder Peak of Classical Physics",
            "S-Rank: Void Monarch Abyss (High-Level System Design)"
        ])

        col_d1, col_d2 = st.columns([2, 1])
        with col_d1:
            st.markdown("""
            <div class="hunter-card">
                <h3>BATTLE ENCOUNTER: Dungeon Beast Emerges!</h3>
                <p><b>Question:</b> What is the worst-case time complexity of searching in an unbalanced Binary Search Tree?</p>
            </div>
            """, unsafe_allow_html=True)
            ans = st.radio("Choose Hunter Spell / Answer:", ["O(log N)", "O(N)", "O(1)", "O(N log N)"], index=None)
            if st.button("EXECUTE ATTACK"):
                if ans == "O(N)":
                    st.success("CRITICAL HIT! [1,250 DMG] - Monster Defeated! +350 XP Gained!")
                    db.add_dungeon_run(user["id"], dungeon_choice, "C", "Dungeon Minion", 1, 100.0, 350, 1)
                else:
                    st.error("MISSED! The beast counters for 25 Damage! The correct answer was O(N) due to skewed degeneration.")
        with col_d2:
            st.markdown("""
            <div class="hunter-card hunter-card-crimson">
                <h4>MONSTER STATUS</h4>
                <p>HP: 0 / 1,000</p>
                <p>Affinity: Logic / Algorithms</p>
                <p>Drop Rate: Shadow Core (15%)</p>
            </div>
            """, unsafe_allow_html=True)

    # 3. BOSS TRIALS
    elif "Boss Trials" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("MONARCH BOSS TRIALS", "Overcome legendary raid bosses to extract their shadows", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        bosses = [
            {"name": "Igris the Bloodred Knight", "rank": "S", "title": "The Crimson Blade", "hp": 5000, "spec": "Mastery of Algorithms"},
            {"name": "Architect of the System", "rank": "S+", "title": "Keeper of the Double Dungeon", "hp": 10000, "spec": "Grand Mathematics & Logic"},
            {"name": "Frost Monarch Silad", "rank": "S", "title": "Sovereign of the Glaciers", "hp": 7500, "spec": "Thermodynamics & Fluid Dynamics"},
            {"name": "Shadow Dragon Kamish", "rank": "S+", "title": "Calamity of the Sky", "hp": 15000, "spec": "Distributed Systems & Scalability"}
        ]
        selected_boss = st.selectbox("Select Boss to Raid:", [b["name"] for b in bosses])
        curr_b = next(b for b in bosses if b["name"] == selected_boss)

        st.markdown(f"""
        <div class="hunter-card hunter-card-crimson">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="rank-badge rank-s">RANK {curr_b['rank']}</span>
                    <h2 style="margin: 0.5rem 0 0.2rem 0; color: #ef4444;">{curr_b['name']}</h2>
                    <p style="color: #cbd5e1;"><b>Title:</b> {curr_b['title']} | <b>Specialty:</b> {curr_b['spec']}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-family: 'Rajdhani', sans-serif; font-size: 2rem; color: #ef4444; font-weight: 700;">HP: {curr_b['hp']:,}</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("ARISE TRIAL RAID"):
            st.warning("⚠️ Boss Raid Initiated! Prepare your mind for 5 consecutive high-stakes study questions.")

    # 4. QUIZZES
    elif "Quizzes & Trials" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("KNOWLEDGE TRIALS & QUIZZES", "Sharpen your intellect with subject-specific trial sets", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        subject = st.selectbox("Subject Track", ["Computer Science", "Mathematics", "Physics", "Neuroscience", "Custom Flashcard Set"])
        st.write(f"Generating trial questions for **{subject}**...")
        q_cols = st.columns(2)
        with q_cols[0]:
            st.markdown("""
            <div class="hunter-card">
                <h4>Trial 1: Dijkstra's Algorithm</h4>
                <p>Which data structure yields the optimal O((V + E) log V) running time for Dijkstra?</p>
            </div>
            """, unsafe_allow_html=True)
            st.radio("Options:", ["Fibonacci / Min-Binary Heap", "Unsorted Array", "Adjacency Matrix", "Queue"], key="q1")
        with q_cols[1]:
            st.markdown("""
            <div class="hunter-card">
                <h4>Trial 2: Memory Hierarchy</h4>
                <p>Which level of cache resides directly inside the CPU core with lowest latency?</p>
            </div>
            """, unsafe_allow_html=True)
            st.radio("Options:", ["L1 Cache", "L2 Cache", "L3 Cache", "RAM"], key="q2")

        if st.button("SUBMIT TRIAL ANSWERS"):
            st.success("All Answers Verified! +400 XP Granted. Accuracy: 100%.")

    # 5. CHARACTER & POWER
    elif "Character & Power" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER CHARACTER & ATTRIBUTES", "Distribute earned stat points and equip rare hunter artifacts", user["hunter_rank"], user["level"]), unsafe_allow_html=True)

        col_st1, col_st2 = st.columns([1, 1])
        with col_st1:
            st.markdown("""
            <div class="hunter-card">
                <h3>CORE ATTRIBUTES</h3>
            </div>
            """, unsafe_allow_html=True)
            st.write(f"💪 **Strength (Grit & Work Ethic):** {user['stat_str']}")
            st.write(f"⚡ **Agility (Processing Speed):** {user['stat_agi']}")
            st.write(f"🧠 **Intelligence (Concept Mastery):** {user['stat_int']}")
            st.write(f"🛡️ **Vitality (Study Endurance):** {user['stat_vit']}")
            st.write(f"👁️ **Sense (Intuition & Analysis):** {user['stat_sen']}")
            st.info(f"Available Stat Points: **{user['stat_points']}**")

        with col_st2:
            st.markdown("""
            <div class="hunter-card hunter-card-monarch">
                <h3>EQUIPPED ARTIFACTS</h3>
                <p>🗡️ <b>Dagger of the Shadow Monarch:</b> +15% XP from math & logic</p>
                <p>💍 <b>Ring of Absolute Focus:</b> Reduces Pomodoro fatigue by 20%</p>
                <p>🦹 <b>Cloak of Concealment:</b> Blocks distraction notifications</p>
                <p>📜 <b>Active Title:</b> <i>Monarch of Knowledge</i> (+10% All Stats)</p>
            </div>
            """, unsafe_allow_html=True)

    # 6. SHADOW ARMY
    elif "Shadow Army" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("THE SHADOW ARMY ('ARISE')", "Extracted shadow soldiers who boost your passive study mastery", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.markdown(hunter_ui.render_system_dialog("COMMANDER'S AUTHORITY: Shadow soldiers extract knowledge fragments and provide passive multipliers during focus sessions.", "SHADOW SOVEREIGN"), unsafe_allow_html=True)

        shadows = db.get_shadows(user["id"])
        cols = st.columns(max(1, len(shadows)))
        for idx, shadow in enumerate(shadows):
            with cols[idx % len(cols)]:
                st.markdown(f"""
                <div class="hunter-card hunter-card-monarch">
                    <div style="font-size: 0.8rem; color: #a855f7; font-weight: 700;">{shadow['shadow_grade'].upper()} GRADE</div>
                    <h3 style="color: #e2e8f0; margin: 0.25rem 0;">{shadow['shadow_name']}</h3>
                    <p style="color: #94a3b8; font-size: 0.85rem;">
                        Type: {shadow['shadow_type']}<br>
                        Power: <b>+{shadow['power_bonus']} CP</b><br>
                        Origin: {shadow['extracted_from']}
                    </p>
                </div>
                """, unsafe_allow_html=True)

        if st.button("ARISE: Extract New Shadow Soldier (Requires S-Rank Victory)"):
            st.info("To extract a new shadow, defeat a Boss in the Boss Trials tab.")

    # 7. SKILL TREE
    elif "Skill Tree" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER SKILL TREE & MASTERY", "Unlock passive cognition augments and active exam skills", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        sk_col1, sk_col2, sk_col3 = st.columns(3)
        with sk_col1:
            st.markdown("""
            <div class="hunter-card">
                <h4>🔮 Flow State Overdrive (Active)</h4>
                <p style="font-size: 0.85rem; color: #94a3b8;">Increases Pomodoro focus efficiency by 25% for 60 minutes.</p>
                <span class="rank-badge rank-c">UNLOCKED</span>
            </div>
            """, unsafe_allow_html=True)
        with sk_col2:
            st.markdown("""
            <div class="hunter-card hunter-card-monarch">
                <h4>🧠 Photographic Recall (Passive)</h4>
                <p style="font-size: 0.85rem; color: #94a3b8;">Reduces flashcard interval decay by 40%.</p>
                <span class="rank-badge rank-b">LV. 2</span>
            </div>
            """, unsafe_allow_html=True)
        with sk_col3:
            st.markdown("""
            <div class="hunter-card">
                <h4>🛡️ Monarch's Aegis (Passive)</h4>
                <p style="font-size: 0.85rem; color: #94a3b8;">Prevents streak loss if you miss 1 study day per month.</p>
                <span class="rank-badge rank-a">UNLOCKED</span>
            </div>
            """, unsafe_allow_html=True)

    # 8. REVISION LAB
    elif "Revision Lab" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("SPACED REPETITION REVISION LAB", "Active recall deck with automated spaced intervals", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        cards = db.get_flashcards(user["id"])
        st.write(f"Total Cards in Deck: **{len(cards)}**")
        if cards:
            c = cards[0]
            st.markdown(f"""
            <div class="hunter-card" style="text-align: center; padding: 2rem;">
                <div style="font-size: 0.8rem; color: #38bdf8; letter-spacing: 0.1em;">TOPIC: {c['subject'].upper()}</div>
                <h3 style="margin: 1rem 0; font-size: 1.5rem;">{c['question']}</h3>
                <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin: 1.5rem 0; padding-top: 1rem; color: #a855f7;">
                    <b>Answer:</b> {c['answer']}
                </div>
            </div>
            """, unsafe_allow_html=True)
            r_c1, r_c2, r_c3 = st.columns(3)
            with r_c1: st.button("HARD (Review in 1 Day)")
            with r_c2: st.button("GOOD (Review in 3 Days)")
            with r_c3: st.button("EASY (Review in 7 Days)")

    # 9. FOCUS ROOM
    elif "Focus Room" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER FOCUS SANCTUARY", "Deep-work isolation chamber with dungeon ambient soundscapes", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.markdown("""
        <div class="hunter-card" style="text-align: center; padding: 2.5rem 1rem;">
            <div style="font-family: 'Rajdhani', sans-serif; font-size: 4rem; font-weight: 700; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);">
                25:00
            </div>
            <p style="color: #94a3b8;">MONARCH PROTOCOL: Deep cognitive flow engaged. All external gates sealed.</p>
        </div>
        """, unsafe_allow_html=True)
        fc1, fc2, fc3 = st.columns(3)
        with fc1: st.button("START FOCUS TIMER (25 MIN)")
        with fc2: st.button("SHORT BREAK (5 MIN)")
        with fc3: st.button("LONG REST (15 MIN)")

    # 10. GUILD HALL
    elif "Guild Hall" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER GUILD HALL & RANKINGS", "Worldwide hunter leaderboard and collaborative study raids", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.markdown("""
        | Rank | Hunter Name | Title | Hunter Rank | Level | Study Hours |
        |---|---|---|---|---|---|
        | 🥇 1 | Sung Jin-Woo | Shadow Monarch | Rank S | LV. 146 | 582 hrs |
        | 🥈 2 | Cha Hae-In | Radiant Sword | Rank S | LV. 112 | 440 hrs |
        | 🥉 3 | Choi Jong-In | Ultimate Flame | Rank S | LV. 98 | 390 hrs |
        | ⭐ 12 | **Sung Jin-Study (You)** | **Monarch of Knowledge** | **Rank B** | **LV. 24** | **148 hrs** |
        """)

    # 11. EXAM COMMAND CENTER
    elif "Exam Command Center" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("EXAM COMMAND CENTER", "High-stakes countdowns, syllabus checklist, and readiness metrics", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        exams = db.get_exams(user["id"])
        for ex in exams:
            st.markdown(f"""
            <div class="hunter-card">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <h3 style="margin: 0; color: #38bdf8;">{ex['exam_title']}</h3>
                        <p style="color: #94a3b8; font-size: 0.85rem;">Subject: {ex['subject']} | Date: <b>{ex['exam_date']}</b></p>
                    </div>
                    <div style="text-align: right;">
                        <span class="rank-badge rank-s">TARGET: {ex['target_score']}%</span>
                    </div>
                </div>
                <div style="margin-top: 0.75rem;">
                    <b>Syllabus Mastery:</b> {ex['syllabus_progress']}%
                </div>
                <p style="color: #cbd5e1; font-size: 0.85rem; margin-top: 0.5rem;">{ex['notes']}</p>
            </div>
            """, unsafe_allow_html=True)

    # 12. AI ASSISTANT
    elif "Hunter AI Guide" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("HUNTER SYSTEM AI ASSISTANT", "Tactical AI guidance, concept breakdowns, and study strategies", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        
        cfg = ai_service.get_active_ai_config(st.session_state.get("ai_config"))
        st.markdown(f"""
        <div style="font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #38bdf8; margin-bottom: 0.75rem;">
            [ACTIVE PROVIDER: <b>{cfg['provider_name']}</b> | MODEL: <b>{cfg['model']}</b> | KEY: <b>{cfg['masked_key'] if cfg['has_key'] else 'NOT SET (LOCAL HEURISTICS)'}</b>]
        </div>
        """, unsafe_allow_html=True)

        user_prompt = st.text_input("Enter your study query or request tactical analysis:", placeholder="e.g. Explain Dijkstra's Algorithm or Matrix Eigenvalues")
        if st.button("CONSULT SYSTEM GUIDE"):
            if user_prompt:
                with st.spinner("Channeling Hunter System Guide..."):
                    ai_reply = ai_service.query_ai_service(user_prompt, st.session_state.get("ai_config"))
                st.markdown(f"""
                <div class="system-dialog">
                    <div class="system-title">⚔️ SYSTEM INTEL REPORT ({cfg['provider_name']})</div>
                    <div style="color: #f1f5f9; line-height: 1.6; white-space: pre-wrap; font-size: 0.9rem;">{ai_reply}</div>
                </div>
                """, unsafe_allow_html=True)

    # 13. AI PROVIDER CONFIG
    elif "AI Provider Config" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("AI PROVIDER & CREDENTIAL CONFIGURATION", "Configure flexible AI providers: Gemini, OpenAI, OpenRouter, Groq, Ollama", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.info("🔒 SECURITY DIRECTIVE: API keys are stored in session memory only. They are never written to the SQLite database, committed to Git, or exposed in public terminal logs.")

        current_cfg = ai_service.get_active_ai_config(st.session_state.get("ai_config"))
        providers = list(ai_service.PROVIDER_DEFAULTS.keys())
        prov_idx = providers.index(current_cfg["provider"]) if current_cfg["provider"] in providers else 0

        selected_provider = st.selectbox(
            "Select AI Provider",
            providers,
            index=prov_idx,
            format_func=lambda k: ai_service.PROVIDER_DEFAULTS[k]["name"]
        )
        provider_meta = ai_service.PROVIDER_DEFAULTS[selected_provider]
        final_model = provider_meta["default_model"]

        # API Key (Password input) & Official Get API Key Button
        if provider_meta.get("api_key_url"):
            col_k1, col_k2 = st.columns([3, 1])
            with col_k1:
                api_key_input = st.text_input(
                    f"API Key for {provider_meta['name']}",
                    type="password",
                    value=st.session_state.get("ai_config", {}).get("api_key", ""),
                    disabled=(selected_provider == "ollama"),
                    help="Masked input. Stored in temporary session memory only."
                )
            with col_k2:
                st.markdown("<div style='height: 1.7rem;'></div>", unsafe_allow_html=True)
                st.link_button("Get API Key ↗", provider_meta["api_key_url"])
        else:
            api_key_input = st.text_input(
                f"API Key for {provider_meta['name']}",
                type="password",
                value=st.session_state.get("ai_config", {}).get("api_key", ""),
                help="Masked input. Stored in temporary session memory only."
            )

        # Base URL - Only show for Custom or Ollama
        if provider_meta["needs_base_url"]:
            if selected_provider == "custom":
                st.info("ℹ️ Enter the API base URL provided by your AI provider.")
            base_url_input = st.text_input(
                "API Base URL",
                value=st.session_state.get("ai_config", {}).get("base_url") or provider_meta["base_url"],
                help="Configurable for Ollama (default http://localhost:11434/v1) or custom proxies."
            )
        else:
            base_url_input = provider_meta["base_url"]

        col_s1, col_s2 = st.columns([1, 1])
        with col_s1:
            if st.button("SAVE CONFIGURATION"):
                st.session_state["ai_config"] = {
                    "provider": selected_provider,
                    "api_key": api_key_input.strip(),
                    "model": final_model.strip(),
                    "base_url": base_url_input.strip()
                }
                st.success("✅ Configuration successfully applied to active session!")
                st.rerun()

        with col_s2:
            if st.button("CONNECT AI"):
                with st.spinner("Connecting to provider..."):
                    test_cfg = {
                        "provider": selected_provider,
                        "api_key": api_key_input.strip(),
                        "model": final_model.strip(),
                        "base_url": base_url_input.strip()
                    }
                    result = ai_service.test_ai_connection(test_cfg)
                    if result["success"]:
                        st.session_state["ai_config"] = test_cfg
                        st.success(f"✓ AI SYSTEM ONLINE\n\n{result['description']}\nConnection: Active")
                    else:
                        st.error(f"✗ {result['title']}\n\n{result['description']}\n\nDiagnostic: {result.get('diagnostic', '')}")

    # 14. PROGRESS CALENDAR
    elif "Progress Calendar" in nav_choice:
        st.markdown(hunter_ui.render_hunter_header("PROGRESS CALENDAR & STREAKS", "Visual activity record of study raids and conquered gates", user["hunter_rank"], user["level"]), unsafe_allow_html=True)
        st.write(f"🔥 Current Consecutive Study Streak: **{user['streak_days']} Days**")
        st.info("Daily Activity Matrix: Over 42 dungeon questions cleared this week across 5 separate study raids.")

if __name__ == "__main__":
    if st is not None:
        run_streamlit_app()
    else:
        print("StudyBuddy AI Streamlit backend ready. Use run_studybuddy.bat or install streamlit.")
