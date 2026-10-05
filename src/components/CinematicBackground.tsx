import React, { useEffect, useRef } from 'react';

export const CinematicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

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

    // Subtle ambient mana motes (lightweight: 30 particles on desktop, 15 on mobile)
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 15 : 32;
    const colors = ['rgba(6, 182, 212, ', 'rgba(168, 85, 247, ', 'rgba(99, 102, 241, '];

    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.2), // slow upward drift like anime mana
      size: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.4 + 0.1,
      baseAlpha: Math.random() * 0.4 + 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.angle += m.pulseSpeed;
        m.alpha = m.baseAlpha + Math.sin(m.angle) * 0.15;

        // Wrap around screen edges
        if (m.y < -10) m.y = height + 10;
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `${m.color}${Math.max(0.05, m.alpha)})`;
        ctx.shadowColor = m.color.slice(0, -2);
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Layer 1: Atmospheric Radial Glow Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-700/6 blur-[140px]" />
      <div className="absolute top-[40%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-blue-600/4 blur-[100px]" />

      {/* Layer 2: Subtle anime mana particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Layer 3: Occasional laser energy streaks */}
      <div className="anime-energy-streak w-[280px] top-[18%] left-[-10%]" style={{ animationDelay: '0s' }} />
      <div className="anime-energy-streak w-[340px] top-[62%] left-[10%]" style={{ animationDelay: '4.5s' }} />
      <div className="anime-energy-streak w-[220px] top-[85%] left-[-5%]" style={{ animationDelay: '7.2s' }} />

      {/* Subtle vignette border */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#020408]/60" />
    </div>
  );
};
