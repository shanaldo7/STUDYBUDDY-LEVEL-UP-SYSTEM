import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for Photorealistic Rainy Urban Scene
 * Generates high-resolution Diffuse, Roughness, Normal, and Environmental Maps
 * without external asset dependencies or CORS/offline issues.
 */

// 1. High-Detail PBR Asphalt Textures (BaseColor, Roughness, Normal)
export function createRealisticAsphaltPBR(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const size = 1024;

  // BaseColor / Albedo Canvas
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  // Roughness Canvas (Dark = Shiny/Wet, Light = Dry/Rough)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  // Normal Canvas (RGB vector encoding)
  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d')!;

  // A. Dark Wet Asphalt Base
  aCtx.fillStyle = '#0f131d';
  aCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#9e9e9e'; // Default asphalt roughness ~0.62
  rCtx.fillRect(0, 0, size, size);

  nCtx.fillStyle = '#8080ff'; // Flat normal vector (0, 0, 1) -> RGB(128, 128, 255)
  nCtx.fillRect(0, 0, size, size);

  // B. Micro-Gravel & Asphalt Aggregate Noise
  const imgDataAlbedo = aCtx.getImageData(0, 0, size, size);
  const dataA = imgDataAlbedo.data;
  const imgDataRough = rCtx.getImageData(0, 0, size, size);
  const dataR = imgDataRough.data;
  const imgDataNorm = nCtx.getImageData(0, 0, size, size);
  const dataN = imgDataNorm.data;

  for (let i = 0; i < dataA.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    // BaseColor stone variation
    dataA[i] = Math.max(8, Math.min(45, dataA[i] + noise));
    dataA[i + 1] = Math.max(10, Math.min(50, dataA[i + 1] + noise));
    dataA[i + 2] = Math.max(16, Math.min(65, dataA[i + 2] + noise));

    // Normal micro-bump
    const nx = Math.floor(128 + (Math.random() - 0.5) * 20);
    const ny = Math.floor(128 + (Math.random() - 0.5) * 20);
    dataN[i] = nx;
    dataN[i + 1] = ny;
  }
  aCtx.putImageData(imgDataAlbedo, 0, 0);
  rCtx.putImageData(imgDataRough, 0, 0);
  nCtx.putImageData(imgDataNorm, 0, 0);

  // C. Irregular Puddles with Water Meniscus
  // We draw organic puddles across the canvas:
  // In the puddles, roughness drops to near 0.04 (mirror-like wet reflection!)
  const puddleLocations = [
    { x: 260, y: 180, rx: 110, ry: 75, rot: 0.2 },
    { x: 740, y: 320, rx: 140, ry: 90, rot: -0.15 },
    { x: 380, y: 550, rx: 180, ry: 110, rot: 0.1 },
    { x: 820, y: 780, rx: 120, ry: 80, rot: -0.3 },
    { x: 190, y: 880, rx: 130, ry: 70, rot: 0.25 },
    { x: 520, y: 920, rx: 90, ry: 60, rot: 0.05 }
  ];

  puddleLocations.forEach(p => {
    // Albedo: Puddle water is darker due to light absorption
    aCtx.save();
    aCtx.translate(p.x, p.y);
    aCtx.rotate(p.rot);
    const gradA = aCtx.createRadialGradient(0, 0, p.rx * 0.2, 0, 0, p.rx);
    gradA.addColorStop(0, 'rgba(5, 7, 12, 0.95)');
    gradA.addColorStop(0.7, 'rgba(8, 10, 18, 0.6)');
    gradA.addColorStop(1, 'transparent');
    aCtx.fillStyle = gradA;
    aCtx.beginPath();
    aCtx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    aCtx.fill();
    aCtx.restore();

    // Roughness: Mirror finish in the puddle center (~0.05 roughness)
    rCtx.save();
    rCtx.translate(p.x, p.y);
    rCtx.rotate(p.rot);
    const gradR = rCtx.createRadialGradient(0, 0, p.rx * 0.1, 0, 0, p.rx);
    gradR.addColorStop(0, 'rgba(12, 12, 12, 1)'); // Ultra glossy
    gradR.addColorStop(0.75, 'rgba(35, 35, 35, 0.9)');
    gradR.addColorStop(1, 'transparent');
    rCtx.fillStyle = gradR;
    rCtx.beginPath();
    rCtx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();

    // Normal: Flat water surface inside puddle
    nCtx.save();
    nCtx.translate(p.x, p.y);
    nCtx.rotate(p.rot);
    nCtx.fillStyle = 'rgba(128, 128, 255, 0.9)';
    nCtx.beginPath();
    nCtx.ellipse(0, 0, p.rx * 0.85, p.ry * 0.85, 0, 0, Math.PI * 2);
    nCtx.fill();
    nCtx.restore();
  });

  // D. Tire Track Water Sheen (Glossy lanes where vehicle wheels compact the water)
  [280, 420, 600, 740].forEach(trackX => {
    rCtx.save();
    const trackGrad = rCtx.createLinearGradient(trackX - 25, 0, trackX + 25, 0);
    trackGrad.addColorStop(0, 'transparent');
    trackGrad.addColorStop(0.5, 'rgba(38, 38, 38, 0.7)');
    trackGrad.addColorStop(1, 'transparent');
    rCtx.fillStyle = trackGrad;
    rCtx.fillRect(trackX - 25, 0, 50, size);
    rCtx.restore();
  });

  // E. Road Markings: Authentic Worn Paint with Micro-Cracks
  // Center Yellow/Gold Double Stripe
  const drawWornStripe = (x: number, color: string, isDashed: boolean) => {
    aCtx.save();
    aCtx.strokeStyle = color;
    aCtx.lineWidth = 7;
    if (isDashed) {
      aCtx.setLineDash([55, 35]);
    }
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, size);
    aCtx.stroke();

    // Subtle worn paint abrasion
    for (let y = 0; y < size; y += 12) {
      if (Math.random() > 0.4) {
        aCtx.fillStyle = '#0f131d';
        aCtx.fillRect(x - 4, y, Math.random() * 8, Math.random() * 6);
      }
    }
    aCtx.restore();

    // Paint has slightly different roughness
    rCtx.save();
    rCtx.strokeStyle = 'rgba(140, 140, 140, 0.8)';
    rCtx.lineWidth = 7;
    if (isDashed) rCtx.setLineDash([55, 35]);
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x, size);
    rCtx.stroke();
    rCtx.restore();
  };

  // Center lines (Hunter Neon Cyan & Amber Gold)
  drawWornStripe(506, '#00f0ff', true);
  drawWornStripe(518, '#ffaa00', false);

  // Outer Edge White Lines
  drawWornStripe(90, '#d1d5db', false);
  drawWornStripe(934, '#d1d5db', false);

  // F. Asphalt Cracks with Bitumen Sealant
  aCtx.strokeStyle = 'rgba(5, 7, 10, 0.85)';
  aCtx.lineWidth = 2;
  const drawCrack = (startX: number, startY: number, length: number) => {
    aCtx.beginPath();
    let cx = startX;
    let cy = startY;
    aCtx.moveTo(cx, cy);
    for (let step = 0; step < 12; step++) {
      cx += (Math.random() - 0.5) * (length / 6);
      cy += (length / 12) * (Math.random() * 0.5 + 0.7);
      aCtx.lineTo(cx, cy);
    }
    aCtx.stroke();
  };

  drawCrack(320, 100, 140);
  drawCrack(680, 450, 180);
  drawCrack(450, 800, 120);

  // Convert to Three.js CanvasTextures with proper repeating
  const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
  albedoTexture.wrapS = THREE.RepeatWrapping;
  albedoTexture.wrapT = THREE.RepeatWrapping;
  albedoTexture.repeat.set(1, 32);

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;
  roughnessTexture.repeat.set(1, 32);

  const normalTexture = new THREE.CanvasTexture(normCanvas);
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.repeat.set(1, 32);

  return {
    map: albedoTexture,
    roughnessMap: roughnessTexture,
    normalMap: normalTexture
  };
}

