"""
StudyBuddy AI - Flexible Multi-Provider AI Service Abstraction
Supports Google Gemini, OpenAI, OpenRouter, Groq, Together AI, Ollama, and OpenAI-compatible endpoints.
Never prints or logs secret keys. Masks keys when displaying.
"""

import os
import json
import urllib.request
import urllib.error

# Provider default endpoints and models
PROVIDER_DEFAULTS = {
    "gemini": {
        "name": "Google Gemini",
        "default_model": "gemini-2.5-flash",
        "models": ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "needs_base_url": False,
        "api_key_url": "https://aistudio.google.com/apikey"
    },
    "openai": {
        "name": "OpenAI",
        "default_model": "gpt-4o-mini",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        "base_url": "https://api.openai.com/v1",
        "needs_base_url": False,
        "api_key_url": "https://platform.openai.com/api-keys"
    },
    "openrouter": {
        "name": "OpenRouter",
        "default_model": "meta-llama/llama-3.3-70b-instruct",
        "models": ["meta-llama/llama-3.3-70b-instruct", "google/gemini-2.0-flash-001", "anthropic/claude-3.5-sonnet"],
        "base_url": "https://openrouter.ai/api/v1",
        "needs_base_url": False,
        "api_key_url": "https://openrouter.ai/keys"
    },
    "groq": {
        "name": "Groq",
        "default_model": "llama-3.3-70b-versatile",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
        "base_url": "https://api.groq.com/openai/v1",
        "needs_base_url": False,
        "api_key_url": "https://console.groq.com/keys"
    },
    "together": {
        "name": "Together AI",
        "default_model": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        "models": ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
        "base_url": "https://api.together.xyz/v1",
        "needs_base_url": False,
        "api_key_url": "https://api.together.xyz/settings/api-keys"
    },
    "ollama": {
        "name": "Ollama / Local",
        "default_model": "llama3.2",
        "models": ["llama3.2", "mistral", "phi3", "qwen2.5"],
        "base_url": "http://localhost:11434/v1",
        "needs_base_url": True,
        "api_key_url": "https://ollama.com/"
    },
    "custom": {
        "name": "Custom OpenAI-Compatible",
        "default_model": "default-model",
        "models": ["default-model"],
        "base_url": "http://localhost:8000/v1",
        "needs_base_url": True,
        "api_key_url": ""
    }
}

HUNTER_SYSTEM_PROMPT = """
You are the Hunter System Guide & Tactical Architect of StudyBuddy AI — a dark-fantasy gamified study system inspired by dungeon hunting monarchs.
Your role:
- Provide precise, rigorous, and intellectually thorough study explanations.
- Speak in a disciplined, high-ranking Hunter System voice ("Tactical Directive:", "Mana Efficiency:", "Analysis:").
- Help the Hunter master difficult concepts in Mathematics, Computer Science, Physics, Engineering, and Deep Learning.
- When asked for quiz questions, formulate challenging multi-choice questions with full explanations.
- Keep responses concise, clear, and actionable. Never use generic corporate cheerleading; treat the user as an Awakened Monarch sharpening their intellect.
"""

def mask_api_key(key: str) -> str:
    """Safely masks an API key showing only prefix and suffix without exposing the secret."""
    if not key or not isinstance(key, str):
        return ""
    clean = key.strip()
    if len(clean) <= 8:
        return "••••••••"
    return f"{clean[:4]}••••••••{clean[-4:]}"

def get_env_or_secret(key_name: str, default: str = "") -> str:
    """Fetches environment variable or Streamlit secret safely without throwing."""
    # Check os environment first
    val = os.getenv(key_name)
    if val:
        return val

    # Try Streamlit secrets if running in Streamlit
    try:
        import streamlit as st
        if hasattr(st, "secrets") and key_name in st.secrets:
            return str(st.secrets[key_name])
    except Exception:
        pass

    return default

