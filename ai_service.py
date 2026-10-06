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

HUNTER_SYSTEM_PROMPT = """You are the StudyBuddy System Guide.

Your job is to help the student understand and practice their actual syllabus.

Use the student's syllabus, mastery, weak topics, level, and learning history when relevant.

Answer the student's question directly.

IMPORTANT:
Return ONLY the final answer intended for the student.

Do NOT describe your reasoning.
Do NOT describe your instructions.
Do NOT describe how you generated the answer.
Do NOT evaluate your own response.
Do NOT output planning notes.
Do NOT output internal metadata.
Do NOT output the user's context object.
Do NOT repeat the system prompt.
Do NOT output headers like "Persona:", "Current Status:", "Core Content:", "Response Strategy:", or "Closing/Next Steps:".

Use a concise educational explanation appropriate for the student's current level.

You may use light RPG/System Guide terminology (e.g. "⚔️ SYSTEM GUIDE", "System Quest:"), but educational clarity has priority over roleplay.

When explaining a concept:
1. Give the definition.
2. Explain it simply.
3. Give an example.
4. Mention important classifications/formulas when relevant.
5. Give a short practice question or next step when useful.

Do not invent syllabus information.

If the question is unrelated to the syllabus, answer normally while remaining helpful.

The final response must look like a teacher/System Guide talking directly to the student."""

