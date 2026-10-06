import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Trash2, X, RefreshCw } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
  isResetting?: boolean;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  isResetting = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      setError('Please type RESET to confirm.');
      return;
    }
    soundManager.playSfx('damage');
    try {
      await onConfirmReset();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/50 p-6 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(244,63,94,0.3)] bg-gradient-to-b from-slate-900/95 via-rose-950/40 to-slate-950/95">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-monarch font-bold text-lg text-rose-200">
                RESET HUNTER PROGRESS?
              </h3>
              <p className="text-[11px] font-mono-tech text-slate-400">
                Permanent Progression Reset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/20 text-xs font-mono-tech space-y-2 text-slate-300">
          <div className="text-rose-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>This will permanently reset:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
            <li>Level & XP to <b>Level 1 (0 XP)</b></li>
            <li>Hunter Rank to <b>F/E-Rank Novice</b></li>
            <li>All completed quests & daily progress</li>
            <li>Dungeon clears & boss raid victories</li>
            <li>Unlocked Shadow Army soldiers</li>
            <li>Skill Tree unlocks & skill points</li>
            <li>Study streaks & revision statistics</li>
          </ul>
          <div className="pt-2 border-t border-slate-800 text-emerald-400 text-[11px]">
            ✓ <b>Your Google account and login will remain intact.</b>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono-tech text-rose-300 uppercase block font-semibold">
            Type <span className="text-white font-bold bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/40">RESET</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError(null);
            }}
            placeholder="Type RESET here"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-200 font-mono-tech text-sm focus:outline-none focus:border-rose-400"
          />
          {error && (
            <p className="text-xs font-mono-tech text-rose-400">{error}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={confirmText.trim().toUpperCase() !== 'RESET' || isResetting}
            className="py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset My Progress</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