// 2. Concrete Pavement & Curb Textures with Mortar Seams & Wet Flags
export function createConcretePavementPBR(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  // Dark wet concrete base
  aCtx.fillStyle = '#1c2233';
  aCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#8a8a8a';
  rCtx.fillRect(0, 0, size, size);

  // Pavement Slab Grid (64x64 tiles)
  const tileSize = 64;
  aCtx.strokeStyle = 'rgba(8, 10, 18, 0.9)';
  aCtx.lineWidth = 3;

  for (let x = 0; x < size; x += tileSize) {
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, size);
    aCtx.stroke();
  }
  for (let y = 0; y < size; y += tileSize) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(size, y);
    aCtx.stroke();
  }

  // Random tile tone variation & wet gloss
  for (let x = 0; x < size; x += tileSize) {
    for (let y = 0; y < size; y += tileSize) {
      if (Math.random() > 0.6) {
        aCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        aCtx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
      if (Math.random() > 0.4) {
        // Wet puddle on tile
        rCtx.fillStyle = 'rgba(25, 25, 25, 0.7)';
        rCtx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
      }
    }
  }

  const map = new THREE.CanvasTexture(aCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 32);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 32);

  return { map, roughnessMap };
}

// 3. Multi-Storey Building Architectural Facade Texture
export function createArchitecturalFacadeTexture(palette: 'neon-violet' | 'cyan-steel' | 'warm-amber'): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep dark structural brick/concrete facade
  ctx.fillStyle = '#0a0d16';
  ctx.fillRect(0, 0, width, height);

  // Architectural cornices / horizontal floor dividing bands
  const floorHeight = 128;
  for (let y = 0; y < height; y += floorHeight) {
    ctx.fillStyle = '#141a29';
    ctx.fillRect(0, y, width, 14);
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, y + 14, width, 4);
  }

  // Windows with realistic frames, mullions, and illuminated curtains/blinds
  const windowWidth = 56;
  const windowHeight = 76;
  const colGap = 85;

  const getWindowLight = () => {
    const isLit = Math.random() > 0.42;
    if (!isLit) return 'rgba(12, 16, 26, 0.95)';
    const rand = Math.random();
    if (palette === 'neon-violet') {
      return rand > 0.5 ? 'rgba(168, 85, 247, 0.85)' : 'rgba(236, 72, 153, 0.75)';
    } else if (palette === 'cyan-steel') {
      return rand > 0.5 ? 'rgba(6, 182, 212, 0.85)' : 'rgba(59, 130, 246, 0.75)';
    } else {
      return rand > 0.4 ? 'rgba(251, 191, 36, 0.9)' : 'rgba(245, 158, 11, 0.75)';
    }
  };

  for (let y = 20; y < height; y += floorHeight) {
    for (let x = 24; x < width - 40; x += colGap) {
      // Recessed stone sill & frame
      ctx.fillStyle = '#121624';
      ctx.fillRect(x - 4, y - 4, windowWidth + 8, windowHeight + 8);

      // Window Glass with Interior Lighting
      ctx.fillStyle = getWindowLight();
      ctx.fillRect(x, y, windowWidth, windowHeight);

      // Window mullions (cross divider)
      ctx.fillStyle = '#0c0f1a';
      ctx.fillRect(x + windowWidth / 2 - 2, y, 4, windowHeight);
      ctx.fillRect(x, y + windowHeight / 2 - 2, windowWidth, 4);

      // Subtle venetian blinds horizontal lines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let by = y + 4; by < y + windowHeight; by += 8) {
        ctx.fillRect(x, by, windowWidth, 1.5);
      }
    }
  }

  // Ground Floor Storefront Displays (bottom 160px)
  ctx.fillStyle = '#080b14';
  ctx.fillRect(0, height - 160, width, 160);

  // Storefront glass windows with warm interior display lighting
  for (let sx = 30; sx < width - 100; sx += 220) {
    ctx.fillStyle = '#111728';
    ctx.fillRect(sx, height - 145, 190, 130);

    // Warm shop interior glow
    const shopGrad = ctx.createLinearGradient(sx, height - 145, sx, height - 15);
    shopGrad.addColorStop(0, 'rgba(255, 214, 150, 0.85)');
    shopGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.4)');
    shopGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
    ctx.fillStyle = shopGrad;
    ctx.fillRect(sx + 6, height - 139, 178, 118);

    // Neon storefront sign header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx + 10, height - 156, 170, 22);
    ctx.fillStyle = palette === 'neon-violet' ? '#c084fc' : '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HUNTER COMMISSARY', sx + 95, height - 140);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

