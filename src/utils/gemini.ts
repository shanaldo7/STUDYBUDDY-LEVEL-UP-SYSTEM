/**
 * StudyBuddy AI - Multi-Provider AI Engine with Automatic Model Selection & Diagnostics
 * Supports Google Gemini, OpenAI, OpenRouter, Groq, Together AI, Ollama, and Custom endpoints.
 * Never logs or exposes secret API keys.
 */

import { GoogleGenAI } from '@google/genai';
import { AIProviderConfig, AIProvider } from '../types/hunter';

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

export const HUNTER_SYSTEM_PROMPT = `
You are the Hunter System Guide & Tactical Architect of StudyBuddy AI — a dark-fantasy gamified study system inspired by dungeon hunting monarchs.
Your role:
- Provide precise, rigorous, and intellectually thorough study explanations.
- Speak in a disciplined, high-ranking Hunter System voice ("Tactical Directive:", "Mana Efficiency:", "Analysis:").
- Help the Hunter master difficult concepts in Mathematics, Computer Science, Physics, Engineering, and Deep Learning.
- When asked for quiz questions, formulate challenging multi-choice questions with full explanations.
- Keep responses concise, clear, and actionable. Never use generic corporate cheerleading; treat the user as an Awakened Monarch sharpening their intellect.
`;

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
export async function askHunterGuide(prompt: string, customConfig?: AIProviderConfig): Promise<string> {
  const config = customConfig || getDefaultAIConfig();
  const effectiveModel = config.model || resolveAutoModel(config.provider);
  const resolvedConfig = { ...config, model: effectiveModel };
  const cleanKey = (resolvedConfig.apiKey || '').trim();

  // Ollama does not strictly require an API key
  const requiresKey = resolvedConfig.provider !== 'ollama';

  if (requiresKey && (!cleanKey || cleanKey === 'MY_GEMINI_API_KEY')) {
    const fallback = generateTacticalResponse(prompt);
    return `⚠️ *[SYSTEM NOTICE: AI is not configured. Add an API key in the AI Configuration tab to enable live model reasoning.]*\n\n${fallback}`;
  }

  try {
    if (resolvedConfig.provider === 'gemini') {
      return await callGeminiREST(prompt, resolvedConfig);
    } else {
      return await callOpenAICompatible(prompt, resolvedConfig);
    }
  } catch (err: unknown) {
    let safeMsg = 'Unable to connect to AI provider.';
    if (err instanceof Error) {
      if (err.message.includes('Invalid API key') || err.message.includes('401') || err.message.toLowerCase().includes('api_key') || err.message.toLowerCase().includes('key not valid')) {
        safeMsg = 'The provider rejected the API key.';
      } else {
        safeMsg = err.message;
        if (cleanKey && safeMsg.includes(cleanKey)) {
          safeMsg = safeMsg.replace(cleanKey, '••••');
        }
      }
    }

    const fallback = generateTacticalResponse(prompt);
    return `⚠️ *[SYSTEM ALERT: Provider connection failed (${safeMsg}). Reverting to local tactical reasoning matrix.]*\n\n${fallback}`;
  }
}

async function callGeminiREST(prompt: string, config: AIProviderConfig): Promise<string> {
  const cleanKey = (config.apiKey || '').trim();
  const initialModel = config.model || 'gemini-2.5-flash';
  const modelsToTry = [initialModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== initialModel)];

  let lastDiag: { title: string; description: string; safeDiagnostic: string } | null = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${HUNTER_SYSTEM_PROMPT}\n\nHunter Inquiry: ${prompt}` }
              ]
            }
          ]
        })
      }, 20000);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
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
        contents: [{ role: 'user', parts: [{ text: `${HUNTER_SYSTEM_PROMPT}\n\nHunter Inquiry: ${prompt}` }] }]
      });
      if (sdkResponse && sdkResponse.text) {
        return sdkResponse.text;
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

async function callOpenAICompatible(prompt: string, config: AIProviderConfig): Promise<string> {
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

  const payload = {
    model: config.model || resolveAutoModel(config.provider),
    messages: [
      { role: 'system', content: HUNTER_SYSTEM_PROMPT },
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
  return content;
}

export function generateTacticalResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('dijkstra') || q.includes('shortest path') || q.includes('graph')) {
    return `[SYSTEM DIRECTIVE: GRAPH THEORY ANALYSIS]

**Dijkstra's Algorithm - Tactical Breakdown:**
1. **Core Invariant**: Greedily extracts the unvisited vertex with the minimum tentative distance.
2. **Time Complexity**:
   - With standard Binary Min-Heap: **O((V + E) log V)**.
   - With Fibonacci Heap: **O(E + V log V)** (theoretical optimal amortized decrease-key).
3. **Weakness**: Fails on negative edge weights due to greedy irrevocable finalization. For negative weights, deploy **Bellman-Ford (O(V * E))**.
4. **Hunter Advice**: When implementing in competitive gates, always maintain a visited set or check if the popped distance exceeds the current distance vector to prune obsolete queue entries.`;
  }

  if (q.includes('calculus') || q.includes('derivative') || q.includes('integral') || q.includes('eigen')) {
    return `[SYSTEM DIRECTIVE: MATHEMATICAL ANALYSIS]

**Linear Algebra & Matrix Operations:**
- **Eigenvalues**: Roots of characteristic polynomial det(A - lambda * I) = 0.
- **Geometric Meaning**: Directions where the linear transformation acts merely as scalar stretching without changing direction.
- **Trace & Determinant Rules**:
  - det(A) = Product of eigenvalues. If 0, the matrix collapses dimensionality and has non-trivial nullspace.
  - tr(A) = Sum of eigenvalues = Sum of diagonal elements.
- **Hunter Protocol**: When tackling multidimensional exam gates, always verify symmetry: symmetric matrices are guaranteed to have real eigenvalues and orthogonal eigenvectors.`;
  }

  if (q.includes('focus') || q.includes('pomodoro') || q.includes('tired') || q.includes('procrastinat')) {
    return `[SYSTEM DIRECTIVE: MONARCH WILLPOWER PROTOCOL]

**Fatigue & Focus Management:**
1. **The 25/5 Interval**: High-intensity mental exertion consumes neurotransmitters rapidly. Limit continuous uninterrupted deep work to 25-50 minute bursts.
2. **Dopamine Detoxification**: Close external notification portals. The Hunter brain cannot maintain flow state with dual-context switching.
3. **Action Step**: Enter the **Focus Room** tab now, engage the Binaural Focus Frequency soundscape, and clear a 25-minute Pomodoro gate to earn +50 XP and 20 Mana.`;
  }

  return `[SYSTEM INTEL REPORT: DIRECTIVE ACCEPTED]

**Target Subject**: ${query}

**System Recommendation**:
1. **Deconstruct the Core Invariant**: Isolate the foundational axioms before attempting higher-order derivatives or edge cases.
2. **Active Recall Execution**: Do not merely read passively. Close the reference notes and reconstruct the mechanism from first principles on scratch paper.
3. **Trial By Combat**: Test your knowledge in the **Dungeon Battles** or **Quizzes** tab to reinforce neural synaptic strength and earn Hunter XP.

*The System awaits your next query, Hunter.*`;
}