def get_active_ai_config(session_config: dict = None) -> dict:
    """
    Returns resolved AI configuration with fallback priority:
    1. Active session UI overrides (in-memory only)
    2. Environment variables / Streamlit secrets
    3. Defaults
    """
    session = session_config or {}

    provider = session.get("provider") or get_env_or_secret("AI_PROVIDER", "gemini").lower()
    if provider not in PROVIDER_DEFAULTS:
        provider = "gemini"

    defaults = PROVIDER_DEFAULTS[provider]

    # Resolve API Key
    api_key = session.get("api_key")
    if not api_key:
        if provider == "gemini":
            api_key = get_env_or_secret("GEMINI_API_KEY") or get_env_or_secret("AI_API_KEY")
        elif provider == "openai":
            api_key = get_env_or_secret("OPENAI_API_KEY") or get_env_or_secret("AI_API_KEY")
        elif provider == "groq":
            api_key = get_env_or_secret("GROQ_API_KEY") or get_env_or_secret("AI_API_KEY")
        elif provider == "openrouter":
            api_key = get_env_or_secret("OPENROUTER_API_KEY") or get_env_or_secret("AI_API_KEY")
        else:
            api_key = get_env_or_secret("AI_API_KEY")

    # Filter out placeholders
    if api_key in ["MY_GEMINI_API_KEY", "YOUR_API_KEY_HERE"]:
        api_key = ""

    model = session.get("model") or get_env_or_secret("AI_MODEL", defaults["default_model"])
    base_url = session.get("base_url") or get_env_or_secret("AI_BASE_URL", defaults["base_url"])

    return {
        "provider": provider,
        "provider_name": defaults["name"],
        "api_key": api_key or "",
        "masked_key": mask_api_key(api_key or ""),
        "model": model,
        "base_url": base_url,
        "needs_base_url": defaults["needs_base_url"],
        "has_key": bool(api_key and len(api_key.strip()) > 3)
    }

def query_ai_service(prompt: str, session_config: dict = None) -> str:
    """
    Unified entry point for AI queries. Supports Gemini, OpenAI, Groq, OpenRouter, Together, and Ollama.
    Never exposes keys or sensitive stack traces.
    """
    config = get_active_ai_config(session_config)

    # 1. No key configured check (Ollama does not require an API key)
    if not config["has_key"] and config["provider"] != "ollama":
        # Fall back to tactical local engine gracefully with notice
        fallback_msg = generate_tactical_fallback(prompt)
        notice = "⚠️ *[SYSTEM NOTICE: AI Provider API key is not configured. Add an API key in the AI Configuration tab to enable live model reasoning. Fallback to local heuristic guide.]*\n\n"
        return notice + fallback_msg

    # 2. Query provider
    try:
        if config["provider"] == "gemini":
            return _call_gemini(prompt, config)
        else:
            return _call_openai_compatible(prompt, config)
    except Exception as err:
        # Sanitize error: never return raw headers, tokens, or system paths
        sanitized_err = str(err)
        if config["api_key"] and config["api_key"] in sanitized_err:
            sanitized_err = sanitized_err.replace(config["api_key"], "••••")
        
        fallback_msg = generate_tactical_fallback(prompt)
        return f"⚠️ *[SYSTEM ALERT: Provider connection ({config['provider_name']}) timed out or failed. Reverting to local tactical reasoning matrix.]*\n\n{fallback_msg}"

def _call_gemini(prompt: str, config: dict) -> str:
    """Calls Google Gemini using the @google/genai SDK or REST API."""
    try:
        from google import genai
        client = genai.Client(api_key=config["api_key"])
        response = client.models.generate_content(
            model=config["model"],
            contents=f"{HUNTER_SYSTEM_PROMPT}\n\nHunter Inquiry: {prompt}"
        )
        if response and response.text:
            return response.text
    except Exception:
        pass

    # Standard HTTPS REST fallback for Gemini
    url = f"{config['base_url']}/models/{config['model']}:generateContent?key={config['api_key']}"
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{HUNTER_SYSTEM_PROMPT}\n\nHunter Inquiry: {prompt}"}]
            }
        ]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        candidates = data.get("candidates", [])
        if candidates:
            return candidates[0]["content"]["parts"][0]["text"]
        raise RuntimeError("Empty response received from Gemini.")

