import React, { useEffect, useRef } from 'react';
import { Sparkles, Crown, Zap, X, Shield, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../utils/audio';

export interface SystemNotification {
  isOpen: boolean;
  type: 'levelup' | 'rankup' | 'arise' | 'quest';
  title: string;
  message: string;
  subtext?: string;
  bonusPoints?: number;
}

interface SystemNotificationModalProps {
  notification: SystemNotification;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'spark' | 'rune';
  rotation: number;
  vRot: number;
}

export const SystemNotificationModal: React.FC<SystemNotificationModalProps> = ({
  notification,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle explosion & continuous ambient mana motes effect
  useEffect(() => {
    if (!notification.isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const colors = notification.type === 'arise' 
      ? ['#c084fc', '#a855f7', '#7e22ce', '#38bdf8', '#ffffff'] 
      : ['#06b6d4', '#38bdf8', '#818cf8', '#c084fc', '#fbbf24', '#ffffff'];

    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Initial High-Impact Particle Shockwave
    const burstCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 120;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        shape: Math.random() > 0.4 ? 'circle' : 'spark',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }

    // 2. Ambient Rising Monarch Aura Motes
    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Continuously spawn ambient floating mana motes
      if (frame % 3 === 0 && particles.length < 200) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 450,
          y: centerY + 200 + Math.random() * 100,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(Math.random() * 2.5 + 1.2),
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.7 + 0.3,
          decay: Math.random() * 0.008 + 0.004,
          shape: 'circle',
          rotation: 0,
          vRot: 0
        });
      }

      // Update and render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98; // slight drag
        p.vy *= 0.98;
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'spark') {
          // Diamond / mana shard
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 2);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size * 2);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [notification.isOpen, notification.type]);

  if (!notification.isOpen) return null;

  const isArise = notification.type === 'arise';
  const isLevelUp = notification.type === 'levelup';
  const themeGlow = isArise 
    ? 'shadow-[0_0_60px_rgba(168,85,247,0.5)] border-purple-400' 
    : 'shadow-[0_0_60px_rgba(6,182,212,0.5)] border-cyan-400';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden">
        {/* Fullscreen Canvas Particle Burst System */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Shockwave Radial Wave Behind Modal */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: [0.8, 1.8, 2.4], opacity: [0.8, 0.3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          className={`absolute w-96 h-96 rounded-full pointer-events-none ${
            isArise ? 'bg-purple-600/20 border-2 border-purple-400/40' : 'bg-cyan-500/20 border-2 border-cyan-400/40'
          }`}
        />

        {/* Main Modal Card Container with Framer Motion */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 40, rotateX: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -30 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 24, 
            mass: 0.8 
          }}
          className={`
            relative z-20 overflow-hidden rounded-2xl border-2 ${themeGlow}
            bg-gradient-to-b from-[#0a1329] via-[#070b16] to-[#04060c] p-6 sm:p-8 max-w-lg w-full text-center
          `}
        >
          {/* Sweeping Energy Light Ray Animation on Top Border */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute top-0 left-0 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent pointer-events-none"
          />

          {/* Close Button */}
          <button
            onClick={() => {
              soundManager.playSfx('click');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 transition-colors z-30"
            aria-label="Close Notification"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Rotating Runic Circle Aura Behind Center Icon */}
          <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
            {/* Outer Runic Ring Spinning */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-0 rounded-full border border-dashed ${
                isArise ? 'border-purple-400/50' : 'border-cyan-400/50'
              }`}
            />
            {/* Inner Counter-spinning Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-2 rounded-full border border-dotted ${
                isArise ? 'border-purple-300/40' : 'border-cyan-300/40'
              }`}
            />

            {/* Glowing Icon Hub */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className={`
                relative z-10 w-20 h-20 rounded-full flex items-center justify-center
                ${isArise 
                  ? 'bg-purple-950/80 border-2 border-purple-400 text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.7)]' 
                  : 'bg-cyan-950/80 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.7)]'}
              `}
            >
              {isArise ? (
                <Crown className="w-10 h-10 text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
              ) : isLevelUp ? (
                <Zap className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              ) : (
                <Sparkles className="w-10 h-10 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              )}
            </motion.div>
          </div>

          {/* System Protocol Kicker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-1.5 text-xs font-mono-tech uppercase tracking-widest text-cyan-400 font-bold mb-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>[ SYSTEM PROTOCOL: MONARCH AWAKENING ]</span>
          </motion.div>

          {/* Main Title */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="font-monarch font-black text-2xl sm:text-3xl text-slate-50 tracking-wide"
          >
            {notification.title}
          </motion.h2>

          {/* Notification Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-slate-200 mt-3 leading-relaxed max-w-md mx-auto"
          >
            {notification.message}
          </motion.p>

          {/* Subtext Badge / Thresholds */}
          {notification.subtext && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono-tech text-cyan-300 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{notification.subtext}</span>
            </motion.div>
          )}

          {/* Stat Points Granted Highlight */}
          {notification.bonusPoints && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring' }}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-xs font-mono-tech text-amber-300 font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+{notification.bonusPoints} Stat Points Granted to Character Sheet</span>
            </motion.div>
          )}

          {/* Primary Acknowledge Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <button
              onClick={() => {
                soundManager.playSfx('click');
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Acknowledge System Directive</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
