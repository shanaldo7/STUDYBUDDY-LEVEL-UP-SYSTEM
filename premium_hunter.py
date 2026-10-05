"""
StudyBuddy AI - Premium Hunter Theme & UI Components
Dark fantasy and futuristic hunter visual system:
Obsidian/Navy palette, Violet/Electric-Blue neon glows, subtle crimson danger highlights,
glassmorphism cards, and hunter status interfaces.
"""

def get_hunter_css():
    return """
    <style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Rajdhani:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    :root {
        --color-bg-base: #05070f;
        --color-bg-card: rgba(15, 23, 42, 0.75);
        --color-border-glow: rgba(56, 189, 248, 0.25);
        --color-cyan: #06b6d4;
        --color-purple: #a855f7;
        --color-crimson: #ef4444;
        --color-gold: #f59e0b;
    }

    /* Streamlit Main Theme Overrides */
    .stApp {
        background: radial-gradient(circle at 50% 0%, #111827 0%, #05070f 65%, #020307 100%) !important;
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        color: #f1f5f9 !important;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Rajdhani', sans-serif !important;
        letter-spacing: 0.05em !important;
        color: #f8fafc !important;
        text-transform: uppercase !important;
    }

    /* Hunter System Cards */
    .hunter-card {
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(56, 189, 248, 0.18);
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .hunter-card:hover {
        border-color: rgba(56, 189, 248, 0.45);
        box-shadow: 0 8px 30px -4px rgba(6, 182, 212, 0.25);
        transform: translateY(-2px);
    }

    .hunter-card-crimson {
        background: rgba(30, 15, 20, 0.7);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .hunter-card-crimson:hover {
        border-color: rgba(239, 68, 68, 0.6);
        box-shadow: 0 8px 30px -4px rgba(239, 68, 68, 0.3);
    }

    .hunter-card-monarch {
        background: rgba(25, 15, 38, 0.75);
        border: 1px solid rgba(168, 85, 247, 0.35);
    }

    .hunter-card-monarch:hover {
        border-color: rgba(168, 85, 247, 0.6);
        box-shadow: 0 8px 30px -4px rgba(168, 85, 247, 0.35);
    }

    /* Hunter Rank Badges */
    .rank-badge {
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 1.15rem;
        padding: 0.2rem 0.75rem;
        border-radius: 6px;
        display: inline-block;
        text-shadow: 0 0 10px currentColor;
    }

    .rank-e { color: #94a3b8; border: 1px solid #475569; background: rgba(71, 85, 105, 0.2); }
    .rank-d { color: #4ade80; border: 1px solid #22c55e; background: rgba(34, 197, 94, 0.2); }
    .rank-c { color: #38bdf8; border: 1px solid #0284c7; background: rgba(2, 132, 199, 0.2); }
    .rank-b { color: #818cf8; border: 1px solid #4f46e5; background: rgba(79, 70, 229, 0.2); }
    .rank-a { color: #c084fc; border: 1px solid #9333ea; background: rgba(147, 51, 234, 0.2); }
    .rank-s { color: #f59e0b; border: 1px solid #d97706; background: rgba(217, 119, 6, 0.2); text-shadow: 0 0 14px #f59e0b; }

    /* Custom System Notification Box */
    .system-dialog {
        background: linear-gradient(135deg, rgba(16, 24, 40, 0.95), rgba(12, 18, 30, 0.98));
        border: 1px solid rgba(56, 189, 248, 0.4);
        border-left: 4px solid #06b6d4;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        margin: 1rem 0;
        box-shadow: 0 0 25px -5px rgba(6, 182, 212, 0.25);
    }

    .system-title {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        color: #38bdf8;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
    }

    /* Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #1e293b, #0f172a) !important;
        color: #e2e8f0 !important;
        border: 1px solid rgba(56, 189, 248, 0.3) !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        padding: 0.5rem 1.25rem !important;
        transition: all 0.2s ease !important;
    }

    .stButton>button:hover {
        background: linear-gradient(135deg, #0284c7, #2563eb) !important;
        color: #ffffff !important;
        border-color: #38bdf8 !important;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.5) !important;
        transform: translateY(-1px) !important;
    }

    /* Metrics */
    div[data-testid="stMetric"] {
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 10px !important;
        padding: 0.75rem 1rem !important;
    }

    div[data-testid="stMetricLabel"] {
        color: #94a3b8 !important;
        font-size: 0.85rem !important;
        letter-spacing: 0.05em !important;
    }

    div[data-testid="stMetricValue"] {
        color: #38bdf8 !important;
        font-family: 'Rajdhani', sans-serif !important;
        font-size: 1.75rem !important;
        font-weight: 700 !important;
    }

    /* Progress bar */
    .stProgress > div > div > div > div {
        background: linear-gradient(90deg, #06b6d4, #8b5cf6) !important;
        border-radius: 4px !important;
    }
    </style>
    """

def render_hunter_header(title, subtitle="", rank="B", level=24):
    css_class = f"rank-{rank.lower()}"
    return f"""
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0 1.5rem 0; border-bottom: 1px solid rgba(56, 189, 248, 0.2); margin-bottom: 1.5rem;">
        <div>
            <div style="font-family: 'Rajdhani', sans-serif; font-size: 0.85rem; color: #06b6d4; letter-spacing: 0.15em; font-weight: 700;">[ SYSTEM PROTOCOL ACTIVE ]</div>
            <div style="font-family: 'Cinzel', serif; font-size: 2rem; font-weight: 800; color: #f8fafc; letter-spacing: 0.03em; margin: 0.2rem 0;">{title}</div>
            <div style="font-size: 0.95rem; color: #94a3b8;">{subtitle}</div>
        </div>
        <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">HUNTER LICENSE</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem;">
                <span class="rank-badge {css_class}">RANK {rank}</span>
                <span style="font-family: 'Rajdhani', sans-serif; font-size: 1.25rem; font-weight: 700; color: #38bdf8;">LV.{level}</span>
            </div>
        </div>
    </div>
    """

def render_system_dialog(message, sender="THE SYSTEM"):
    return f"""
    <div class="system-dialog">
        <div class="system-title">⚔️ {sender} NOTICE</div>
        <div style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.5;">{message}</div>
    </div>
    """