// 4. Photorealistic Storm Drain Grate Texture
export function createStormDrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Iron frame
  ctx.fillStyle = '#1e2433';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#0f131d';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);

  // Deep drainage slots with dark void underneath
  ctx.fillStyle = '#03050a';
  for (let x = 16; x < 240; x += 16) {
    ctx.fillRect(x, 14, 8, 100);
    // Metallic edge bevel highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 7, 14, 1.5, 100);
    ctx.fillStyle = '#03050a';
  }

  return new THREE.CanvasTexture(canvas);
}

// 5. Cast-Iron Manhole Cover Texture with Diamond Grips & City Relief
export function createManholeCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Outer dark asphalt recess
  ctx.fillStyle = '#0f131d';
  ctx.fillRect(0, 0, 256, 256);

  // Cast iron circle
  ctx.fillStyle = '#222938';
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#121624';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Concentric rib rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 90, 0, Math.PI * 2);
  ctx.arc(128, 128, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Diamond knurling radial ticks
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const x1 = 128 + Math.cos(a) * 65;
    const y1 = 128 + Math.sin(a) * 65;
    const x2 = 128 + Math.cos(a) * 85;
    const y2 = 128 + Math.sin(a) * 85;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Center utility text
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HUNTER SYSTEM', 128, 124);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText('DRAINAGE // 2026', 128, 140);

  return new THREE.CanvasTexture(canvas);
}

