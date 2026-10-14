/**
 * ThreeUI Dark Souls Holo Card — "The Ashen One" & Hunter Codex
 * Component for STUDYBUDDY: LEVEL UP — gamified study planner
 * 
 * Features:
 * - 5 Shader Themes: 'ashen-cinder', 'monarch-void', 'glacial-runes', 'golden-sovereign', 'crimson-berserk'
 * - Editable Hunter Name, Rank, Title, and Motto
 * - WebGL Three.js interactive 3D card with holographic rainbow foil sheen
 * - 360° Drag rotation, pointer tilt (-22° to +22°), dual-face flipping, zoom controls
 * - Drifting ambient particles matching the active theme (embers, void mana, frost crystals, stardust, blood sparks)
 * - Sound effects on flip & interact using soundManager
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import '@designcodeio/threeui/style.css';
import { HunterUser, ShadowSoldier } from '../../types/hunter';
import { RotateCcw, ZoomIn, ZoomOut, Flame, Sparkles, RefreshCw, Info, Palette } from 'lucide-react';
import { soundManager } from '../../utils/audio';

export type HoloCardTheme = 'ashen-cinder' | 'monarch-void' | 'glacial-runes' | 'golden-sovereign' | 'crimson-berserk';

export interface DarkSoulsHoloCardProps {
  variant?: 'ashen-one' | 'cindermane';
  theme?: HoloCardTheme;
  user?: HunterUser;
  shadow?: ShadowSoldier;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  onOpenCustomizer?: () => void;
}

interface ThemeConfig {
  name: string;
  badge: string;
  bgGradStart: string;
  bgGradMid: string;
  bgGradEnd: string;
  borderColor: string;
  borderInner: string;
  headerFill: string;
  headerText: string;
  titleColor: string;
  accentText: string;
  lightEmberColor: number;
  lightBlueColor: number;
  particleColors: [number, number, number];
  particleAlpha: string;
  sigilText: string;
  sigilColor: string;
  glowColor: string;
  frameBorderClass: string;
  frameGlowClass: string;
}

const THEME_CONFIGS: Record<HoloCardTheme, ThemeConfig> = {
  'ashen-cinder': {
    name: 'The Ashen One',
    badge: 'ASHEN CINDER',
    bgGradStart: '#201625',
    bgGradMid: '#120f1e',
    bgGradEnd: '#05040a',
    borderColor: '#d4af37',
    borderInner: '#f59e0b',
    headerFill: 'rgba(15, 23, 42, 0.9)',
    headerText: 'THE ASHEN ONE',
    titleColor: '#fef08a',
    accentText: '#f97316',
    lightEmberColor: 0xf97316,
    lightBlueColor: 0x38bdf8,
    particleColors: [0xf97316, 0xfbbf24, 0xef4444],
    particleAlpha: 'rgba(249, 115, 22, 0.4)',
    sigilText: 'ASHEN CINDER · BONFIRE SHRINE',
    sigilColor: '#ea580c',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    frameBorderClass: 'border-amber-500/40',
    frameGlowClass: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.35)]'
  },
  'monarch-void': {
    name: 'Shadow Monarch',
    badge: 'MONARCH VOID',
    bgGradStart: '#1d0f2f',
    bgGradMid: '#0e081c',
    bgGradEnd: '#030208',
    borderColor: '#a855f7',
    borderInner: '#c084fc',
    headerFill: 'rgba(19, 11, 33, 0.92)',
    headerText: 'SHADOW MONARCH',
    titleColor: '#e9d5ff',
    accentText: '#a855f7',
    lightEmberColor: 0xa855f7,
    lightBlueColor: 0x6366f1,
    particleColors: [0xa855f7, 0x818cf8, 0xc084fc],
    particleAlpha: 'rgba(168, 85, 247, 0.4)',
    sigilText: 'VOID ABYSS · SHADOW EXTRACTION',
    sigilColor: '#9333ea',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    frameBorderClass: 'border-purple-500/40',
    frameGlowClass: 'shadow-[0_0_40px_-10px_rgba(168,85,247,0.35)]'
  },
  'glacial-runes': {
    name: 'Glacial Sovereign',
    badge: 'GLACIAL RUNES',
    bgGradStart: '#081a2e',
    bgGradMid: '#061120',
    bgGradEnd: '#02050b',
    borderColor: '#38bdf8',
    borderInner: '#7dd3fc',
    headerFill: 'rgba(8, 25, 45, 0.92)',
    headerText: 'GLACIAL SOVEREIGN',
    titleColor: '#bae6fd',
    accentText: '#06b6d4',
    lightEmberColor: 0x06b6d4,
    lightBlueColor: 0x38bdf8,
    particleColors: [0x38bdf8, 0x06b6d4, 0xe0f2fe],
    particleAlpha: 'rgba(56, 189, 248, 0.4)',
    sigilText: 'ARCTIC RUNES · FROST SANCTUARY',
    sigilColor: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    frameBorderClass: 'border-cyan-500/40',
    frameGlowClass: 'shadow-[0_0_40px_-10px_rgba(6,182,212,0.35)]'
  },
  'golden-sovereign': {
    name: 'Golden Sovereign',
    badge: 'GOLDEN SOVEREIGN',
    bgGradStart: '#2c220c',
    bgGradMid: '#1a1406',
    bgGradEnd: '#080602',
    borderColor: '#fbbf24',
    borderInner: '#fde047',
    headerFill: 'rgba(30, 24, 10, 0.92)',
    headerText: 'GOLDEN SOVEREIGN',
    titleColor: '#fef08a',
    accentText: '#f59e0b',
    lightEmberColor: 0xfbbf24,
    lightBlueColor: 0xf59e0b,
    particleColors: [0xfbbf24, 0xfef08a, 0xd97706],
    particleAlpha: 'rgba(251, 191, 36, 0.4)',
    sigilText: 'SOLAR REGALIA · CELESTIAL CROWN',
    sigilColor: '#b45309',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    frameBorderClass: 'border-amber-400/40',
    frameGlowClass: 'shadow-[0_0_40px_-10px_rgba(251,191,36,0.35)]'
  },
  'crimson-berserk': {
    name: 'Crimson Berserk',
    badge: 'CRIMSON BERSERK',
    bgGradStart: '#2d0c11',
    bgGradMid: '#1a0609',
    bgGradEnd: '#090203',
    borderColor: '#ef4444',
    borderInner: '#f87171',
    headerFill: 'rgba(35, 10, 15, 0.92)',
    headerText: 'CRIMSON BERSERK',
    titleColor: '#fecaca',
    accentText: '#dc2626',
    lightEmberColor: 0xef4444,
    lightBlueColor: 0xb91c1c,
    particleColors: [0xef4444, 0xf87171, 0x991b1b],
    particleAlpha: 'rgba(239, 68, 68, 0.4)',
    sigilText: 'BLOOD ECLIPSE · BERSERKER RAGE',
    sigilColor: '#b91c1c',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    frameBorderClass: 'border-rose-500/40',
    frameGlowClass: 'shadow-[0_0_40px_-10px_rgba(244,63,94,0.35)]'
  }
};

export const DarkSoulsHoloCard: React.FC<DarkSoulsHoloCardProps> = ({
  variant = 'ashen-one',
  theme,
  user,
  shadow,
  className = '',
  interactive = true,
  showControls = true,
  onFlip,
  onOpenCustomizer
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEmbers, setShowEmbers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Active theme resolution
  const activeThemeKey: HoloCardTheme = theme || shadow?.theme || user?.cardTheme || 'monarch-void';
  const activeTheme = useMemo(() => THEME_CONFIGS[activeThemeKey] || THEME_CONFIGS['ashen-cinder'], [activeThemeKey]);

  // References to communicate with Three.js animation loop without re-triggering effects
  const interactionRef = useRef({
    pointerX: 0,
    pointerY: 0,
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    dragStartX: 0,
    dragStartY: 0,
    isPointerDown: false,
    flipProgress: 0, // 0 = front, 1 = back
    targetFlipProgress: 0,
    cameraDistance: 19,
    baseCameraDistance: 19,
    showEmbers: true,
    autoFloat: true,
    lastInteraction: Date.now()
  });

  // Keep interactionRef in sync with React state
  useEffect(() => {
    interactionRef.current.showEmbers = showEmbers;
  }, [showEmbers]);

  // Handle Flip with sound effect
  const handleToggleFlip = useCallback(() => {
    soundManager.playSfx('flip');
    setIsFlipped((prev) => {
      const next = !prev;
      interactionRef.current.targetFlipProgress = next ? 1 : 0;
      interactionRef.current.lastInteraction = Date.now();
      onFlip?.(next);
      return next;
    });
  }, [onFlip]);

  // Reset View
  const handleResetView = useCallback(() => {
    soundManager.playSfx('click');
    interactionRef.current.targetRotX = 0;
    interactionRef.current.targetRotY = 0;
    interactionRef.current.targetFlipProgress = 0;
    interactionRef.current.cameraDistance = interactionRef.current.baseCameraDistance;
    setIsFlipped(false);
    setZoomLevel(1);
    interactionRef.current.lastInteraction = Date.now();
    onFlip?.(false);
  }, [onFlip]);

  // Zoom In / Out
  const handleZoom = useCallback((delta: number) => {
    soundManager.playSfx('click');
    const current = interactionRef.current.cameraDistance;
    const next = Math.max(12, Math.min(28, current + delta));
    interactionRef.current.cameraDistance = next;
    setZoomLevel(Math.round((interactionRef.current.baseCameraDistance / next) * 100) / 100);
    interactionRef.current.lastInteraction = Date.now();
  }, []);

  // Three.js Canvas Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let cardGroup: THREE.Group | null = null;
    let embersMesh: THREE.Points | null = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Build Front Card Canvas Texture
    const createFrontTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1536;
      const ctx = canvas.getContext('2d')!;

      // 1. Deep Atmospheric Gradient
      const bgGrad = ctx.createRadialGradient(512, 700, 100, 512, 768, 850);
      bgGrad.addColorStop(0, activeTheme.bgGradStart);
      bgGrad.addColorStop(0.4, activeTheme.bgGradMid);
      bgGrad.addColorStop(0.8, activeTheme.bgGradEnd);
      bgGrad.addColorStop(1, '#020306');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 1536);

      // Radial base aura
      const baseAura = ctx.createRadialGradient(512, 1100, 50, 512, 1100, 500);
      baseAura.addColorStop(0, activeTheme.glowColor);
      baseAura.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      baseAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = baseAura;
      ctx.fillRect(0, 700, 1024, 836);

      // 2. Ornate Filigree Border
      ctx.save();
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, 944, 1456);

      ctx.strokeStyle = activeTheme.borderInner;
      ctx.lineWidth = 4;
      ctx.strokeRect(58, 58, 908, 1420);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(74, 74, 876, 1388);

      // Corner Accents
      const drawCorner = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeStyle = activeTheme.borderInner;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(60, 0);
        ctx.lineTo(60, 20);
        ctx.lineTo(20, 20);
        ctx.lineTo(20, 60);
        ctx.lineTo(0, 60);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = activeTheme.borderColor;
        ctx.beginPath();
        ctx.arc(35, 35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(50, 50, 0);
      drawCorner(974, 50, Math.PI / 2);
      drawCorner(974, 1486, Math.PI);
      drawCorner(50, 1486, -Math.PI / 2);

      // 3. Header Ribbon
      ctx.fillStyle = activeTheme.headerFill;
      ctx.fillRect(90, 90, 844, 130);
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(90, 90, 844, 130);

      // Card Title Text
      ctx.fillStyle = activeTheme.titleColor;
      ctx.font = 'bold 50px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = activeTheme.glowColor;
      ctx.shadowBlur = 20;
      const headerTitle = shadow ? shadow.grade.toUpperCase() : activeTheme.headerText;
      ctx.fillText(headerTitle, 512, 145);

      ctx.shadowBlur = 0;
      ctx.fillStyle = activeTheme.accentText;
      ctx.font = '600 22px Rajdhani, monospace';
      const headerSubtitle = shadow 
        ? `${shadow.rank || 'S'}-RANK · ${shadow.type.toUpperCase()}`
        : `${user?.hunterRank || 'S'}-RANK · ${user?.currentTitle || 'Awakened Champion'}`;
      ctx.fillText(headerSubtitle, 512, 190);

      // 4. Central Art Window: Sword Shrine / Sigil Chamber
      ctx.save();
      ctx.beginPath();
      ctx.rect(90, 240, 844, 820);
      ctx.clip();

      // Art background sky
      const skyGrad = ctx.createLinearGradient(512, 240, 512, 1060);
      skyGrad.addColorStop(0, '#06060e');
      skyGrad.addColorStop(0.5, activeTheme.bgGradStart);
      skyGrad.addColorStop(0.85, activeTheme.bgGradMid);
      skyGrad.addColorStop(1, '#020205');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(90, 240, 844, 820);

      // Celestial / Darksign Eclipse Sigil in Sky
      ctx.save();
      ctx.beginPath();
      ctx.arc(512, 450, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#030308';
      ctx.shadowColor = activeTheme.sigilColor;
      ctx.shadowBlur = 60;
      ctx.fill();

      ctx.lineWidth = 12;
      ctx.strokeStyle = activeTheme.borderInner;
      ctx.stroke();

      // Bleeding Corona Energy
      const bleedGrad = ctx.createLinearGradient(512, 450, 512, 750);
      bleedGrad.addColorStop(0, activeTheme.glowColor);
      bleedGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      bleedGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bleedGrad;
      ctx.beginPath();
      ctx.moveTo(492, 590);
      ctx.lineTo(512, 740);
      ctx.lineTo(532, 590);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Mound / Pedestal
      ctx.fillStyle = '#0c0e17';
      ctx.beginPath();
      ctx.ellipse(512, 980, 480, 200, 0, 0, Math.PI * 2);
      ctx.fill();

      // Central Shrine Glow
      const centerGlow = ctx.createRadialGradient(512, 860, 10, 512, 860, 260);
      centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      centerGlow.addColorStop(0.2, activeTheme.glowColor);
      centerGlow.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(512, 860, 260, 0, Math.PI * 2);
      ctx.fill();

      // Coiled Blade / Monarch Claymore
      ctx.save();
      ctx.translate(512, 750);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.bezierCurveTo(-25, 120, 25, 80, -15, 40);
      ctx.bezierCurveTo(20, 0, -20, -40, 10, -80);
      ctx.lineTo(0, -160);
      ctx.stroke();

      // Crossguard
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-65, 150);
      ctx.lineTo(65, 150);
      ctx.stroke();

      // Hilt & Pommel
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(0, 210);
      ctx.stroke();
      ctx.fillStyle = activeTheme.borderInner;
      ctx.beginPath();
      ctx.arc(0, 215, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Knight / Hunter Silhouette
      ctx.fillStyle = '#080a14';
      ctx.beginPath();
      ctx.arc(360, 780, 38, 0, Math.PI * 2);
      ctx.fill();
      // Glowing visor slit
      ctx.fillStyle = activeTheme.titleColor;
      ctx.shadowColor = activeTheme.borderInner;
      ctx.shadowBlur = 15;
      ctx.fillRect(362, 778, 22, 4);
      ctx.shadowBlur = 0;

      // Cloak
      ctx.fillStyle = '#0b0d1a';
      ctx.beginPath();
      ctx.moveTo(330, 810);
      ctx.lineTo(400, 810);
      ctx.lineTo(430, 940);
      ctx.lineTo(310, 940);
      ctx.closePath();
      ctx.fill();

      // Drifting painted motes in artwork
      for (let i = 0; i < 40; i++) {
        const ex = 380 + Math.random() * 260;
        const ey = 580 + Math.random() * 340;
        const er = 1.5 + Math.random() * 3.5;
        ctx.fillStyle = i % 2 === 0 ? activeTheme.borderInner : activeTheme.accentText;
        ctx.shadowColor = activeTheme.borderInner;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      // Frame around central art
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(90, 240, 844, 820);

      // 5. Attributes & Deck Plate
      const cardRank = shadow ? (shadow.rank || 'S') : (user?.hunterRank || 'S');
      const cardLevel = shadow ? (shadow.level || 42) : (user?.level || 42);

      ctx.fillStyle = 'rgba(9, 12, 22, 0.94)';
      ctx.fillRect(90, 1080, 844, 380);
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(90, 1080, 844, 380);

      // Identity Header
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 32px Rajdhani, sans-serif';
      ctx.textAlign = 'left';
      const entityLabel = shadow ? 'SHADOW SOLDIER' : 'HUNTER';
      const entityName = shadow ? shadow.name.toUpperCase() : (user?.hunterName || 'MONARCH').toUpperCase();
      ctx.fillText(`${entityLabel}: ${entityName}`, 120, 1130);

      ctx.fillStyle = activeTheme.borderInner;
      ctx.font = 'bold 22px Cinzel, serif';
      ctx.textAlign = 'right';
      const entitySub = shadow ? `${shadow.grade} · ${shadow.type}` : (user?.currentTitle || 'Shadow Monarch');
      ctx.fillText(entitySub, 900, 1130);

      // Rank & Level Badges
      ctx.fillStyle = activeTheme.borderInner;
      ctx.font = 'bold 64px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = activeTheme.glowColor;
      ctx.shadowBlur = 16;
      ctx.fillText(`${cardRank}-RANK`, 120, 1220);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Rajdhani, sans-serif';
      ctx.fillText(`LEVEL ${cardLevel}`, 400, 1200);

      ctx.fillStyle = activeTheme.accentText;
      ctx.font = 'bold 28px Rajdhani, sans-serif';
      const metricLabel = shadow 
        ? `⚡ +${shadow.powerBonus} COMBAT POWER` 
        : `🔥 ${user?.streakDays || 14} DAY STREAK`;
      ctx.fillText(metricLabel, 400, 1240);

      // Progress / Combat Power Gauge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(120, 1280, 784, 28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 1280, 784, 28);

      const xpGrad = ctx.createLinearGradient(120, 1280, 904, 1280);
      xpGrad.addColorStop(0, activeTheme.borderInner);
      xpGrad.addColorStop(1, activeTheme.accentText);
      ctx.fillStyle = xpGrad;
      const barFill = shadow 
        ? Math.min(780, Math.max(20, (shadow.powerBonus / 2000) * 780))
        : Math.max(8, 780 * Math.min(1, Math.max(0, (user?.xp || 2850) / (user?.xpNext || 3500))));
      ctx.fillRect(122, 1282, barFill, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const gaugeText = shadow 
        ? `COMBAT POWER: +${shadow.powerBonus} CP  ·  BUFF: ${shadow.isUnlocked !== false ? 'ACTIVE' : 'LOCKED'}`
        : `XP: ${(user?.xp || 2850).toLocaleString()} / ${(user?.xpNext || 3500).toLocaleString()}`;
      ctx.fillText(gaugeText, 512, 1300);

      // Bottom Attribute Strip: INT, STR, AGI, VIT, SEN
      const sInt = shadow ? (shadow.stats?.intelligence ?? 50) : (user?.stats.intelligence ?? 48);
      const sStr = shadow ? (shadow.stats?.strength ?? 50) : (user?.stats.strength ?? 35);
      const sAgi = shadow ? (shadow.stats?.agility ?? 50) : (user?.stats.agility ?? 40);
      const sVit = shadow ? (shadow.stats?.vitality ?? 50) : (user?.stats.vitality ?? 32);
      const sSen = shadow ? (shadow.stats?.sense ?? 50) : (user?.stats.sense ?? 38);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 20px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`INT: ${sInt}  ·  STR: ${sStr}  ·  AGI: ${sAgi}  ·  VIT: ${sVit}  ·  SEN: ${sSen}`, 512, 1375);

      // Custom Motto / Lore Banner
      const mottoText = shadow 
        ? `"${shadow.motto || shadow.perkDescription}"` 
        : `"${user?.customMotto || 'Only those who endure the darkness may ignite the flame.'}"`;
      ctx.fillStyle = activeTheme.titleColor;
      ctx.font = 'italic 18px Cinzel, serif';
      ctx.fillText(mottoText, 512, 1420);

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      return texture;
    };

    // Build Back Card Canvas Texture (Codex & Runic Seal)
    const createBackTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1536;
      const ctx = canvas.getContext('2d')!;

      // Background
      const bg = ctx.createRadialGradient(512, 768, 50, 512, 768, 900);
      bg.addColorStop(0, activeTheme.bgGradStart);
      bg.addColorStop(0.6, activeTheme.bgGradMid);
      bg.addColorStop(1, '#020306');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1024, 1536);

      // Border
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, 944, 1456);

      ctx.strokeStyle = activeTheme.borderInner;
      ctx.lineWidth = 4;
      ctx.strokeRect(58, 58, 908, 1420);

      // Center Sigil
      ctx.save();
      ctx.translate(512, 510);

      // Solar Corona Rays
      for (let r = 0; r < 24; r++) {
        const ang = (r / 24) * Math.PI * 2;
        const len = 220 + Math.sin(r * 3) * 50;
        ctx.strokeStyle = activeTheme.glowColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx.stroke();
      }

      // Outer Ring
      ctx.shadowColor = activeTheme.sigilColor;
      ctx.shadowBlur = 40;
      ctx.strokeStyle = activeTheme.borderInner;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.stroke();

      // Eclipse Void Center
      ctx.fillStyle = '#030308';
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.fill();

      // Inner Monogram
      ctx.shadowBlur = 20;
      ctx.shadowColor = activeTheme.borderInner;
      ctx.fillStyle = activeTheme.titleColor;
      ctx.font = 'bold 90px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SB', 0, 0);
      ctx.restore();

      // Back Header
      ctx.fillStyle = activeTheme.titleColor;
      ctx.font = 'bold 44px Cinzel, serif';
      ctx.textAlign = 'center';
      const backHead = shadow ? shadow.name.toUpperCase() : 'STUDYBUDDY: LEVEL UP';
      ctx.fillText(backHead, 512, 160);

      ctx.fillStyle = activeTheme.accentText;
      ctx.font = 'bold 22px Rajdhani, sans-serif';
      const backSub = shadow ? `${shadow.grade.toUpperCase()} · ${shadow.type.toUpperCase()}` : `${activeTheme.sigilText}`;
      ctx.fillText(backSub, 512, 205);

      // Codex Attributes Panel
      ctx.fillStyle = 'rgba(12, 17, 30, 0.88)';
      ctx.fillRect(100, 800, 824, 560);
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 800, 824, 560);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      const panelTitle = shadow ? 'SHADOW SOLDIER ATTRIBUTES & CODEX' : 'CORE SYSTEM ATTRIBUTES & CAPACITY';
      ctx.fillText(panelTitle, 512, 845);

      const stats = shadow ? [
        { name: 'INTELLIGENCE (INT)', val: shadow.stats?.intelligence ?? 50, desc: 'Concept Mastery & Complex Logic' },
        { name: 'STRENGTH (STR)', val: shadow.stats?.strength ?? 50, desc: 'Combat Might & Focus Willpower' },
        { name: 'AGILITY (AGI)', val: shadow.stats?.agility ?? 50, desc: 'Problem Solving Speed & Reflex' },
        { name: 'VITALITY (VIT)', val: shadow.stats?.vitality ?? 50, desc: 'Study Endurance & Mental Stamina' },
        { name: 'SENSE (SEN)', val: shadow.stats?.sense ?? 50, desc: 'Error Spotting & Intuitive Synthesis' }
      ] : [
        { name: 'INTELLIGENCE (INT)', val: user?.stats.intelligence || 48, desc: 'Deep Concept Mastery & Complex Logic' },
        { name: 'STRENGTH (STR)', val: user?.stats.strength || 35, desc: 'Study Grit, Willpower & Focus' },
        { name: 'AGILITY (AGI)', val: user?.stats.agility || 40, desc: 'Problem Solving Speed & Reflex' },
        { name: 'VITALITY (VIT)', val: user?.stats.vitality || 32, desc: 'Study Endurance & Mental Stamina' },
        { name: 'SENSE (SEN)', val: user?.stats.sense || 38, desc: 'Error Spotting & Intuitive Synthesis' }
      ];

      stats.forEach((s, idx) => {
        const y = 890 + idx * 62;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 20px Rajdhani, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, 140, y);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px Plus Jakarta Sans, sans-serif';
        ctx.fillText(s.desc, 140, y + 20);

        ctx.fillStyle = activeTheme.borderInner;
        ctx.font = 'bold 26px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${s.val}`, 880, y + 10);
      });

      // Special Ability & Perk summary at bottom of codex panel
      if (shadow) {
        ctx.fillStyle = 'rgba(6, 10, 20, 0.7)';
        ctx.fillRect(120, 1205, 784, 130);
        ctx.strokeStyle = activeTheme.borderInner;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(120, 1205, 784, 130);

        ctx.fillStyle = activeTheme.titleColor;
        ctx.font = 'bold 18px Rajdhani, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ SPECIAL SKILL: ${shadow.abilityName || 'Shadow Vanguard'}`, 140, 1235);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`${shadow.abilityDescription || shadow.perkDescription}`, 140, 1262);

        ctx.fillStyle = activeTheme.accentText;
        ctx.font = 'italic 13px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`Origin: Extracted from ${shadow.extractedFrom}`, 140, 1295);
      }

      // Bottom Watermark & Verification Seal
      ctx.fillStyle = activeTheme.titleColor;
      ctx.font = 'italic 20px Cinzel, serif';
      ctx.textAlign = 'center';
      const sealText = shadow 
        ? `"Verified Shadow Army Codex · ${shadow.grade}"` 
        : `"Verified Monarch License · Level ${user?.level || 1}"`;
      ctx.fillText(sealText, 512, 1430);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      return texture;
    };

    try {
      const width = container.clientWidth || 380;
      const height = container.clientHeight || 560;

      // 1. Scene & Camera Setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0, interactionRef.current.cameraDistance);

      // 2. WebGL Renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);

      // 3. Dynamic Lighting with theme colors
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
      keyLight.position.set(5, 8, 12);
      scene.add(keyLight);

      const themePointLight = new THREE.PointLight(activeTheme.lightEmberColor, 4.0, 25);
      themePointLight.position.set(0, -3, 6);
      scene.add(themePointLight);

      const themeRimLight = new THREE.PointLight(activeTheme.lightBlueColor, 3.0, 30);
      themeRimLight.position.set(-8, 8, -4);
      scene.add(themeRimLight);

      // 4. Create Card 3D Geometry
      cardGroup = new THREE.Group();
      scene.add(cardGroup);

      const frontTexture = createFrontTexture();
      const backTexture = createBackTexture();

      const cardW = 7.0;
      const cardH = 10.5;
      const cardD = 0.08;

      // Front Face
      const frontGeo = new THREE.PlaneGeometry(cardW, cardH, 32, 32);
      const frontMaterial = new THREE.MeshStandardMaterial({
        map: frontTexture,
        roughness: 0.18,
        metalness: 0.82,
        bumpScale: 0.03
      });
      const frontMesh = new THREE.Mesh(frontGeo, frontMaterial);
      frontMesh.position.z = cardD / 2 + 0.002;
      cardGroup.add(frontMesh);

      // Back Face
      const backGeo = new THREE.PlaneGeometry(cardW, cardH, 32, 32);
      const backMaterial = new THREE.MeshStandardMaterial({
        map: backTexture,
        roughness: 0.22,
        metalness: 0.78
      });
      const backMesh = new THREE.Mesh(backGeo, backMaterial);
      backMesh.rotation.y = Math.PI;
      backMesh.position.z = -cardD / 2 - 0.002;
      cardGroup.add(backMesh);

      // Card Edges
      const rimGeo = new THREE.BoxGeometry(cardW, cardH, cardD);
      const rimMat = new THREE.MeshStandardMaterial({
        color: activeTheme.borderColor === '#a855f7' ? 0xa855f7 : 0xd4af37,
        roughness: 0.2,
        metalness: 0.95
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      cardGroup.add(rimMesh);

      // 5. 3D Drifting Ambient Particles (Adaptive to theme)
      const emberCount = prefersReducedMotion ? 40 : 120;
      const emberPositions = new Float32Array(emberCount * 3);
      const emberVelocities = new Float32Array(emberCount * 3);
      const emberColors = new Float32Array(emberCount * 3);

      const colA = new THREE.Color(activeTheme.particleColors[0]);
      const colB = new THREE.Color(activeTheme.particleColors[1]);
      const colC = new THREE.Color(activeTheme.particleColors[2]);

      for (let i = 0; i < emberCount; i++) {
        const i3 = i * 3;
        emberPositions[i3] = (Math.random() - 0.5) * 12;
        emberPositions[i3 + 1] = (Math.random() - 0.5) * 14 - 2;
        emberPositions[i3 + 2] = (Math.random() - 0.5) * 6;

        emberVelocities[i3] = (Math.random() - 0.5) * 0.015;
        emberVelocities[i3 + 1] = 0.02 + Math.random() * 0.035;
        emberVelocities[i3 + 2] = (Math.random() - 0.5) * 0.015;

        const choice = Math.random();
        const col = choice < 0.45 ? colA : choice < 0.8 ? colB : colC;
        emberColors[i3] = col.r;
        emberColors[i3 + 1] = col.g;
        emberColors[i3 + 2] = col.b;
      }

      const emberGeo = new THREE.BufferGeometry();
      emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
      emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));

      // Particle sprite canvas texture
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 32;
      pCanvas.height = 32;
      const pCtx = pCanvas.getContext('2d')!;
      const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      pGrad.addColorStop(0.3, activeTheme.titleColor);
      pGrad.addColorStop(0.7, activeTheme.particleAlpha);
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 32, 32);
      const pTexture = new THREE.CanvasTexture(pCanvas);

      const emberMat = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        map: pTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      embersMesh = new THREE.Points(emberGeo, emberMat);
      scene.add(embersMesh);

      // 6. Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        const ir = interactionRef.current;

        // Smooth Camera Distance Zoom interpolation
        camera!.position.z += (ir.cameraDistance - camera!.position.z) * 0.08;

        // Idle floating
        const timeSinceInteract = Date.now() - ir.lastInteraction;
        let floatOffsetPitch = 0;
        let floatOffsetYaw = 0;
        let floatPosY = 0;

        if (ir.autoFloat && !ir.isPointerDown && timeSinceInteract > 2000 && !prefersReducedMotion) {
          floatOffsetPitch = Math.sin(elapsedTime * 1.5) * 0.06;
          floatOffsetYaw = Math.cos(elapsedTime * 1.0) * 0.08;
          floatPosY = Math.sin(elapsedTime * 2.0) * 0.12;
        }

        // Interpolate rotation
        ir.currentRotX += (ir.targetRotX + floatOffsetPitch - ir.currentRotX) * 0.1;
        ir.currentRotY += (ir.targetRotY + floatOffsetYaw - ir.currentRotY) * 0.1;

        // Flip progress interpolation
        ir.flipProgress += (ir.targetFlipProgress - ir.flipProgress) * 0.09;
        const flipAngle = ir.flipProgress * Math.PI;

        if (cardGroup) {
          cardGroup.rotation.x = ir.currentRotX;
          cardGroup.rotation.y = ir.currentRotY + flipAngle;
          cardGroup.position.y = floatPosY;

          // Light dynamically tracks orientation
          themePointLight.position.x = Math.sin(elapsedTime * 2) * 3;
          themePointLight.position.y = -3 + Math.cos(elapsedTime * 1.5) * 2;
          keyLight.position.x = 6 + ir.pointerX * 8;
          keyLight.position.y = 8 - ir.pointerY * 8;
        }

        // Update Embers
        if (embersMesh && embersMesh.geometry) {
          embersMesh.visible = ir.showEmbers;
          if (ir.showEmbers && !prefersReducedMotion) {
            const posAttr = embersMesh.geometry.attributes.position as THREE.BufferAttribute;
            const posArray = posAttr.array as Float32Array;

            for (let i = 0; i < emberCount; i++) {
              const i3 = i * 3;
              posArray[i3] += emberVelocities[i3] + Math.sin(elapsedTime + i) * 0.005;
              posArray[i3 + 1] += emberVelocities[i3 + 1];
              posArray[i3 + 2] += emberVelocities[i3 + 2];

              if (posArray[i3 + 1] > 8) {
                posArray[i3 + 1] = -7;
                posArray[i3] = (Math.random() - 0.5) * 10;
                posArray[i3 + 2] = (Math.random() - 0.5) * 5;
              }
            }
            posAttr.needsUpdate = true;
          }
        }

        renderer?.render(scene!, camera!);
      };

      animate();

      // 7. Resize Observer
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 380;
        const h = container.clientHeight || 560;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
        frontTexture.dispose();
        backTexture.dispose();
        pTexture.dispose();
      };
    } catch (err) {
      console.error('Three.js Holo Card initialization error:', err);
    }
  }, [variant, activeTheme, user?.hunterName, user?.currentTitle, user?.hunterRank, user?.level, user?.xp, user?.streakDays, user?.stats, user?.customMotto, user?.cardTheme]);

  // Pointer & Touch Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const container = mountRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const ir = interactionRef.current;
    ir.pointerX = x;
    ir.pointerY = y;
    ir.lastInteraction = Date.now();

    if (ir.isPointerDown) {
      const deltaX = e.clientX - ir.dragStartX;
      const deltaY = e.clientY - ir.dragStartY;
      ir.targetRotY += deltaX * 0.012;
      ir.targetRotX += deltaY * 0.012;
      ir.dragStartX = e.clientX;
      ir.dragStartY = e.clientY;
    } else {
      ir.targetRotX = -y * 0.38;
      ir.targetRotY = x * 0.42;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const ir = interactionRef.current;
    ir.isPointerDown = true;
    ir.dragStartX = e.clientX;
    ir.dragStartY = e.clientY;
    setIsDragging(true);
    ir.lastInteraction = Date.now();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ir = interactionRef.current;
    ir.isPointerDown = false;
    setIsDragging(false);
    ir.lastInteraction = Date.now();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handlePointerLeave = () => {
    const ir = interactionRef.current;
    if (!ir.isPointerDown) {
      ir.targetRotX = 0;
      ir.targetRotY = 0;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleZoom(e.deltaY * 0.015);
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Shader Frame Container for ThreeUI Holographic Card */}
      <div 
        className={`shader-frame relative w-full max-w-[380px] h-[520px] sm:h-[560px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0e1322] via-[#090c16] to-[#04050a] border ${activeTheme.frameBorderClass} ${activeTheme.frameGlowClass} group cursor-grab active:cursor-grabbing touch-none transition-all duration-300`}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        onDoubleClick={handleToggleFlip}
      >
        {/* Glow halo in background */}
        <div className="absolute inset-0 bg-radial from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        {/* WebGL Canvas mount point */}
        <div ref={mountRef} className="w-full h-full" />

        {/* Interactive Indicator Pills on Card Top */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono-tech text-slate-200 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{activeTheme.badge}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-[10px] font-mono-tech text-purple-300">
              {isFlipped ? 'BACK: CODEX' : 'FRONT: PLATE'}
            </span>
          </div>
        </div>

        {/* Draggable Hint on Hover */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono-tech text-slate-400 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
            {isDragging ? 'Orbiting 🪐' : 'Drag to Rotate · Double-click to Flip'}
          </span>
          <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline">
            Zoom {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Tactile Control Buttons Strip */}
      {showControls && (
        <div className="mt-3 w-full max-w-[380px] flex items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
          <button
            onClick={handleToggleFlip}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-heading font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Flip between Front and Back face"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFlipped ? 'rotate-180' : ''} transition-transform`} />
            Flip
          </button>

          <button
            onClick={() => setShowEmbers(!showEmbers)}
            className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border text-xs font-mono-tech font-bold transition-all cursor-pointer ${
              showEmbers 
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="Toggle Drifting Particles"
          >
            <Flame className="w-3.5 h-3.5" />
            Motes
          </button>

          {onOpenCustomizer && !shadow && (
            <button
              onClick={() => {
                soundManager.playSfx('click');
                onOpenCustomizer();
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Customize Card Identity & Theme"
            >
              <Palette className="w-3.5 h-3.5" />
              Theme
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(-2)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(2)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Reset Tilt & Rotation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playSfx('click');
              setShowInfoModal(true);
            }}
            className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs transition-colors cursor-pointer"
            title="Inspect ThreeUI Architecture Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Architecture & Source Access Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-heading font-bold text-lg text-slate-100">ThreeUI Holo Card Integration</h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-cyan-400 font-mono-tech mb-1">PACKAGE AUDIT STATUS:</div>
                <p>
                  Installed: <code className="text-amber-300 font-mono">@designcodeio/threeui (v1.2.0, MIT)</code>.
                  The public package is the ThreeUI Community edition comprising open-source WebGL components.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30">
                <div className="font-bold text-purple-300 font-mono-tech mb-1">PRO COMPONENT ACCESS:</div>
                <p>
                  The official <code className="text-purple-200 font-mono">DarkSoulsHoloCard</code> template is a ThreeUI Pro component.
                  Entitled members download it directly using the official CLI:
                </p>
                <code className="block mt-1.5 p-2 rounded bg-black/60 text-amber-300 font-mono text-[11px] select-all">
                  npx @designcodeio/threeui-cli add dark-souls-holo-card
                </code>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="font-bold text-emerald-400 font-mono-tech mb-1">ACTIVE THEME: {activeTheme.badge}</div>
                <p>
                  Customizable holographic foil shader with 5 elemental themes, pointer tilt, dual-face codex, sound effects, and drifting ambient particles.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
