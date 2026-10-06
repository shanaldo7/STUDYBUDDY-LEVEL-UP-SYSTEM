/**
 * StudyBuddy AI - Multi-Provider AI Engine with Automatic Model Selection & Diagnostics
 * Supports Google Gemini, OpenAI, OpenRouter, Groq, Together AI, Ollama, and Custom endpoints.
 * Never logs or exposes secret API keys.
 */

import { GoogleGenAI } from '@google/genai';
import { AIProviderConfig, AIProvider } from '../types/hunter';
import { sanitizeSystemGuideResponse } from './responseSanitizer';

export interface ProviderMeta {
  id: AIProvider;
  name: string;
  defaultModel: string;
  models: string[];
  defaultBaseUrl: string;
  needsBaseUrl: boolean;
  placeholder: string;
  apiKeyUrl?: string;
  apiKeyUrlLabel?: string;
  instructions?: string;
}

export const PROVIDERS: Record<AIProvider, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    needsBaseUrl: false,
    placeholder: 'Enter Gemini API key...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    apiKeyUrlLabel: 'Get API Key ↗',
    instructions: 'Create an API key from Google AI Studio and paste it below.'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    needsBaseUrl: false,
    placeholder: 'sk-proj-...',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyUrlLabel: 'Get API Key ↗',
    instructions: 'Create an API key from the OpenAI developer platform.'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-r1'
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    needsBaseUrl: false,
    placeholder: 'sk-or-v1-...',
    apiKeyUrl: 'https://openrouter.ai/keys',
    apiKeyUrlLabel: 'Get API Key ↗',
    instructions: 'Get your key from OpenRouter to access unified AI models.'
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    needsBaseUrl: false,
    placeholder: 'gsk_...',
    apiKeyUrl: 'https://console.groq.com/keys',
    apiKeyUrlLabel: 'Get API Key ↗',
    instructions: 'Ultra-low latency inference powered by Groq LPU engine.'
  },
  together: {
    id: 'together',
    name: 'Together AI',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    defaultBaseUrl: 'https://api.together.xyz/v1',
    needsBaseUrl: false,
    placeholder: 'tog_...',
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    apiKeyUrlLabel: 'Get API Key ↗'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama / Local',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'phi3', 'qwen2.5', 'deepseek-r1'],
    defaultBaseUrl: 'http://localhost:11434/v1',
    needsBaseUrl: true,
    placeholder: 'Not required for local Ollama',
    apiKeyUrl: 'https://ollama.com/',
    apiKeyUrlLabel: 'Download Ollama ↗',
    instructions: 'Ollama runs locally on your machine. Ensure Ollama is running (`ollama run llama3.2`). No API key required.'
  },
  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    defaultModel: 'default-model',
    models: ['default-model'],
    defaultBaseUrl: 'http://localhost:8000/v1',
    needsBaseUrl: true,
    placeholder: 'Optional API key if required by your server',
    instructions: 'Enter the API base URL provided by your AI provider.'
  }
};

export const HUNTER_SYSTEM_PROMPT = `You are the System Guide, an intelligent and encouraging academic tutor in StudyBuddy.

Your mission is to help students learn and master their syllabus concepts with clarity and confidence.

RESPONSE GUIDELINES:
1. Educational Priority:
   - Act primarily as a clear, supportive academic tutor.
   - For simple or factual questions (e.g., "what is statistics", "what is mean", "define median", "what is probability"), provide a clean, direct explanation without long narratives or roleplay.
   - For detailed requests ("explain in detail", "give exam notes"), provide thorough, well-structured academic notes.
   - For exam answers ("give me exam answer for ..."), format with clear headings, definitions, key formulas/points, and an exam-ready structure.

2. Natural Typo Correction:
   - If the student mistypes an academic term (e.g., "what is statistoic", "what is meanng", "probablity", "what is avrage"), infer the intended concept naturally.
   - Start naturally: "You probably mean **statistics**." and then provide the clean explanation.

3. Subtle System Style:
   - Use clean, minimal System styling (e.g., ⚔️ or 🎯 in section titles).
   - NEVER create lengthy RPG narratives, military briefings, or protocol initialization logs for simple academic questions.
   - NEVER dump or repeat the student's profile, level, rank, or syllabus stats unless they explicitly ask ("What should I study next?" or "Show my progress").

4. Syllabus Integration:
   - Use the background syllabus context silently to provide relevant examples and mention the related topic (e.g., "📚 Syllabus Link: Probability and Statistics → Basic Concepts of Statistics").
   - If a question is outside the syllabus, answer it helpfully and naturally without forcing syllabus connections.

5. Next Steps:
   - Conclude with at most ONE helpful next step or follow-up question (e.g., "Want me to explain qualitative vs quantitative data next?" or "Want me to quiz you on this?").
   - NEVER claim that XP was awarded, levels were gained, or quests were completed in your message text. Backend systems handle game progression.

6. Output Purity:
   - Output ONLY the final message intended for the student.
   - Do NOT include internal planning, drafting steps, meta-commentary, or self-evaluations.
   - Start immediately with the student-facing answer.`;

