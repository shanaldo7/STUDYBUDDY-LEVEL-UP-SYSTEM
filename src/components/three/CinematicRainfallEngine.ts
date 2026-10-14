import * as THREE from 'three';
import { RoadLightSource } from './WetRoadShader';

export type WeatherState = 'light' | 'moderate' | 'heavy' | 'storm';

export interface WeatherConfig {
  density: number;
  fallSpeed: number;
  windBase: number;
  windGust: number;
  splashRate: number;
  rippleFactor: number;
  fogDensity: number;
  streakOpacity: number;
}

export const WEATHER_PRESETS: Record<WeatherState, WeatherConfig> = {
  light: {
    density: 0.4,
    fallSpeed: 0.8,
    windBase: 1.2,
    windGust: 0.6,
    splashRate: 0.35,
    rippleFactor: 0.45,
    fogDensity: 0.012,
    streakOpacity: 0.55
  },
  moderate: {
    density: 1.0,
    fallSpeed: 1.0,
    windBase: 3.2,
    windGust: 1.6,
    splashRate: 1.0,
    rippleFactor: 1.0,
    fogDensity: 0.016,
    streakOpacity: 0.75
  },
  heavy: {
    density: 1.75,
    fallSpeed: 1.35,
    windBase: 6.0,
    windGust: 3.4,
    splashRate: 1.8,
    rippleFactor: 1.85,
    fogDensity: 0.022,
    streakOpacity: 0.9
  },
  storm: {
    density: 2.5,
    fallSpeed: 1.6,
    windBase: 9.5,
    windGust: 5.5,
    splashRate: 2.6,
    rippleFactor: 2.8,
    fogDensity: 0.029,
    streakOpacity: 0.98
  }
};

/**
 * AAA Cinematic Rainfall Engine
 * Manages 3 depth layers (Foreground streaks, Midground volume with lighting response,
 * Background fine curtain), Pooled surface impact splashes, and Wind physics.
 */
export class CinematicRainfallEngine {
  private scene: THREE.Scene;
  private weather: WeatherState = 'moderate';
  private quality: 'low' | 'medium' | 'high' = 'high';

  // Group containing all rain meshes
  public group: THREE.Group = new THREE.Group();

  // Layer A: Foreground Streaks (LineSegments)
  private fgLines!: THREE.LineSegments;
  private fgCount = 450;
  private fgPosArray!: Float32Array;
  private fgColArray!: Float32Array;
  private fgVelocities!: Float32Array;
  private fgLengths!: Float32Array;

  // Layer B: Midground Volume Rain with Streetlight illumination
  private mgPoints!: THREE.Points;
  private mgCount = 3200;
  private mgPosArray!: Float32Array;
  private mgColArray!: Float32Array;
  private mgVelocities!: Float32Array;
  private mgBaseColArray!: Float32Array;

  // Layer C: Background Fine Rain
  private bgPoints!: THREE.Points;
  private bgCount = 2000;
  private bgPosArray!: Float32Array;
  private bgVelocities!: Float32Array;

  // Surface Impact Splashes (Pooled Particle System)
  private splashPoints!: THREE.Points;
  private splashCount = 450;
  private splashPosArray!: Float32Array;
  private splashColArray!: Float32Array;
  private splashVels!: Float32Array; // vx, vy, vz
  private splashLifetimes!: Float32Array; // current age, max age

  // Wind state
  public currentWind = new THREE.Vector3(3.2, 0, 0.4);
  public windAngle = 0;

  constructor(scene: THREE.Scene, initialWeather: WeatherState = 'moderate', quality: 'low' | 'medium' | 'high' = 'high') {
    this.scene = scene;
    this.weather = initialWeather;
    this.quality = quality;

    this.adjustCountsForQuality();
    this.initLayerA();
    this.initLayerB();
    this.initLayerC();
    this.initSplashSystem();

    this.scene.add(this.group);
  }