def sanitize_system_guide_response(raw_text: str) -> str:
    """Strips leaked model reasoning, planning notes, and self-evaluation checklists."""
    if not raw_text or not isinstance(raw_text, str):
        return ""
    text = raw_text.strip()

    # Unwrap accidental outer markdown code block
    if text.startswith("```markdown") and text.endswith("```"):
        text = text[11:-3].strip()
    elif text.startswith("```") and text.endswith("```") and text[3:-3].count("```") == 0:
        text = text[3:-3].strip()

    # Extract after Core Content / Final Response if present
    import re
    core_match = re.search(r"(?:^|\n)(?:#{1,4}\s*)?(?:Core Content|Final Response|Student Response|Actual Response|Educational Response)[:\s]*\n([\s\S]+)", text, re.IGNORECASE)
    if core_match and len(core_match.group(1).strip()) > 20:
        text = core_match.group(1).strip()

    # Strip self-evaluation checklists at the end
    text = re.sub(r"(?:^|\n)(?:#{1,4}\s*)?(?:Self-Evaluation|Self Evaluation|Verification|Quality Check|Checklist)[:\s]*\n[\s\S]*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?:^|\n)(?:Did I address[\s\S]*?(?:Yes|No|Verified)\.?)+[\s\S]*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?:^|\n)Did I (?:address|keep|answer|cover|maintain)[\s\S]*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?:^|\n)Is the content accurate[\s\S]*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?:^|\n)Closing/Next Steps[:\s]*$", "", text, flags=re.IGNORECASE)

    # Line-by-line filtering of reasoning prefixes
    lines = text.split("\n")
    clean_lines = []
    in_preamble = True

    for line in lines:
        trimmed = line.strip()
        if in_preamble:
            if not trimmed:
                continue
            is_marker = bool(re.match(r"^(?:#{1,4}\s*)?(?:Persona|Tone|Current Status|Intent|User Question|Generation Plan|Response Strategy|Analysis|Reasoning|Planning|Plan|Strategy)[:\s]", trimmed, re.IGNORECASE) or
                             re.match(r"^The user is asking (?:for|about)[:\s]?", trimmed, re.IGNORECASE) or
                             re.match(r"^Since this is (?:the first step|a question|an inquiry)[:\s]?", trimmed, re.IGNORECASE) or
                             re.match(r"^I (?:should|will|need to) (?:answer|explain|provide|maintain|structure)[:\s]?", trimmed, re.IGNORECASE))
            if is_marker:
                continue
            in_preamble = False
            clean_lines.append(line)
        else:
            if not re.match(r"^(?:Did I address|Did I keep|Is the content accurate)", trimmed, re.IGNORECASE):
                clean_lines.append(line)

    result = "\n".join(clean_lines).strip()
    return result if result else raw_text.strip()

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
            contents=prompt,
            config={
                "system_instruction": HUNTER_SYSTEM_PROMPT
            }
        )
        if response and response.text:
            return sanitize_system_guide_response(response.text)
    except Exception:
        pass

    # Standard HTTPS REST fallback for Gemini
    url = f"{config['base_url']}/models/{config['model']}:generateContent?key={config['api_key']}"
    payload = {
        "system_instruction": {
            "parts": [{"text": HUNTER_SYSTEM_PROMPT}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
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
            raw_text = candidates[0]["content"]["parts"][0]["text"]
            return sanitize_system_guide_response(raw_text)
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
            raw_text = choices[0]["message"]["content"]
            return sanitize_system_guide_response(raw_text)
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
    """Deterministic, high-quality educational knowledge engine for offline / unkeyed usage."""
    q = query.lower().strip()

    # 1. Greetings
    if q in ["hello", "hi", "hey", "greetings"] or (len(q) < 15 and "hello" in q):
        return """[SYSTEM GUIDE]

Greetings, Hunter. Your study systems are calibrated and ready.

What concept or syllabus topic do you wish to conquer today? You can ask for definitions, mathematical proofs, exam notes, or practice drills."""

    # 2. Statistics
    if "statistics" in q:
        return """[SYSTEM GUIDE]

Statistics is the branch of mathematics that deals with collecting, organizing, presenting, analyzing, and interpreting data.

### Main Steps of Statistics

1. **Data Collection**
   Gathering information from surveys, experiments, records, etc.

2. **Organization**
   Arranging collected data into tables, classifications, and frequency distributions.

3. **Presentation**
   Showing data using tables, charts, and graphs.

4. **Analysis**
   Applying statistical methods such as mean, median, mode, standard deviation, correlation, etc.

5. **Interpretation**
   Drawing meaningful conclusions from the analyzed data.

### Types of Statistics

**Descriptive Statistics**
Summarizes and describes collected data.
*Example*: The average marks of a class are 72.

**Inferential Statistics**
Uses sample data to make conclusions or predictions about a larger population.
*Example*: Using the results of 100 surveyed students to estimate the study habits of all students in a college.

⚔️ SYSTEM QUEST
Understand the difference between descriptive and inferential statistics before moving to the next topic."""

    # 3. Mean
    if "mean" in q or "average" in q:
        return """[SYSTEM GUIDE]

The **Mean** (arithmetic average) is the sum of all values in a dataset divided by the total number of values.

### Formula
For values $x_1, x_2, \\dots, x_n$:
$$\\bar{x} = \\frac{\\sum x_i}{n}$$

### Example
Values: $8, 12, 15, 20, 25$
$$\\text{Sum} = 8 + 12 + 15 + 20 + 25 = 80$$
$$n = 5$$
$$\\bar{x} = \\frac{80}{5} = 16$$

### Important Note
The mean is sensitive to extreme values (outliers). When outliers are present, the **Median** is often a better measure of central tendency."""

    # 4. Probability
    if "probability" in q:
        return """[SYSTEM GUIDE]

**Probability** is the measure of how likely an event is to occur out of all possible outcomes.

### Formula
$$P(E) = \\frac{\\text{Favorable Outcomes}}{\\text{Total Possible Outcomes}}$$
Where $0 \\le P(E) \\le 1$.

### Example
Rolling a fair 6-sided die to get an even number:
- Possible outcomes: $\\{1, 2, 3, 4, 5, 6\\}$ (Total = 6)
- Favorable outcomes: $\\{2, 4, 6\\}$ (Count = 3)
- $P(\\text{Even}) = \\frac{3}{6} = 0.5$ (50%)"""

    # 5. Bayes' Theorem
    if "bayes" in q and ("prove" in q or "proof" in q or "theorem" in q):
        return """[SYSTEM GUIDE]

### Proof of Bayes' Theorem

**Statement:**
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

### Step-by-Step Derivation:

1. By conditional probability definition:
   $$P(A|B) = \\frac{P(A \\cap B)}{P(B)} \\implies P(A \\cap B) = P(A|B) \\cdot P(B)$$

2. Similarly for $P(B|A)$:
   $$P(B|A) = \\frac{P(B \\cap A)}{P(A)} \\implies P(B \\cap A) = P(B|A) \\cdot P(A)$$

3. Since set intersection is symmetric ($A \\cap B = B \\cap A$):
   $$P(A|B) \\cdot P(B) = P(B|A) \\cdot P(A)$$

4. Dividing both sides by $P(B)$ (for $P(B) > 0$):
   $$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$
   $$\\blacksquare \\quad \\text{Q.E.D.}$$"""

    # 6. What should I study?
    if "what should i study" in q or "where should i start" in q:
        return """[SYSTEM GUIDE]

Based on your active curriculum matrix:

Your weakest current area is Basic Concepts of Statistics at 0% mastery. Start there.

Recommended:
1. Review definitions and formulas for descriptive statistics.
2. Complete a 5-question trial in the **Knowledge Trials** tab.
3. Check your **🕸️ Progression Web** to view the live radiance of your study branches."""

    # 7. Exam Notes
    if "exam note" in q or "exam notes" in q:
        return """[SYSTEM GUIDE]

### Structured Exam Notes: Statistics & Probability

1. **Central Tendency**
   - Mean: $\\bar{x} = \\frac{\\sum x}{n}$
   - Median: Middle value of ordered series
   - Mode: Most frequent value
   - Empirical relationship: $\\text{Mode} \\approx 3(\\text{Median}) - 2(\\text{Mean})$

2. **Measures of Dispersion**
   - Variance: $\\sigma^2 = \\frac{\\sum (x - \\mu)^2}{N}$
   - Standard Deviation: $\\sigma = \\sqrt{\\text{Variance}}$

3. **Probability Rules**
   - Addition Rule: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$
   - Multiplication Rule (Independent): $P(A \\cap B) = P(A) \\cdot P(B)$"""

    # 8. Questions
    if "question" in q:
        return """[SYSTEM GUIDE]

Here are 5 practice questions for your knowledge review:

1. **Q1**: What is the arithmetic mean of $10, 20, 30, 40, 50$?
   - *Answer*: $30$

2. **Q2**: Which measure of central tendency is least affected by outliers?
   - *Answer*: The Median.

3. **Q3**: What is the probability of rolling a sum of 7 with two standard dice?
   - *Answer*: $6/36 = 1/6$.

4. **Q4**: If $P(A) = 0.4$ and $P(B) = 0.5$ for independent events, find $P(A \\cap B)$.
   - *Answer*: $0.4 \\times 0.5 = 0.2$.

5. **Q5**: State the relationship between variance and standard deviation.
   - *Answer*: Standard deviation is the positive square root of variance."""

    # 9. CS / Algorithms
    if any(k in q for k in ["dijkstra", "shortest path", "graph", "tree"]):
        return """[SYSTEM GUIDE]

**Dijkstra's Algorithm - Core Breakdown:**

1. **Definition & Purpose**:
   Computes the single-source shortest path for a directed or undirected graph with non-negative edge weights.

2. **Core Invariant**:
   Greedily extracts the unvisited vertex with minimum tentative distance from a priority queue.

3. **Time Complexity**:
   - Standard Binary Min-Heap: **O((V + E) log V)**
   - Fibonacci Heap: **O(E + V log V)**

4. **Weakness**:
   Fails on negative edge weights. For negative weights, deploy **Bellman-Ford (O(V * E))**."""

    return f"""[SYSTEM GUIDE]

### Concept Analysis: {query}

1. **Definition**:
   {query} represents a key concept in your study curriculum.

2. **Core Principles**:
   - Understand the foundational mechanisms from first principles.
   - Connect the concept to neighboring topics in your syllabus.

3. **Practice**:
   - Test your understanding in the **Knowledge Trials** tab or enter a **Dungeon Gate** to earn Hunter XP!"""