export function buildHunterSystemPrompt(studentContext?: string): string {
  let prompt = HUNTER_SYSTEM_PROMPT;

  if (studentContext && studentContext.trim()) {
    prompt += `\n\nBACKGROUND SYLLABUS CONTEXT (Use silently to tailor explanations and examples):\n${studentContext.trim()}`;
  }

  return prompt;
}

export function resolveAutoModel(provider: AIProvider): string {
  switch (provider) {
    case 'gemini':
      return 'gemini-2.5-flash';
    case 'openrouter':
      return 'meta-llama/llama-3.3-70b-instruct';
    case 'openai':
      return 'gpt-4o-mini';
    case 'groq':
      return 'llama-3.3-70b-versatile';
    case 'together':
      return 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
    case 'ollama':
      return 'llama3.2';
    case 'custom':
      return 'default-model';
    default:
      return 'gemini-2.5-flash';
  }
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  const clean = key.trim();
  if (clean.length <= 8) return '••••••••';
  return `${clean.slice(0, 4)}••••••••${clean.slice(-4)}`;
}

export function getDefaultAIConfig(): AIProviderConfig {
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY ||
                 (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  const hasValidEnvKey = envKey && envKey !== 'MY_GEMINI_API_KEY';

  return {
    provider: 'gemini',
    apiKey: hasValidEnvKey ? envKey : '',
    model: resolveAutoModel('gemini'),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  };
}

/**
 * Timeout-guarded fetch utility
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err: unknown) {
    clearTimeout(id);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  }
}

export interface TestConnectionResult {
  success: boolean;
  providerName: string;
  model: string;
  latencyMs?: number;
  message: string;
  errorTitle?: string;
  errorDescription?: string;
  error?: string;
  safeDiagnostic?: string;
}

/**
 * Parses provider response errors into safe, structured diagnostic messages
 */
function parseAndDiagnoseError(
  provider: AIProvider,
  stage: 'model discovery' | 'model validation' | 'test ping',
  status?: number,
  errorBody?: string | null,
  rawError?: unknown
): { title: string; description: string; safeDiagnostic: string } {
  const bodyStr = errorBody || '';
  let parsedJson: Record<string, unknown> | null = null;
  try {
    parsedJson = JSON.parse(bodyStr);
  } catch {
    // raw string
  }

  // Check Google Gemini error format: { error: { code, message, status, details: [...] } }
  const geminiError = parsedJson?.error as { code?: number; message?: string; status?: string; details?: Array<{ reason?: string; message?: string }> } | undefined;
  const geminiReason = geminiError?.details?.[0]?.reason || '';
  const geminiStatus = geminiError?.status || '';
  const geminiMessage = geminiError?.message || '';

  // Check OpenAI / Groq error format: { error: { message, type, code } }
  const openAiError = parsedJson?.error as { message?: string; type?: string; code?: string } | undefined;
  const openAiCode = openAiError?.code || '';
  const openAiMessage = openAiError?.message || '';

  const bodyLower = bodyStr.toLowerCase();

  // 1. Timeout Error
  if (rawError instanceof Error && rawError.message === 'TIMEOUT') {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: timeout | Error type: TIMEOUT`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Network error',
      description: 'The connection timed out while contacting the provider. Please check your internet connection.',
      safeDiagnostic
    };
  }

  // 2. Network / Offline Error
  if (rawError instanceof TypeError || (rawError instanceof Error && (rawError.message.includes('fetch') || rawError.message.includes('network')))) {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: network_failure | Error type: NETWORK_ERROR`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Network error',
      description: provider === 'ollama' 
        ? 'Could not reach local Ollama on http://localhost:11434. Please ensure Ollama is running (`ollama run llama3.2`).'
        : 'The application could not reach the provider.',
      safeDiagnostic
    };
  }

  // 3. Invalid API Key
  if (
    geminiReason === 'API_KEY_INVALID' ||
    geminiMessage.toLowerCase().includes('api key not valid') ||
    openAiCode === 'invalid_api_key' ||
    status === 401 ||
    bodyLower.includes('api_key_invalid') ||
    bodyLower.includes('invalid_api_key') ||
    bodyLower.includes('incorrect api key') ||
    bodyLower.includes('invalid api key')
  ) {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: ${status || 401} | Error type: API_KEY_INVALID`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Invalid API key',
      description: 'The provider rejected the API key.',
      safeDiagnostic
    };
  }

  // 4. Permission Denied / Access Denied
  if (
    status === 403 ||
    geminiStatus === 'PERMISSION_DENIED' ||
    bodyLower.includes('permission_denied') ||
    bodyLower.includes('access denied')
  ) {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: 403 | Error type: PERMISSION_DENIED`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'API access denied',
      description: 'The API key is valid but does not have access to the requested API.',
      safeDiagnostic
    };
  }

  // 5. Rate Limit Reached
  if (
    status === 429 ||
    geminiStatus === 'RESOURCE_EXHAUSTED' ||
    bodyLower.includes('rate_limit') ||
    bodyLower.includes('quota') ||
    bodyLower.includes('resource_exhausted')
  ) {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: 429 | Error type: RESOURCE_EXHAUSTED`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Rate limit reached',
      description: 'The provider temporarily rejected the request because of rate limits.',
      safeDiagnostic
    };
  }

  // 6. Model Not Found
  if (
    status === 404 ||
    geminiStatus === 'NOT_FOUND' ||
    bodyLower.includes('model_not_found') ||
    bodyLower.includes('does not exist')
  ) {
    const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: 404 | Error type: NOT_FOUND`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Model unavailable',
      description: 'The selected provider does not currently support the automatically selected model.',
      safeDiagnostic
    };
  }

  // 7. Google Gemini 400 Invalid Argument (with specific safe reason)
  if (provider === 'gemini' && status === 400) {
    const cleanMsg = geminiMessage ? geminiMessage.replace(/[A-Za-z0-9_-]{25,}/g, '••••') : 'Invalid request parameters.';
    const safeDiagnostic = `Provider: Google Gemini | Stage: ${stage} | HTTP: 400 | Error type: ${geminiStatus || 'INVALID_ARGUMENT'}`;
    console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
    return {
      title: 'Gemini request rejected',
      description: cleanMsg,
      safeDiagnostic
    };
  }

  // 8. General / Fallback Provider Error
  const generalMsg = (openAiMessage || geminiMessage || 'The provider integration returned an unexpected error.').replace(/[A-Za-z0-9_-]{25,}/g, '••••');
  const safeDiagnostic = `Provider: ${PROVIDERS[provider]?.name || provider} | Stage: ${stage} | HTTP: ${status || 'N/A'} | Error type: GENERAL`;
  console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
  return {
    title: 'Provider configuration error',
    description: generalMsg,
    safeDiagnostic
  };
}

