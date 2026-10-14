import React, { useEffect, useRef } from 'react';
import { WeatherState } from './CinematicRainfallEngine';

interface Droplet {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  age: number;
  lifetime: number;
  velocity: number;
  trailLength: number;
}

interface CameraLensDropletsProps {
  weather: WeatherState;
  enabled: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export const CameraLensDroplets: React.FC<CameraLensDropletsProps> = ({
  weather,
  enabled,
  graphicsQuality
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropletsRef = useRef<Droplet[]>([]);

  useEffect(() => {
    if (!enabled || graphicsQuality === 'low') {
      dropletsRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnInterval = {
      light: 2200,
      moderate: 1200,
      heavy: 600,
      storm: 300
    }[weather];

    let lastSpawn = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Spawn new subtle droplet
      if (now - lastSpawn > spawnInterval && dropletsRef.current.length < 18) {
        lastSpawn = now;
        const radius = Math.random() * 3.5 + 2.0; // 2.0 - 5.5px small subtle drops
        dropletsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          alpha: 0,
          maxAlpha: Math.random() * 0.35 + 0.25, // Translucent (0.25 - 0.6)
          age: 0,
          lifetime: Math.random() * 2.5 + 3.0, // 3 to 5.5s
          velocity: Math.random() < 0.35 ? Math.random() * 15 + 5 : 0, // only some run down
          trailLength: 0
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & render droplets
      for (let i = dropletsRef.current.length - 1; i >= 0; i--) {
        const d = dropletsRef.current[i];
        d.age += dt;

        // Fade in first 0.5s, fade out last 1.2s
        if (d.age < 0.5) {
          d.alpha = (d.age / 0.5) * d.maxAlpha;
        } else if (d.age > d.lifetime - 1.2) {
          d.alpha = Math.max(0, ((d.lifetime - d.age) / 1.2) * d.maxAlpha);
        } else {
          d.alpha = d.maxAlpha;
        }

        // Trickle down
        if (d.velocity > 0 && d.age > 0.8) {
          const move = d.velocity * dt;
          d.y += move;
          d.trailLength += move;
        }

        // Draw translucent water bead with specular highlight & shadow rim
        if (d.alpha > 0.01) {
          ctx.save();

          // 1. Faint water trail if running down
          if (d.trailLength > 4) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y - d.trailLength);
            ctx.lineTo(d.x, d.y);
            ctx.strokeStyle = `rgba(186, 230, 253, ${d.alpha * 0.18})`;
            ctx.lineWidth = d.radius * 0.4;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // 2. Glassy droplet body (soft refraction ring)
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(15, 23, 42, ${d.alpha * 0.22})`; // subtle dark lens bead
          ctx.fill();

          ctx.strokeStyle = `rgba(224, 242, 254, ${d.alpha * 0.55})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // 3. Specular highlight glint (curved water surface reflection)
          ctx.beginPath();
          ctx.arc(d.x - d.radius * 0.35, d.y - d.radius * 0.35, d.radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.85})`;
          ctx.fill();

          ctx.restore();
        }

        // Remove expired
        if (d.age >= d.lifetime || d.y > canvas.height + 10) {
          dropletsRef.current.splice(i, 1);
        }
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, weather, graphicsQuality]);

  if (!enabled || graphicsQuality === 'low') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
