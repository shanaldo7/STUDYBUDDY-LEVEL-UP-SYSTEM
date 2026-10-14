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

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 1. 3D Stars / Deep Space Motes
    const starCount = window.innerWidth < 768 ? 40 : 80;
    const stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 1000 + 100,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      baseColor: Math.random() > 0.5 ? '168, 85, 247' : '6, 182, 212' // Purple or Cyan
    }));

    // 2. Anime Mana Particles Drifting Upward
    const manaCount = window.innerWidth < 768 ? 16 : 36;
    const colors = ['rgba(6, 182, 212, ', 'rgba(168, 85, 247, ', 'rgba(99, 102, 241, ', 'rgba(245, 158, 11, '];
    const motes = Array.from({ length: manaCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.7 + 0.25),
      size: Math.random() * 2.5 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.1,
      baseAlpha: Math.random() * 0.5 + 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      angle: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      const mouseOffsetX = (mouseX - width / 2) * 0.05;
      const mouseOffsetY = (mouseY - height / 2) * 0.05;

      // Render 3D Deep Space Starfield
      const fov = 400;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= 0.6; // Fly forward slowly
        if (s.z <= 10) {
          s.z = 1000;
          s.x = (Math.random() - 0.5) * width * 1.5;
          s.y = (Math.random() - 0.5) * height * 1.5;
        }

        const screenX = (s.x - mouseOffsetX * 1.5) * (fov / s.z) + width / 2;
        const screenY = (s.y - mouseOffsetY * 1.5) * (fov / s.z) + height / 2;
        const scale = (fov / s.z) * s.size;

        if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
          const brightness = (1 - s.z / 1000) * s.alpha;
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(0.6, scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.baseColor}, ${brightness})`;
          ctx.fill();
        }
      }

      // Render Drifting Mana Motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.angle += m.pulseSpeed;
        m.alpha = m.baseAlpha + Math.sin(m.angle) * 0.2;

        // Subtle mouse push
        const dx = m.x - mouseX;
        const dy = m.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          m.x += (dx / dist) * 1.2;
          m.y += (dy / dist) * 1.2;
        }

        // Screen wrapping
        if (m.y < -10) m.y = height + 10;
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `${m.color}${Math.max(0.05, m.alpha)})`;
        ctx.shadowColor = m.color.slice(0, -2);
        ctx.shadowBlur = 10;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Layer 1: Atmospheric Radial Glow Mesh with Nebulae */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/6 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-700/8 blur-[140px]" />
      <div className="absolute top-[40%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-indigo-600/5 blur-[100px]" />
      <div className="absolute bottom-[20%] left-[25%] w-[30vw] h-[30vw] rounded-full bg-amber-500/4 blur-[110px]" />

      {/* Layer 2: Interactive 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Layer 3: Laser Energy Streaks */}
      <div className="anime-energy-streak w-[280px] top-[18%] left-[-10%]" style={{ animationDelay: '0s' }} />
      <div className="anime-energy-streak w-[340px] top-[62%] left-[10%]" style={{ animationDelay: '4.5s' }} />
      <div className="anime-energy-streak w-[220px] top-[85%] left-[-5%]" style={{ animationDelay: '7.2s' }} />

      {/* Layer 4: Vignette Border */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#020408]/70" />
    </div>
  );
};