/**
 * Strict filter to ensure only text-in / text-out models are selected for normal StudyBuddy AI
 */
function isNormalTextGenerationModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  if (
    lower.includes('tts') ||
    lower.includes('preview-tts') ||
    lower.includes('audio') ||
    lower.includes('speech') ||
    lower.includes('voice') ||
    lower.includes('sound') ||
    lower.includes('music') ||
    lower.includes('realtime') ||
    lower.includes('live') ||
    lower.includes('imagen') ||
    lower.includes('image-generation') ||
    lower.includes('embed') ||
    lower.includes('embedding') ||
    lower.includes('whisper') ||
    lower.includes('transcription') ||
    lower.includes('vision-only') ||
    lower.includes('robotics') ||
    lower.includes('bison') ||
    lower.includes('aqa')
  ) {
    return false;
  }
  return true;
}

/**
 * Automatically discovers models and returns the optimal text-generation model
 */
async function discoverModelAutomatically(
  provider: AIProvider,
  apiKey: string,
  baseUrl: string
): Promise<{ model: string; error?: { title: string; description: string; safeDiagnostic: string } }> {
  if (provider === 'custom') {
    return { model: 'default-model' };
  }

  if (provider === 'ollama') {
    try {
      const res = await fetchWithTimeout('http://localhost:11434/api/tags', { method: 'GET' }, 3000);
      if (res.ok) {
        const data = await res.json();
        const modelsList = data?.models;
        if (Array.isArray(modelsList) && modelsList.length > 0) {
          const first = modelsList[0]?.name || modelsList[0]?.model;
          if (first && isNormalTextGenerationModel(first)) return { model: first };
        }
      }
    } catch {
      // fallback
    }
    return { model: 'llama3.2' };
  }

  // 1. Google Gemini Discovery
  if (provider === 'gemini') {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { method: 'GET' },
        5000
      );

      if (!res.ok) {
        let errBody = '';
        try {
          errBody = await res.text();
        } catch {
          // ignore
        }
        const diag = parseAndDiagnoseError('gemini', 'model discovery', res.status, errBody);
        if (diag.title === 'Invalid API key' || diag.title === 'API access denied') {
          return { model: 'gemini-2.5-flash', error: diag };
        }
        return { model: 'gemini-2.5-flash' };
      }

      const data = await res.json();
      const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = data?.models || [];
      
      // Filter for text generation support and strictly exclude audio/TTS/image models
      const textGenModels = models.filter(m => {
        const methods = m.supportedGenerationMethods || [];
        const cleanName = m.name.replace(/^models\//, '');
        const supportsGen = methods.length === 0 || methods.includes('generateContent');
        return supportsGen && isNormalTextGenerationModel(cleanName);
      });

      const modelNames = textGenModels.map(m => m.name.replace(/^models\//, ''));

      // Priority ranking of standard text Flash / Pro models
      const priorityList = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b'
      ];

      for (const p of priorityList) {
        if (modelNames.includes(p)) {
          return { model: p };
        }
      }

      // If any other valid text-generation model exists in list
      const fallbackText = modelNames.find(isNormalTextGenerationModel);
      if (fallbackText) {
        return { model: fallbackText };
      }

      // If models list was returned but had no text models
      if (models.length > 0 && modelNames.length === 0) {
        const safeDiagnostic = 'Provider: Google Gemini | Stage: model selection | Reason: no compatible text-generation model found';
        console.info(`[StudyBuddy AI Diagnostics] ${safeDiagnostic}`);
        return {
          model: 'gemini-2.5-flash',
          error: {
            title: 'Model selection error',
            description: 'No compatible text-generation model was found on your account.',
            safeDiagnostic
          }
        };
      }
    } catch (err: unknown) {
      const diag = parseAndDiagnoseError('gemini', 'model discovery', undefined, null, err);
      if (diag.title === 'Network error') {
        return { model: 'gemini-2.5-flash', error: diag };
      }
    }
    return { model: 'gemini-2.5-flash' };
  }

  // 2. OpenAI Discovery
  if (provider === 'openai') {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` }
      }, 5000);

      if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch {}
        const diag = parseAndDiagnoseError('openai', 'model discovery', res.status, errBody);
        if (diag.title === 'Invalid API key' || diag.title === 'API access denied') {
          return { model: 'gpt-4o-mini', error: diag };
        }
        return { model: 'gpt-4o-mini' };
      }

      const data = await res.json();
      const ids: string[] = (data?.data || []).map((m: { id: string }) => m.id);
      if (ids.includes('gpt-4o-mini')) return { model: 'gpt-4o-mini' };
      if (ids.includes('gpt-4o')) return { model: 'gpt-4o' };
    } catch (err: unknown) {
      const diag = parseAndDiagnoseError('openai', 'model discovery', undefined, null, err);
      if (diag.title === 'Network error') return { model: 'gpt-4o-mini', error: diag };
    }
    return { model: 'gpt-4o-mini' };
  }

  // 3. Groq Discovery
  if (provider === 'groq') {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` }
      }, 5000);

      if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch {}
        const diag = parseAndDiagnoseError('groq', 'model discovery', res.status, errBody);
        if (diag.title === 'Invalid API key' || diag.title === 'API access denied') {
          return { model: 'llama-3.3-70b-versatile', error: diag };
        }
        return { model: 'llama-3.3-70b-versatile' };
      }

      const data = await res.json();
      const ids: string[] = (data?.data || []).map((m: { id: string }) => m.id);
      if (ids.includes('llama-3.3-70b-versatile')) return { model: 'llama-3.3-70b-versatile' };
      if (ids.includes('llama-3.1-8b-instant')) return { model: 'llama-3.1-8b-instant' };
    } catch (err: unknown) {
      const diag = parseAndDiagnoseError('groq', 'model discovery', undefined, null, err);
      if (diag.title === 'Network error') return { model: 'llama-3.3-70b-versatile', error: diag };
    }
    return { model: 'llama-3.3-70b-versatile' };
  }

  // 4. OpenRouter / Together
  return { model: resolveAutoModel(provider) };
}