  private adjustCountsForQuality() {
    if (this.quality === 'low') {
      this.fgCount = 120;
      this.mgCount = 1000;
      this.bgCount = 600;
      this.splashCount = 120;
    } else if (this.quality === 'medium') {
      this.fgCount = 260;
      this.mgCount = 2200;
      this.bgCount = 1400;
      this.splashCount = 280;
    } else {
      this.fgCount = 480;
      this.mgCount = 3800;
      this.bgCount = 2400;
      this.splashCount = 500;
    }
  }

  /**
   * Layer A: Foreground individual streaks using LineSegments
   * High-detail motion-blurred streaks that sweep near camera with realistic tilt
   */
  private initLayerA() {
    const geo = new THREE.BufferGeometry();
    // 2 vertices per line streak = 6 floats per drop
    this.fgPosArray = new Float32Array(this.fgCount * 6);
    this.fgColArray = new Float32Array(this.fgCount * 6);
    this.fgVelocities = new Float32Array(this.fgCount);
    this.fgLengths = new Float32Array(this.fgCount);

    for (let i = 0; i < this.fgCount; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = Math.random() * 16 + 0.5;
      const z = Math.random() * 32 - 4;
      const len = Math.random() * 0.45 + 0.35;
      const vel = Math.random() * 25 + 75; // 75 to 100 m/s fall speed

      this.fgLengths[i] = len;
      this.fgVelocities[i] = vel;

      // Vertex 0: Leading drop head (bright cyan-white)
      const i6 = i * 6;
      this.fgPosArray[i6] = x;
      this.fgPosArray[i6 + 1] = y;
      this.fgPosArray[i6 + 2] = z;

      this.fgColArray[i6] = 0.88;
      this.fgColArray[i6 + 1] = 0.95;
      this.fgColArray[i6 + 2] = 1.0;

      // Vertex 1: Trailing streak tail (faded)
      this.fgPosArray[i6 + 3] = x - 0.08;
      this.fgPosArray[i6 + 4] = y + len;
      this.fgPosArray[i6 + 5] = z;

      this.fgColArray[i6 + 3] = 0.35;
      this.fgColArray[i6 + 4] = 0.55;
      this.fgColArray[i6 + 5] = 0.85;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.fgPosArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.fgColArray, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fgLines = new THREE.LineSegments(geo, mat);
    this.group.add(this.fgLines);
  }

  /**
   * Layer B: Midground Volume Rain with Streetlight Illumination
   */
  private initLayerB() {
    const geo = new THREE.BufferGeometry();
    this.mgPosArray = new Float32Array(this.mgCount * 3);
    this.mgColArray = new Float32Array(this.mgCount * 3);
    this.mgBaseColArray = new Float32Array(this.mgCount * 3);
    this.mgVelocities = new Float32Array(this.mgCount);

    for (let i = 0; i < this.mgCount; i++) {
      const x = (Math.random() - 0.5) * 44;
      const y = Math.random() * 26 + 0.5;
      const z = Math.random() * 95 - 15;
      const vel = Math.random() * 20 + 60; // 60-80 m/s

      this.mgVelocities[i] = vel;

      const i3 = i * 3;
      this.mgPosArray[i3] = x;
      this.mgPosArray[i3 + 1] = y;
      this.mgPosArray[i3 + 2] = z;

      // Base night rain color (cool slate blue)
      const baseR = 0.55 + Math.random() * 0.15;
      const baseG = 0.72 + Math.random() * 0.15;
      const baseB = 0.95;

      this.mgBaseColArray[i3] = baseR;
      this.mgBaseColArray[i3 + 1] = baseG;
      this.mgBaseColArray[i3 + 2] = baseB;

      this.mgColArray[i3] = baseR;
      this.mgColArray[i3 + 1] = baseG;
      this.mgColArray[i3 + 2] = baseB;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.mgPosArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.mgColArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mgPoints = new THREE.Points(geo, mat);
    this.group.add(this.mgPoints);
  }

  /**
   * Layer C: Background Fine Rain
   */
  private initLayerC() {
    const geo = new THREE.BufferGeometry();
    this.bgPosArray = new Float32Array(this.bgCount * 3);
    this.bgVelocities = new Float32Array(this.bgCount);

    for (let i = 0; i < this.bgCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 32 + 0.5;
      const z = Math.random() * 160 + 20;

      const i3 = i * 3;
      this.bgPosArray[i3] = x;
      this.bgPosArray[i3 + 1] = y;
      this.bgPosArray[i3 + 2] = z;
      this.bgVelocities[i] = Math.random() * 18 + 50;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.bgPosArray, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 0.065,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bgPoints = new THREE.Points(geo, mat);
    this.group.add(this.bgPoints);
  }

  /**
   * Realistic Surface Impact Splashes: Tiny arc droplets springing upwards
   */
  private initSplashSystem() {
    const geo = new THREE.BufferGeometry();
    this.splashPosArray = new Float32Array(this.splashCount * 3);
    this.splashColArray = new Float32Array(this.splashCount * 3);
    this.splashVels = new Float32Array(this.splashCount * 3);
    this.splashLifetimes = new Float32Array(this.splashCount * 2); // age, maxAge

    for (let i = 0; i < this.splashCount; i++) {
      const i3 = i * 3;
      // Start below ground inactive
      this.splashPosArray[i3] = 0;
      this.splashPosArray[i3 + 1] = -10;
      this.splashPosArray[i3 + 2] = 0;

      this.splashColArray[i3] = 0.5;
      this.splashColArray[i3 + 1] = 0.85;
      this.splashColArray[i3 + 2] = 1.0;

      this.splashVels[i3] = 0;
      this.splashVels[i3 + 1] = 0;
      this.splashVels[i3 + 2] = 0;

      this.splashLifetimes[i * 2] = 1.0; // expired
      this.splashLifetimes[i * 2 + 1] = 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.splashPosArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.splashColArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.splashPoints = new THREE.Points(geo, mat);
    this.group.add(this.splashPoints);
  }

  /**
   * Spawns an impact splash at a given ground contact coordinate
   */
  public triggerSplash(x: number, y: number, z: number, color: THREE.Color | null = null) {
    // Find an expired splash particle in pool
    for (let i = 0; i < this.splashCount; i++) {
      if (this.splashLifetimes[i * 2] >= this.splashLifetimes[i * 2 + 1]) {
        const i3 = i * 3;
        this.splashPosArray[i3] = x;
        this.splashPosArray[i3 + 1] = y + 0.02;
        this.splashPosArray[i3 + 2] = z;

        // Upward bounce with radial dispersion
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.7 + 0.3;
        this.splashVels[i3] = Math.cos(angle) * speed;
        this.splashVels[i3 + 1] = Math.random() * 1.8 + 1.2; // upward velocity
        this.splashVels[i3 + 2] = Math.sin(angle) * speed;

        this.splashLifetimes[i * 2] = 0.0;
        this.splashLifetimes[i * 2 + 1] = Math.random() * 0.12 + 0.14; // 0.14-0.26s

        if (color) {
          this.splashColArray[i3] = color.r;
          this.splashColArray[i3 + 1] = color.g;
          this.splashColArray[i3 + 2] = color.b;
        } else {
          this.splashColArray[i3] = 0.55;
          this.splashColArray[i3 + 1] = 0.85;
          this.splashColArray[i3 + 2] = 1.0;
        }
        break;
      }
    }
  }

  /**
   * Main per-frame update loop
   */
  public update(
    delta: number,
    elapsedTime: number,
    camZ: number,
    lights: RoadLightSource[]
  ) {
    const config = WEATHER_PRESETS[this.weather];
    const dt = Math.min(delta, 0.05);

    // 1. Dynamic Wind Vector with Gust Oscillations
    const gust = Math.sin(elapsedTime * 0.85) * config.windGust + Math.cos(elapsedTime * 1.9) * 0.35 * config.windGust;
    const currentWindX = config.windBase + gust;
    const currentWindZ = Math.sin(elapsedTime * 0.5) * 0.4;
    this.currentWind.set(currentWindX, 0, currentWindZ);

    // Calculate perspective tilt offsets
    const tiltRatioX = (currentWindX / 70.0) * 0.35;
    const tiltRatioZ = (currentWindZ / 70.0) * 0.35;

    // 2. Update Layer A: Foreground Streaks
    const fgPosAttr = this.fgLines.geometry.attributes.position as THREE.BufferAttribute;
    const fgPos = fgPosAttr.array as Float32Array;

    const fgFallStep = dt * config.fallSpeed;
    const activeFgCount = Math.floor(this.fgCount * Math.min(1.0, config.density));

    for (let i = 0; i < this.fgCount; i++) {
      const i6 = i * 6;
      if (i > activeFgCount) {
        // Hide inactive particles below ground
        fgPos[i6 + 1] = -50;
        fgPos[i6 + 4] = -50;
        continue;
      }

      const fallDist = this.fgVelocities[i] * fgFallStep;
      fgPos[i6] += currentWindX * dt;
      fgPos[i6 + 1] -= fallDist;
      fgPos[i6 + 2] += currentWindZ * dt;

      const len = this.fgLengths[i];
      // Tail position tilted with velocity
      fgPos[i6 + 3] = fgPos[i6] - tiltRatioX * len;
      fgPos[i6 + 4] = fgPos[i6 + 1] + len;
      fgPos[i6 + 5] = fgPos[i6 + 2] - tiltRatioZ * len;

      const relZ = fgPos[i6 + 2] - camZ;
      // Respawn if below ground or outside camera range
      if (fgPos[i6 + 1] <= 0.05 || relZ < -6 || relZ > 34) {
        if (fgPos[i6 + 1] <= 0.08 && Math.random() < config.splashRate * 0.45) {
          this.triggerSplash(fgPos[i6], 0.05, fgPos[i6 + 2]);
        }
        fgPos[i6] = (Math.random() - 0.5) * 15;
        fgPos[i6 + 1] = Math.random() * 14 + 4;
        fgPos[i6 + 2] = camZ + Math.random() * 30 - 3;
        fgPos[i6 + 3] = fgPos[i6] - tiltRatioX * len;
        fgPos[i6 + 4] = fgPos[i6 + 1] + len;
        fgPos[i6 + 5] = fgPos[i6 + 2] - tiltRatioZ * len;
      }
    }
    fgPosAttr.needsUpdate = true;

    // 3. Update Layer B: Midground Volume Rain + Streetlight Illumination
    const mgPosAttr = this.mgPoints.geometry.attributes.position as THREE.BufferAttribute;
    const mgPos = mgPosAttr.array as Float32Array;
    const mgColAttr = this.mgPoints.geometry.attributes.color as THREE.BufferAttribute;
    const mgCol = mgColAttr.array as Float32Array;

    const mgFallStep = dt * config.fallSpeed;
    const activeMgCount = Math.floor(this.mgCount * Math.min(1.0, config.density));

    // Evaluate up to 8 nearest streetlights for rain drop illumination
    const activeLights = lights.slice(0, 8);

    for (let i = 0; i < this.mgCount; i++) {
      const i3 = i * 3;
      if (i > activeMgCount) {
        mgPos[i3 + 1] = -50;
        continue;
      }

      mgPos[i3] += currentWindX * dt * 0.85;
      mgPos[i3 + 1] -= this.mgVelocities[i] * mgFallStep;
      mgPos[i3 + 2] += currentWindZ * dt;

      const px = mgPos[i3];
      const py = mgPos[i3 + 1];
      const pz = mgPos[i3 + 2];
      const relZ = pz - camZ;

      // Check lighting from nearest streetlamps
      let litR = this.mgBaseColArray[i3];
      let litG = this.mgBaseColArray[i3 + 1];
      let litB = this.mgBaseColArray[i3 + 2];

      for (let l = 0; l < activeLights.length; l++) {
        const light = activeLights[l];
        const dx = px - light.position.x;
        const dy = py - light.position.y;
        const dz = pz - light.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const radSq = light.radius * light.radius;

        if (distSq < radSq) {
          const factor = (1.0 - Math.sqrt(distSq) / light.radius) * (light.intensity * 0.45);
          litR = Math.min(1.0, litR + light.color.r * factor);
          litG = Math.min(1.0, litG + light.color.g * factor);
          litB = Math.min(1.0, litB + light.color.b * factor);
        }
      }

      mgCol[i3] = litR;
      mgCol[i3 + 1] = litG;
      mgCol[i3 + 2] = litB;

      // Recycle outside visible street frustum
      if (py <= 0.05 || relZ < -15 || relZ > 85) {
        if (py <= 0.08 && Math.random() < config.splashRate * 0.3) {
          this.triggerSplash(px, 0.05, pz);
        }
        mgPos[i3] = (Math.random() - 0.5) * 44;
        mgPos[i3 + 1] = Math.random() * 25 + 4;
        mgPos[i3 + 2] = camZ + Math.random() * 85 - 12;
      }
    }
    mgPosAttr.needsUpdate = true;
    mgColAttr.needsUpdate = true;

    // 4. Update Layer C: Background Fine Rain
    const bgPosAttr = this.bgPoints.geometry.attributes.position as THREE.BufferAttribute;
    const bgPos = bgPosAttr.array as Float32Array;
    const bgFallStep = dt * config.fallSpeed;
    const activeBgCount = Math.floor(this.bgCount * Math.min(1.0, config.density));

    for (let i = 0; i < this.bgCount; i++) {
      const i3 = i * 3;
      if (i > activeBgCount) {
        bgPos[i3 + 1] = -50;
        continue;
      }

      bgPos[i3] += currentWindX * dt * 0.65;
      bgPos[i3 + 1] -= this.bgVelocities[i] * bgFallStep;

      const pz = bgPos[i3 + 2];
      const relZ = pz - camZ;

      if (bgPos[i3 + 1] <= 0.05 || relZ < 10 || relZ > 175) {
        bgPos[i3] = (Math.random() - 0.5) * 65;
        bgPos[i3 + 1] = Math.random() * 30 + 5;
        bgPos[i3 + 2] = camZ + Math.random() * 150 + 15;
      }
    }
    bgPosAttr.needsUpdate = true;

    // 5. Update Surface Impact Splashes
    const splashPosAttr = this.splashPoints.geometry.attributes.position as THREE.BufferAttribute;
    const splashPos = splashPosAttr.array as Float32Array;

    for (let i = 0; i < this.splashCount; i++) {
      const ageIdx = i * 2;
      if (this.splashLifetimes[ageIdx] < this.splashLifetimes[ageIdx + 1]) {
        this.splashLifetimes[ageIdx] += dt;
        const i3 = i * 3;

        // Apply upward velocity and gravity
        this.splashVels[i3 + 1] -= 9.8 * dt;
        splashPos[i3] += this.splashVels[i3] * dt;
        splashPos[i3 + 1] += this.splashVels[i3 + 1] * dt;
        splashPos[i3 + 2] += this.splashVels[i3 + 2] * dt;

        // If returned to ground or lifetime over
        if (splashPos[i3 + 1] < 0.02 || this.splashLifetimes[ageIdx] >= this.splashLifetimes[ageIdx + 1]) {
          this.splashLifetimes[ageIdx] = this.splashLifetimes[ageIdx + 1];
          splashPos[i3 + 1] = -10; // Hide
        }
      }
    }
    splashPosAttr.needsUpdate = true;
  }

  public setWeather(newWeather: WeatherState) {
    this.weather = newWeather;
  }

  public getWeather(): WeatherState {
    return this.weather;
  }

  public dispose() {
    this.fgLines.geometry.dispose();
    (this.fgLines.material as THREE.Material).dispose();

    this.mgPoints.geometry.dispose();
    (this.mgPoints.material as THREE.Material).dispose();

    this.bgPoints.geometry.dispose();
    (this.bgPoints.material as THREE.Material).dispose();

    this.splashPoints.geometry.dispose();
    (this.splashPoints.material as THREE.Material).dispose();

    this.scene.remove(this.group);
  }
}
