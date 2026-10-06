import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  ChevronRight, 
  UserCheck, 
  Swords, 
  Lock,
  Flame,
  Globe
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LoginScreenProps {
  onLogin: (email: string, displayName: string, photoUrl?: string) => Promise<void>;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Quick Google Sign-In Demo Accounts or Direct Google Auth
  const handleGoogleContinue = async (chosenEmail?: string, chosenName?: string) => {
    soundManager.playSfx('click');
    setAuthenticating(true);
    setLoginError(null);

    const email = chosenEmail || customEmail || 'hunter.monarch@gmail.com';
    const name = chosenName || customName || (email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()));

    try {
      await onLogin(email, name, `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`);
      soundManager.playSfx('levelup');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Google authentication failed');
      soundManager.playSfx('damage');
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Anime Atmosphere Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070f] via-[#090d1f] to-[#05070f] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md space-y-7">
        
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono-tech tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>MONARCH HUNTER GATEWAY</span>
          </div>

          <h1 className="font-monarch font-black text-4xl sm:text-5xl tracking-widest bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
            STUDYBUDDY
          </h1>

          <p className="text-sm font-mono-tech text-slate-400 tracking-wider">
            Your journey begins here.
          </p>
        </div>

        {/* Authentication Glass Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/30 shadow-[0_0_50px_-15px_rgba(6,182,212,0.3)] space-y-5 backdrop-blur-xl">
          
          {/* Main Google Sign-In Action */}
          <button
            type="button"
            onClick={() => handleGoogleContinue()}
            disabled={authenticating || isLoading}
            className="w-full py-4 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-heading font-black text-sm sm:text-base flex items-center justify-center gap-3.5 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {/* Official Google G SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{authenticating ? 'AUTHENTICATING HUNTER...' : 'Continue with Google'}</span>
          </button>

          {/* Quick Account Switcher for Testing multiple Google IDs */}
          <div className="pt-2">
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-[1px] bg-slate-800" />
              <span className="text-[11px] font-mono-tech text-slate-500 uppercase">Or Select Hunter Account</span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGoogleContinue('sung.jin.woo@gmail.com', 'Sung Jin-Study')}
                className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-left text-xs font-mono-tech transition-all flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-[10px]">
                  S
                </div>
                <div className="truncate">
                  <div className="text-slate-200 font-medium truncate">Sung Jin-Study</div>
                  <div className="text-[10px] text-slate-500 truncate">sung.jin.woo@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleContinue('novice.cadet@gmail.com', 'Novice Cadet')}
                className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 text-left text-xs font-mono-tech transition-all flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-[10px]">
                  N
                </div>
                <div className="truncate">
                  <div className="text-slate-200 font-medium truncate">New Hunter</div>
                  <div className="text-[10px] text-slate-500 truncate">novice.cadet@...</div>
                </div>
              </button>
            </div>

            {/* Custom Google Email input */}
            <div className="pt-3">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono-tech flex items-center justify-center gap-1 w-full text-center hover:underline"
                >
                  <span>Use custom Google account</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 animate-fade-in">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono-tech focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Hunter Display Name (Optional)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono-tech focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleGoogleContinue(customEmail, customName)}
                    disabled={!customEmail}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono-tech text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Authenticate with Google Identity
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error display */}
          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono-tech text-center">
              ⚠️ {loginError}
            </div>
          )}

          {/* Features Highlights */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono-tech text-slate-400">
            <div className="space-y-1">
              <Shield className="w-4 h-4 mx-auto text-cyan-400" />
              <div>Cloud Saved</div>
            </div>
            <div className="space-y-1">
              <Flame className="w-4 h-4 mx-auto text-amber-400" />
              <div>Level 1 Start</div>
            </div>
            <div className="space-y-1">
              <Globe className="w-4 h-4 mx-auto text-purple-400" />
              <div>Multi-Device</div>
            </div>
          </div>
        </div>

        {/* Security / Privacy Footnote */}
        <div className="text-center text-xs text-slate-500 font-mono-tech flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>OAuth 2.0 Secure Session • Zero password storage</span>
        </div>
      </div>
    </div>
  );
};