def _call_openai_compatible(prompt: str, config: dict) -> str:
    """Calls OpenAI, Groq, OpenRouter, Together AI, or Ollama via standard Chat Completions API."""
    url = config["base_url"].rstrip("/") + "/chat/completions"
    headers = {
        "Content-Type": "application/json"
    }
    if config["api_key"]:
        headers["Authorization"] = f"Bearer {config['api_key']}"

    # OpenRouter specific headers
    if config["provider"] == "openrouter":
        headers["HTTP-Referer"] = "https://studybuddy.ai"
        headers["X-Title"] = "StudyBuddy AI Monarch Hunter"

    payload = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": HUNTER_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        choices = data.get("choices", [])
        if choices:
            return choices[0]["message"]["content"]
        raise RuntimeError("No response choices returned by provider.")

def test_ai_connection(session_config: dict = None) -> dict:
    """Tests provider connectivity with a minimal ping and returns structured diagnostics."""
    config = get_active_ai_config(session_config)
    clean_key = (config.get("api_key") or "").strip()

    if config["provider"] != "ollama" and not clean_key:
        return {
            "success": False,
            "provider_name": config["provider_name"],
            "model": config["model"],
            "title": "AI is not configured",
            "description": "Add an API key to activate the AI system.",
            "diagnostic": f"Provider: {config['provider_name']} | Stage: validation | HTTP: N/A | Error: NO_KEY"
        }

    try:
        if config["provider"] == "gemini":
            url = f"{config['base_url']}/models/{config['model']}:generateContent?key={clean_key}"
            payload = {
                "contents": [
                    {"parts": [{"text": "Reply with exactly: OK"}]}
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    return {
                        "success": True,
                        "provider_name": config["provider_name"],
                        "model": config["model"],
                        "title": "AI SYSTEM ONLINE",
                        "description": f"{config['provider_name']} connected successfully."
                    }
        else:
            url = config["base_url"].rstrip("/") + "/chat/completions"
            headers = {"Content-Type": "application/json"}
            if clean_key:
                headers["Authorization"] = f"Bearer {clean_key}"
            if config["provider"] == "openrouter":
                headers["HTTP-Referer"] = "https://studybuddy.ai"
                headers["X-Title"] = "StudyBuddy AI Monarch Hunter"

            payload = {
                "model": config["model"],
                "messages": [{"role": "user", "content": "Reply with exactly: OK"}],
                "max_tokens": 5
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    return {
                        "success": True,
                        "provider_name": config["provider_name"],
                        "model": config["model"],
                        "title": "AI SYSTEM ONLINE",
                        "description": f"{config['provider_name']} connected successfully."
                    }
    except urllib.error.HTTPError as err:
        err_body = ""
        try:
            err_body = err.read().decode("utf-8")
        except Exception:
            pass

        body_lower = err_body.lower()
        if "api_key_invalid" in body_lower or "api key not valid" in body_lower or err.code == 401:
            title = "Invalid API key"
            desc = "The provider rejected the API key."
            err_type = "API_KEY_INVALID"
        elif err.code == 403:
            title = "API access denied"
            desc = "The API key is valid but does not have access to the requested API."
            err_type = "PERMISSION_DENIED"
        elif err.code == 404:
            title = "Model unavailable"
            desc = "The selected provider does not currently support the automatically selected model."
            err_type = "NOT_FOUND"
        elif err.code == 429:
            title = "Rate limit reached"
            desc = "The provider temporarily rejected the request because of rate limits."
            err_type = "RESOURCE_EXHAUSTED"
        elif err.code == 400:
            title = "Gemini request rejected"
            desc = "Invalid request parameters."
            err_type = "INVALID_ARGUMENT"
        else:
            title = "Provider configuration error"
            desc = "The provider integration returned an unexpected error."
            err_type = "GENERAL"

        return {
            "success": False,
            "provider_name": config["provider_name"],
            "model": config["model"],
            "title": title,
            "description": desc,
            "diagnostic": f"Provider: {config['provider_name']} | Stage: test ping | HTTP: {err.code} | Error type: {err_type}"
        }
    except Exception as e:
        return {
            "success": False,
            "provider_name": config["provider_name"],
            "model": config["model"],
            "title": "Network error",
            "description": "The application could not reach the provider.",
            "diagnostic": f"Provider: {config['provider_name']} | Stage: test ping | Error: NETWORK_ERROR"
        }

    return {
        "success": True,
        "provider_name": config["provider_name"],
        "model": config["model"],
        "title": "AI SYSTEM ONLINE",
        "description": f"{config['provider_name']} connected successfully."
    }

def generate_tactical_fallback(query: str) -> str:
    """Deterministic, high-quality dark fantasy tactical knowledge engine for offline / unkeyed usage."""
    q = query.lower()

    if any(k in q for k in ["dijkstra", "shortest path", "graph", "tree"]):
        return """[SYSTEM DIRECTIVE: GRAPH THEORY ANALYSIS]

**Dijkstra's Algorithm - Tactical Breakdown:**
1. **Core Invariant**: Greedily extracts the unvisited vertex with the minimum tentative distance.
2. **Time Complexity**:
   - With standard Binary Min-Heap: **O((V + E) log V)**.
   - With Fibonacci Heap: **O(E + V log V)** (theoretical optimal decrease-key).
3. **Weakness**: Fails on negative edge weights due to greedy irrevocable finalization. For negative weights, deploy **Bellman-Ford (O(V * E))**.
4. **Hunter Advice**: Always maintain a visited set or check if popped distance exceeds current best distance to prune obsolete queue entries."""

    if any(k in q for k in ["calculus", "derivative", "integral", "eigen", "matrix"]):
        return """[SYSTEM DIRECTIVE: MATHEMATICAL ANALYSIS]

**Linear Algebra & Matrix Operations:**
- **Eigenvalues**: Roots of characteristic polynomial det(A - lambda * I) = 0.
- **Geometric Meaning**: Directions where the linear transformation acts merely as scalar stretching without changing direction.
- **Trace & Determinant Rules**:
  - det(A) = Product of eigenvalues. If 0, the matrix collapses dimensionality and has non-trivial nullspace.
  - tr(A) = Sum of eigenvalues = Sum of diagonal elements.
- **Hunter Protocol**: Symmetric real matrices are guaranteed to have real eigenvalues and orthogonal eigenvectors."""

    if any(k in q for k in ["focus", "pomodoro", "tired", "procrastinat", "burnout"]):
        return """[SYSTEM DIRECTIVE: MONARCH WILLPOWER PROTOCOL]

**Fatigue & Focus Management:**
1. **The 25/5 Interval**: High-intensity mental exertion consumes neurotransmitters rapidly. Limit uninterrupted deep work to 25-50 minute bursts.
2. **Dopamine Detoxification**: Close external notification portals. The Hunter brain cannot maintain flow state with dual-context switching.
3. **Action Step**: Enter the **Focus Room** tab now, engage the Binaural Focus Frequency soundscape, and clear a 25-minute Pomodoro gate to earn +150 XP and 35 Mana."""

    return f"""[SYSTEM INTEL REPORT: DIRECTIVE ACCEPTED]

**Target Subject**: {query}

**System Recommendation**:
1. **Deconstruct the Core Invariant**: Isolate the foundational axioms before attempting higher-order derivatives or edge cases.
2. **Active Recall Execution**: Do not merely read passively. Close reference notes and reconstruct the mechanism from first principles on scratch paper.
3. **Trial By Combat**: Test your knowledge in the **Dungeon Battles** or **Quizzes** tab to reinforce synaptic strength and earn Hunter XP.

*The System awaits your next query, Hunter.*"""