// 6. Realistic Rainy Night City Environment Map (Equirectangular)
// Allows PBR materials to reflect realistic buildings, neon lights, and wet roads
export function createRainyCityEnvironmentMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dark midnight sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#03050d');
  skyGrad.addColorStop(0.4, '#090d20');
  skyGrad.addColorStop(0.6, '#111835');
  skyGrad.addColorStop(0.7, '#070a16');
  skyGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Distant neon skyscrapers on the horizon line (y = 220 to 360)
  for (let x = 0; x < width; x += 18) {
    const bHeight = Math.random() * 90 + 50;
    const yTop = 320 - bHeight;
    ctx.fillStyle = '#080d1c';
    ctx.fillRect(x, yTop, 16, bHeight);

    // Neon pinnacle lights
    if (Math.random() > 0.4) {
      ctx.fillStyle = Math.random() > 0.5 ? '#a855f7' : '#00f0ff';
      ctx.fillRect(x + 6, yTop - 4, 4, 4);
    }
    // Window clusters
    for (let wy = yTop + 10; wy < 320; wy += 8) {
      if (Math.random() > 0.55) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 215, 120, 0.7)' : 'rgba(100, 200, 255, 0.7)';
        ctx.fillRect(x + 2, wy, 12, 3);
      }
    }
  }

  // Wet ground reflection blur on the lower half (y = 320 to 512)
  const groundGrad = ctx.createLinearGradient(0, 320, 0, height);
  groundGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
  groundGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.25)'); // Cyan road reflection
  groundGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.2)');  // Violet road reflection
  groundGrad.addColorStop(1, '#03050c');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 320, width, height - 320);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}