const GEMINI_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b'
];

/**
 * Performs connection test with auto-model discovery and minimal valid generateContent ping
 */
export async function testAIConnection(config: AIProviderConfig): Promise<TestConnectionResult> {
  const meta = PROVIDERS[config.provider] || PROVIDERS.gemini;
  const start = performance.now();
  const cleanKey = (config.apiKey || '').trim();

  // Ollama does not require an API key
  if (config.provider !== 'ollama' && (!cleanKey || cleanKey.length === 0)) {
    return {
      success: false,
      providerName: meta.name,
      model: resolveAutoModel(config.provider),
      message: 'AI is not configured. Add an API key to activate the AI system.',
      errorTitle: 'AI is not configured',
      errorDescription: 'Add an API key to activate the AI system.',
      error: 'AI is not configured. Add an API key to activate the AI system.'
    };
  }

  const baseUrl = (config.baseUrl || meta.defaultBaseUrl).replace(/\/+$/, '');

  // Step 1: Model Discovery & Key Validation
  const discovery = await discoverModelAutomatically(config.provider, cleanKey, baseUrl);
  if (discovery.error) {
    return {
      success: false,
      providerName: meta.name,
      model: discovery.model,
      message: 'Connection failed',
      errorTitle: discovery.error.title,
      errorDescription: discovery.error.description,
      error: discovery.error.description,
      safeDiagnostic: discovery.error.safeDiagnostic
    };
  }

  const initialModel = discovery.model;

  // Step 2: Send minimal valid text-generation test request
  try {
    if (config.provider === 'gemini') {
      const modelsToTry = [initialModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== initialModel)];
      let lastDiag: { title: string; description: string; safeDiagnostic: string } | null = null;

      for (const candidateModel of modelsToTry) {
        const pingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        
        try {
          const res = await fetchWithTimeout(pingUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: 'Reply with exactly: OK' }
                  ]
                }
              ]
            })
          }, 9000);

          if (res.ok) {
            const elapsed = Math.round(performance.now() - start);
            return {
              success: true,
              providerName: meta.name,
              model: candidateModel,
              latencyMs: elapsed,
              message: '✓ AI SYSTEM ONLINE'
            };
          }

          let errBody = '';
          try { errBody = await res.text(); } catch {}

          const diag = parseAndDiagnoseError('gemini', 'test ping', res.status, errBody);
          lastDiag = diag;

          // Stop immediately on genuine auth/quota failure
          if (diag.title === 'Invalid API key' || diag.title === 'API access denied' || diag.title === 'Rate limit reached') {
            return {
              success: false,
              providerName: meta.name,
              model: candidateModel,
              message: 'Connection failed',
              errorTitle: diag.title,
              errorDescription: diag.description,
              error: diag.description,
              safeDiagnostic: diag.safeDiagnostic
            };
          }
          // On 404 (model not found) or 400 (modality/unsupported model), loop to next candidate
        } catch (err: unknown) {
          const diag = parseAndDiagnoseError('gemini', 'test ping', undefined, null, err);
          lastDiag = diag;
          if (diag.title === 'Network error') {
            return {
              success: false,
              providerName: meta.name,
              model: candidateModel,
              message: 'Connection failed',
              errorTitle: diag.title,
              errorDescription: diag.description,
              error: diag.description,
              safeDiagnostic: diag.safeDiagnostic
            };
          }
        }
      }

      // If all candidates failed
      const diag = lastDiag || {
        title: 'Model unavailable',
        description: 'The provider does not currently support the requested text models.',
        safeDiagnostic: 'Provider: Google Gemini | Stage: test ping | HTTP: 404 | Error type: NOT_FOUND'
      };

      return {
        success: false,
        providerName: meta.name,
        model: initialModel,
        message: 'Connection failed',
        errorTitle: diag.title,
        errorDescription: diag.description,
        error: diag.description,
        safeDiagnostic: diag.safeDiagnostic
      };
    } else {
      const endpoint = `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }

      if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://studybuddy.ai';
        headers['X-Title'] = 'StudyBuddy AI Monarch Hunter';
      }

      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: initialModel,
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 5
        })
      }, 9000);

      if (!res.ok) {
        let errBody = '';
        try {
          errBody = await res.text();
        } catch {
          // ignore
        }
        const diag = parseAndDiagnoseError(config.provider, 'test ping', res.status, errBody);
        return {
          success: false,
          providerName: meta.name,
          model: initialModel,
          message: 'Connection failed',
          errorTitle: diag.title,
          errorDescription: diag.description,
          error: diag.description,
          safeDiagnostic: diag.safeDiagnostic
        };
      }

      const elapsed = Math.round(performance.now() - start);
      return {
        success: true,
        providerName: meta.name,
        model: initialModel,
        latencyMs: elapsed,
        message: '✓ AI SYSTEM ONLINE'
      };
    }
  } catch (err: unknown) {
    const diag = parseAndDiagnoseError(config.provider, 'test ping', undefined, null, err);
    return {
      success: false,
      providerName: meta.name,
      model: initialModel,
      message: 'Connection failed',
      errorTitle: diag.title,
      errorDescription: diag.description,
      error: diag.description,
      safeDiagnostic: diag.safeDiagnostic
    };
  }
}

/**
 * Main query function for Hunter Guide AI
 */
export async function askHunterGuide(
  prompt: string, 
  customConfig?: AIProviderConfig,
  customSystemInstruction?: string
): Promise<string> {
  const config = customConfig || getDefaultAIConfig();
  const effectiveModel = config.model || resolveAutoModel(config.provider);
  const resolvedConfig = { ...config, model: effectiveModel };
  const cleanKey = (resolvedConfig.apiKey || '').trim();

  // Ollama does not strictly require an API key
  const requiresKey = resolvedConfig.provider !== 'ollama';

  if (requiresKey && (!cleanKey || cleanKey === 'MY_GEMINI_API_KEY')) {
    const fallback = generateTacticalResponse(prompt);
    return sanitizeSystemGuideResponse(fallback);
  }

  try {
    if (resolvedConfig.provider === 'gemini') {
      return await callGeminiREST(prompt, resolvedConfig, customSystemInstruction);
    } else {
      return await callOpenAICompatible(prompt, resolvedConfig, customSystemInstruction);
    }
  } catch {
    const fallback = generateTacticalResponse(prompt);
    return sanitizeSystemGuideResponse(fallback);
  }
}

export async function callGeminiREST(
  prompt: string, 
  config?: AIProviderConfig,
  customSystemInstruction?: string
): Promise<string> {
  const activeConfig = config || getDefaultAIConfig();
  const cleanKey = (activeConfig.apiKey || '').trim();
  const initialModel = activeConfig.model || 'gemini-2.5-flash';
  const modelsToTry = [initialModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== initialModel)];

  const systemPrompt = buildHunterSystemPrompt(customSystemInstruction);
  let lastDiag: { title: string; description: string; safeDiagnostic: string } | null = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      }, 20000);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return sanitizeSystemGuideResponse(text);
      } else {
        let errBody = '';
        try { errBody = await res.text(); } catch {}
        const diag = parseAndDiagnoseError('gemini', 'test ping', res.status, errBody);
        lastDiag = diag;

        // If invalid API key, permission denied, or rate limit, throw immediately
        if (diag.title === 'Invalid API key' || diag.title === 'API access denied' || diag.title === 'Rate limit reached') {
          throw new Error(`${diag.title}: ${diag.description}`);
        }
        // On 404/400 modality errors, try next model candidate in loop
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Invalid API key') || err.message.includes('API access denied') || err.message.includes('Rate limit reached'))) {
        throw err;
      }
      const diag = parseAndDiagnoseError('gemini', 'test ping', undefined, null, err);
      lastDiag = diag;
    }
  }

  // Fallback to GoogleGenAI SDK
  for (const model of modelsToTry.slice(0, 3)) {
    try {
      const ai = new GoogleGenAI({ apiKey: cleanKey });
      const sdkResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
      if (sdkResponse && sdkResponse.text) {
        return sanitizeSystemGuideResponse(sdkResponse.text);
      }
    } catch {
      // ignore and try next model
    }
  }

  if (lastDiag) {
    throw new Error(`${lastDiag.title}: ${lastDiag.description}`);
  }

  throw new Error('Empty response received from Gemini engine.');
}

export async function callOpenAICompatible(
  prompt: string, 
  config: AIProviderConfig,
  customSystemInstruction?: string
): Promise<string> {
  const providerMeta = PROVIDERS[config.provider] || PROVIDERS.openai;
  const baseUrl = (config.baseUrl || providerMeta.defaultBaseUrl).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const cleanKey = (config.apiKey || '').trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (cleanKey) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  }

  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://studybuddy.ai';
    headers['X-Title'] = 'StudyBuddy AI Monarch Hunter';
  }

  const systemPrompt = buildHunterSystemPrompt(customSystemInstruction);

  const payload = {
    model: config.model || resolveAutoModel(config.provider),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  };

  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }, 20000);

  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch {}
    const diag = parseAndDiagnoseError(config.provider, 'test ping', res.status, errBody);
    throw new Error(`${diag.title}: ${diag.description}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No completion returned by endpoint.');
  }
  return sanitizeSystemGuideResponse(content);
}

