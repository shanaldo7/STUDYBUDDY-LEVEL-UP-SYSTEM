import React, { useState } from 'react';
import { AIProviderConfig, AIProvider } from '../types/hunter';
import { PROVIDERS, maskApiKey, testAIConnection, resolveAutoModel, TestConnectionResult } from '../utils/gemini';
import { 
  Key, 
  ExternalLink,
  Zap,
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Globe
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface AIConfigViewProps {
  config: AIProviderConfig;
  onSaveConfig: (config: AIProviderConfig) => void;
  onNavigateToAssistant?: () => void;
}

export const AIConfigView: React.FC<AIConfigViewProps> = ({ config, onSaveConfig, onNavigateToAssistant }) => {
  const [provider, setProvider] = useState<AIProvider>(config.provider || 'gemini');
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [baseUrl, setBaseUrl] = useState<string>(config.baseUrl || PROVIDERS[config.provider]?.defaultBaseUrl || '');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionResult, setConnectionResult] = useState<TestConnectionResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const currentProviderMeta = PROVIDERS[provider] || PROVIDERS.gemini;

  // Handle Provider Switch
  const handleProviderChange = (newProvider: AIProvider) => {
    soundManager.playSfx('click');
    setProvider(newProvider);
    const meta = PROVIDERS[newProvider];
    setBaseUrl(meta.defaultBaseUrl);
    setConnectionResult(null);
  };

  // Connect & Save AI with 100% automatic model selection
  const handleConnectAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playSfx('click');

    // If provider is not Ollama and key is empty
    if (provider !== 'ollama' && (!apiKey || apiKey.trim().length === 0)) {
      setConnectionResult({
        success: false,
        providerName: currentProviderMeta.name,
        model: resolveAutoModel(provider),
        message: 'AI is not configured. Add an API key to activate the AI system.',
        error: 'AI is not configured. Add an API key to activate the AI system.'
      });
      soundManager.playSfx('damage');
      return;
    }

    setIsConnecting(true);
    setConnectionResult(null);

    // Automatically resolve the optimal model internally
    const autoModel = resolveAutoModel(provider);
    const resolvedConfig: AIProviderConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: autoModel,
      baseUrl: baseUrl.trim() || currentProviderMeta.defaultBaseUrl
    };

    try {
      const result = await testAIConnection(resolvedConfig);
      setIsConnecting(false);
      setConnectionResult(result);

      if (result.success) {
        soundManager.playSfx('victory');
        // Persist valid configuration with the verified model
        onSaveConfig({
          ...resolvedConfig,
          model: result.model || resolvedConfig.model
        });
      } else {
        soundManager.playSfx('damage');
      }
    } catch {
      setIsConnecting(false);
      setConnectionResult({
        success: false,
        providerName: currentProviderMeta.name,
        model: autoModel,
        message: 'Unable to connect. Please check your API key.',
        error: 'Unable to connect. Please check your API key.'
      });
      soundManager.playSfx('damage');
    }
  };

  const hasConfiguredKey = Boolean(apiKey && apiKey.trim().length > 3);
  const isOnline = Boolean((connectionResult?.success) || (hasConfiguredKey && !connectionResult));

  return (
    <div className="space-y-6 max-w-xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-1 pb-2 border-b border-cyan-500/20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono-tech tracking-wider uppercase">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>NEURAL INTERFACE</span>
        </div>
        <h1 className="font-monarch font-bold text-2xl text-slate-100 tracking-wide">
          ⚡ AI SYSTEM SETUP
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Enter your API key below. Model selection and tactical reasoning are handled automatically by the Hunter System.
        </p>
      </div>

      {/* Main Single-Form Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-cyan-500/30 shadow-[0_0_35px_-10px_rgba(6,182,212,0.25)] space-y-5">
        
        {/* 1. AI PROVIDER */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono-tech text-cyan-400 uppercase tracking-wider font-semibold block">
            AI PROVIDER
          </label>
          <div className="relative">
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-100 text-sm font-heading font-bold focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer transition-colors"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="groq">Groq</option>
              <option value="custom">Custom OpenAI-compatible API</option>
              <option value="ollama">Ollama / Local</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-400 text-xs font-mono-tech">
              ▼
            </div>
          </div>
        </div>

        {/* 2. API KEY WITH GET API KEY BUTTON */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono-tech text-cyan-400 uppercase tracking-wider font-semibold">
              API KEY
            </label>
            {hasConfiguredKey && (
              <span className="text-[11px] font-mono-tech text-emerald-400">
                Key Saved: {maskApiKey(apiKey)}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setConnectionResult(null);
              }}
              placeholder={provider === 'ollama' ? 'Local Ollama does not require an API key' : 'Paste API Key here...'}
              disabled={provider === 'ollama'}
              className={`
                w-full px-4 py-3 rounded-xl bg-slate-900 border text-slate-100 text-sm font-mono-tech focus:outline-none transition-colors pr-12
                ${provider === 'ollama' ? 'border-slate-800 opacity-60 cursor-not-allowed text-slate-500' : 'border-slate-700 focus:border-cyan-400'}
              `}
            />
            {provider !== 'ollama' && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 p-1"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Official Provider Get API Key Button */}
          {currentProviderMeta.apiKeyUrl && (
            <div className="pt-1 flex items-center justify-between">
              <a
                href={currentProviderMeta.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-heading font-semibold hover:underline"
              >
                <span>Get API Key ↗</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {provider === 'ollama' && (
                <span className="text-[11px] text-slate-400 font-mono-tech">
                  Runs on local machine
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. OPTIONAL ADVANCED SETTINGS (FOR CUSTOM ENDPOINTS ONLY) */}
        {(provider === 'custom' || provider === 'ollama') && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-slate-300 font-mono-tech flex items-center gap-1 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              <span>Advanced: Custom API Base URL</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-mono-tech text-purple-300 uppercase block flex items-center gap-1">
                  <Globe className="w-3 h-3" /> API Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={currentProviderMeta.defaultBaseUrl}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono-tech focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10px] text-slate-400 font-mono-tech">
                  {provider === 'custom'
                    ? 'Enter the API base URL provided by your AI provider.'
                    : 'Default: http://localhost:11434/v1'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. CONNECT AI ACTION BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleConnectAI()}
            disabled={isConnecting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                <span>CONNECTING AI SYSTEM...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>CONNECT AI</span>
              </>
            )}
          </button>
        </div>

        {/* 5. CONNECTION STATUS FEEDBACK */}
        {connectionResult && (
          <div 
            className={`
              p-4 rounded-xl border text-xs font-mono-tech leading-relaxed transition-all
              ${connectionResult.success 
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' 
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]'}
            `}
          >
            {connectionResult.success ? (
              <div className="space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ AI SYSTEM ONLINE</span>
                </div>
                <div className="text-slate-200">
                  {connectionResult.providerName} connected successfully.
                </div>
                <div className="text-emerald-400 text-[11px] flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connection: <b>Active</b> {connectionResult.latencyMs ? `(${connectionResult.latencyMs}ms)` : ''}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>✗ {connectionResult.errorTitle || 'Connection failed'}</span>
                </div>
                <div className="text-rose-100 font-medium">
                  {connectionResult.errorDescription || connectionResult.error || 'Please check your API key.'}
                </div>
                {connectionResult.safeDiagnostic && (
                  <div className="text-[11px] text-rose-300/80 pt-1.5 border-t border-rose-500/20 mt-1 font-mono-tech">
                    Diagnostic: {connectionResult.safeDiagnostic}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Online Badge */}
        {!connectionResult && (
          <div className="pt-1 flex items-center justify-center">
            {isOnline ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono-tech">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>✓ AI SYSTEM ONLINE</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-mono-tech">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>AI is not configured. Add an API key to activate the AI system.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Directive Card */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <b className="text-slate-300">Zero-Storage Guarantee:</b> Your API key is held only in active session memory. It is never saved to the SQLite database, committed to Git, or exposed in frontend code.
        </div>
      </div>
    </div>
  );
};