export function generateTacticalResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // 1. Hello / Greetings
  if (/^(hello|hi|hey|greetings|system)/i.test(q) && q.length < 25) {
    return `⚔️ **Welcome to StudyBuddy**

Greetings! Your study systems are calibrated and ready.

What concept or syllabus topic do you want to master today? You can ask for a definition, exam notes, practice questions, or ask what to study next.`;
  }

  // 2. Statistics Typos ("statistoic", "statstics", "statistcs", etc.)
  if (q.includes('statistoic') || q.includes('statstics') || q.includes('statistcs') || q.includes('statisic')) {
    return `⚔️ **Statistics**

You probably mean **statistics**.

Statistics is the study of collecting, organizing, analyzing, interpreting, and presenting data.

**Example:** If you collect the marks of 50 students and calculate their average, highest mark, and lowest mark, you are using statistics.

Two major branches are:
• **Descriptive Statistics** — summarizes collected data (e.g., class average is 72).
• **Inferential Statistics** — uses sample data to make conclusions about a larger population.

📚 **Syllabus Link:** Probability and Statistics → Basic Concepts of Statistics.

Want me to explain **qualitative and quantitative data** next?`;
  }

  // 3. Explain Statistics in Detail
  if ((q.includes('statistic') || q.includes('statistics')) && (q.includes('detail') || q.includes('comprehensive') || q.includes('depth') || q.includes('deep'))) {
    return `⚔️ **Statistics (Comprehensive Breakdown)**

Statistics is the discipline concerned with the collection, organization, analysis, interpretation, and presentation of data.

### 1. The Core Scientific Workflow
1. **Data Collection**: Obtaining raw measurements through observational studies, experiments, surveys, or system logs.
2. **Organization & Classification**: Grouping raw figures into structured frequency tables, categories, and intervals.
3. **Presentation**: Visualizing distributions using histograms, frequency polygons, ogives, and bar charts.
4. **Analysis**: Computing numerical indices such as central tendency (mean, median, mode) and dispersion (variance, standard deviation).
5. **Interpretation**: Formulating empirical conclusions and hypothesis testing.

### 2. Primary Classifications
• **Descriptive Statistics**: Focuses on organizing and summarizing the observed dataset without drawing conclusions beyond it (e.g., sample mean $\\bar{x}$, standard deviation $s$).
• **Inferential Statistics**: Generalizes findings from a random sample to an entire population using probability models (e.g., confidence intervals, hypothesis testing).

### 3. Data Types
• **Qualitative (Categorical)**: Nominal (names/labels) and Ordinal (ranked orders).
• **Quantitative (Numerical)**: Discrete (countable whole numbers) and Continuous (measurable real values).

📚 **Syllabus Link:** Probability and Statistics → Basic Concepts of Statistics.

Want me to provide an exam-ready answer or quiz you on these concepts?`;
  }

  // 4. Exam Answer for Statistics
  if ((q.includes('exam') || q.includes('2 mark') || q.includes('5 mark') || q.includes('test answer')) && (q.includes('stat') || q.includes('concept'))) {
    return `⚔️ **Exam-Ready Answer: Basic Concepts of Statistics**

**Q: Define Statistics and explain its main functions and branches.**

---

### 1. Definition (2 Marks)
**Statistics** is defined as the science of collecting, organizing, presenting, analyzing, and interpreting numerical data to draw valid conclusions and make reasonable decisions.
> *"Statistics may be called the science of counting or the science of estimates and probabilities."*

### 2. Main Steps & Functions (3 Marks)
1. **Collection of Data**: Systematic gathering from primary or secondary sources.
2. **Organization of Data**: Classifying raw data into frequency distributions.
3. **Presentation of Data**: Representing data in charts, graphs, and tables.
4. **Analysis of Data**: Calculating summary metrics (Mean, Variance, Correlation).
5. **Interpretation of Data**: Drawing conclusions for practical decision making.

### 3. Two Main Branches (2 Marks)
- **Descriptive Statistics**: Techniques to summarize and describe features of a dataset.
- **Inferential Statistics**: Methods of using sample data to make generalized predictions about a population.

### 4. Key Limitations for Exam Notes
- Deals only with aggregates, not isolated single observations.
- Deals only with quantitative characteristics unless qualitative traits are coded.

📚 **Syllabus Reference:** Unit 1 — Probability & Statistics.

Want me to quiz you on this topic before your exams?`;
  }

  // 5. Quiz me on statistics / Quiz request
  if (q.includes('quiz me') || (q.includes('quiz') && q.includes('stat')) || q.includes('test me on stat')) {
    return `⚔️ **Knowledge Trial: Statistics Fundamentals**

Here are 3 quick check questions to test your grasp:

**Question 1:**
Which branch of statistics deals with making inferences and predictions about an entire population based on a sample?
A) Descriptive Statistics
B) Inferential Statistics
C) Qualitative Statistics
D) Experimental Statistics

**Question 2:**
If a dataset contains extreme outliers (e.g., $10, 12, 14, 15, 950$), which measure of central tendency is the most reliable?
A) Mean
B) Median
C) Mode
D) Range

**Question 3:**
The count of students in a lecture hall is an example of:
A) Qualitative data
B) Continuous quantitative data
C) Discrete quantitative data
D) Nominal data

Type your answers (e.g., **B, B, C**) and I will evaluate your trial! Or click the **Knowledge Trials (Quizzes)** tab for a full interactive run.`;
  }

  // 6. Normal Statistics ("what is statistics", "define statistics")
  if (q.includes('what is statistics') || q === 'statistics' || (q.includes('statistics') && (q.includes('define') || q.includes('meaning')))) {
    return `⚔️ **Statistics**

Statistics is the study of collecting, organizing, analyzing, interpreting, and presenting data.

**Example:** If you collect the marks of 50 students and calculate their average, highest mark, and lowest mark, you are using statistics.

Two major branches are:
• **Descriptive Statistics** — summarizes collected data (e.g., class average is 72).
• **Inferential Statistics** — uses sample data to make conclusions about a larger population.

📚 **Syllabus Link:** Probability and Statistics → Basic Concepts of Statistics.

Want me to explain **qualitative and quantitative data** next?`;
  }

  // 7. What should I study next?
  if (q.includes('what should i study') || q.includes('where should i start') || q.includes('recommend') || q.includes('study next')) {
    return `🎯 **Recommended Study Target**

Based on your active curriculum:

**Priority Topic:** **Qualitative and Quantitative Data**
*(Subject: Probability and Statistics → Basic Concepts)*

**Why this topic?**
Understanding the distinction between categorical (qualitative) and numerical (quantitative) data is essential before constructing frequency distributions and computing averages.

**Quick Action Plan:**
1. Review the difference between nominal, ordinal, discrete, and continuous variables.
2. Complete a 3-question trial in the **Knowledge Trials (Quizzes)** tab.
3. Spend 20 minutes in the **Focus Sanctuary** taking structured notes.

Shall we begin with the definitions of qualitative vs quantitative data?`;
  }

  // 8. Mean & Average (with typos like "avrage", "meanng")
  if (q.includes('mean') || q.includes('average') || q.includes('avrage') || q.includes('meanng')) {
    return `⚔️ **Mean (Arithmetic Average)**

${q.includes('avrage') || q.includes('meanng') ? 'You probably mean the **arithmetic mean**.\n\n' : ''}The **Mean** is the central value of a set of numbers, calculated by summing all values and dividing by the total count of numbers.

**Formula:**
$$\\bar{x} = \\frac{\\sum x}{n}$$

For grouped data with frequencies $f_i$:
$$\\bar{x} = \\frac{\\sum f_i x_i}{\\sum f_i}$$

**Simple Example:**
If five students score $70, 80, 85, 90,$ and $95$:
$$\\text{Sum} = 70 + 80 + 85 + 90 + 95 = 420$$
$$\\bar{x} = \\frac{420}{5} = 84$$

📚 **Syllabus Link:** Probability and Statistics → Measures of Central Tendency.

Want me to show you how outliers affect the mean versus the median?`;
  }

  // 9. Median
  if (q.includes('median')) {
    return `⚔️ **Median**

The **Median** is the middle value in a dataset when all observations are arranged in ascending or descending order.

**How to compute it:**
1. Sort values from least to greatest.
2. If $n$ is odd: Median is the middle number at position $\\frac{n+1}{2}$.
3. If $n$ is even: Median is the average of the two middle numbers at positions $\\frac{n}{2}$ and $\\frac{n}{2} + 1$.

**Example:**
Dataset: $3, 7, 9, 15, 22$ (5 numbers)
The middle number is **9**.

📚 **Syllabus Link:** Probability and Statistics → Measures of Central Tendency.

Unlike the mean, the median is resistant to extreme outliers. Want to see a comparison?`;
  }

  // 10. Qualitative vs Quantitative Data
  if (q.includes('qualitative') || q.includes('quantitative') || q.includes('types of data')) {
    return `⚔️ **Qualitative vs Quantitative Data**

**Qualitative Data (Categorical)**
Describes qualities, attributes, or characteristics that are non-numeric.
• **Examples:** Eye color, gender, college major, satisfaction rating.
• **Types:** *Nominal* (unordered labels like red/blue) and *Ordinal* (ordered categories like low/medium/high).

**Quantitative Data (Numerical)**
Consists of numbers representing measurable amounts or counts.
• **Examples:** Exam marks, student height, travel time, daily temperature.
• **Types:** *Discrete* (countable integers like number of books) and *Continuous* (measurable real numbers like 65.4 kg).

📚 **Syllabus Link:** Probability and Statistics → Classification of Data.

Want to test your classification knowledge with a quick 2-question drill?`;
  }

  // 11. Probability (with typos like "probablity")
  if (q.includes('probab')) {
    return `⚔️ **Probability**

${q.includes('probablity') ? 'You probably mean **probability**.\n\n' : ''}**Probability** is the mathematical measure of the likelihood that an event will occur, represented on a scale from $0$ (impossible) to $1$ (certain).

**Formula:**
$$P(E) = \\frac{n(E)}{n(S)} = \\frac{\\text{Number of favorable outcomes}}{\\text{Total possible outcomes}}$$

**Example:**
Rolling a single 6-sided die:
• Probability of rolling a 4: $\\frac{1}{6} \\approx 16.7\\%$
• Probability of rolling an even number ($2, 4, 6$): $\\frac{3}{6} = 0.5$ ($50\\%$)

📚 **Syllabus Link:** Probability and Statistics → Theory of Probability.

Want me to explain the difference between mutually exclusive and independent events?`;
  }

  // 12. Bayes' Theorem Proof
  if (q.includes('bayes')) {
    return `⚔️ **Bayes' Theorem**

**Statement:**
For any two events $A$ and $B$ where $P(B) > 0$:
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

### Step-by-Step Derivation:
1. By conditional probability definition:
   $$P(A|B) = \\frac{P(A \\cap B)}{P(B)} \\implies P(A \\cap B) = P(A|B) \\cdot P(B)$$
2. Similarly:
   $$P(B|A) = \\frac{P(B \\cap A)}{P(A)} \\implies P(B \\cap A) = P(B|A) \\cdot P(A)$$
3. Since set intersection is commutative ($A \\cap B = B \\cap A$):
   $$P(A|B) \\cdot P(B) = P(B|A) \\cdot P(A)$$
4. Dividing both sides by $P(B)$:
   $$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)} \\quad \\blacksquare$$

📚 **Syllabus Link:** Probability and Statistics → Conditional Probability.

Want to see an exam calculation applying Bayes' theorem to medical diagnosis or spam filtering?`;
  }

  // 13. Algorithms / CS
  if (q.includes('dijkstra') || q.includes('shortest path') || q.includes('graph')) {
    return `⚔️ **Dijkstra's Algorithm**

**Definition & Purpose:**
Computes the single-source shortest path for a directed or undirected graph with non-negative edge weights.

**Core Invariant:**
Greedily extracts the unvisited vertex with the minimum tentative distance. Once a vertex is extracted from the priority queue, its shortest distance is finalized.

**Time Complexity:**
- Standard Binary Min-Heap: **O((V + E) log V)**
- Fibonacci Heap: **O(E + V log V)**

**Critical Constraint:**
Fails when negative edge weights are present because greedily finalized distances may be shortened later. Use **Bellman-Ford (O(V · E))** for negative weights.`;
  }

  // 14. Default Concept Analysis
  return `⚔️ **Concept Analysis: ${query.trim()}**

${query.trim()} is an important concept in your curriculum.

**Key Study Points:**
1. **Definition**: Review the foundational definition and underlying axioms.
2. **Formula / Rules**: Note any mathematical relationships or governing principles.
3. **Application**: Work through a representative example without referencing the solution.

📚 **Syllabus Reference:** Active curriculum module.

Want me to explain this concept in detail or quiz you on it?`;
}
