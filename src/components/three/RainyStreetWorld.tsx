import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NavTab } from '../Navigation';
import { soundManager } from '../../utils/audio';
import {
  createRealisticAsphaltPBR,
  createConcretePavementPBR,
  createArchitecturalFacadeTexture,
  createRainyCityEnvironmentMap
} from './RainyStreetPBRTextures';
import {
  createAAAWetRoadMaterial,
  updateAAAWetRoadLights,
  RoadLightSource
} from './WetRoadShader';
import {
  createDetailedStreetlight,
  createParkedVehicle,
  createTransitShelter,
  createRoadProps,
  createStreetTree,
  createAwakeningPlazaMonument,
  createKnowledgeSpireEntrance,
  createRiftStation,
  createBossArenaFacade,
  createShadowSanctumFacade,
  createRainPavilion,
  createOracleSanctum,
  createDistantTraffic
} from './RainyStreetModels';
import {
  CinematicRainfallEngine,
  WeatherState,
  WEATHER_PRESETS
} from './CinematicRainfallEngine';
import { CameraLensDroplets } from './CameraLensDroplets';
import { 
  Compass, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Play,
  Pause,
  Sliders,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind
} from 'lucide-react';

export interface StationInfo {
  id: NavTab;
  name: string;
  district: string;
  z: number;
  icon: string;
  badge: string;
  color: string;
  description: string;
}

export const WORLD_STATIONS: StationInfo[] = [
  {
    id: 'dashboard',
    name: 'Hunter Boulevard',
    district: 'DISTRICT 01 // ASHEN PLAZA',
    z: 0,
    icon: '⚔️',
    badge: 'ENTRANCE',
    color: '#a855f7',
    description: 'Awakening Plaza · Holographic Hunter Codex · Daily Quests'
  },
  {
    id: 'syllabus',
    name: 'BCA & Syllabus Citadel',
    district: 'DISTRICT 02 // KNOWLEDGE TOWER',
    z: 48,
    icon: '📜',
    badge: 'CURRICULUM',
    color: '#06b6d4',
    description: 'BCA Course Modules · Unit Completion Rings · Progression Web'
  },
  {
    id: 'dungeon',
    name: 'Dimensional Rift Gates',
    district: 'DISTRICT 03 // GATEWAY SECTOR',
    z: 96,
    icon: '🌀',
    badge: 'BATTLES',
    color: '#3b82f6',
    description: 'E to S Rank Dungeons · Topic Combat Drills · Mana Cores'
  },
  {
    id: 'boss',
    name: "Monarch's Monolith",
    district: 'DISTRICT 04 // DEMON CASTLE',
    z: 144,
    icon: '👑',
    badge: 'BOSS RAIDS',
    color: '#ef4444',
    description: 'Igris & Baran Trials · Shadow Extraction · Monarch Crown'
  },
  {
    id: 'shadows',
    name: 'Shadow Sanctum & Guild Haven',
    district: 'DISTRICT 05 // NECROPOLIS',
    z: 192,
    icon: '👥',
    badge: 'SHADOW ARMY',
    color: '#8b5cf6',
    description: 'Shadow Army Barracks · Guild Study Parties · Squad Deployment'
  },
  {
    id: 'focus',
    name: 'Rain Pavilion & Memory Archive',
    district: 'DISTRICT 06 // STUDY SANCTUARY',
    z: 240,
    icon: '🌧️',
    badge: 'FOCUS & REVISION',
    color: '#10b981',
    description: 'Lo-Fi Rain Chamber · Flashcard Lab · Exam Command Hub'
  },
  {
    id: 'user-guide',
    name: 'The Monarch Archive & Oracle',
    district: 'DISTRICT 07 // SYSTEM SANCTUM',
    z: 288,
    icon: '📖',
    badge: 'SYSTEM GUIDE',
    color: '#f59e0b',
    description: 'In-App Manual (17 Mechanics) · System Guide AI · Settings'
  }
];

export type GraphicsQuality = 'high' | 'medium' | 'low';

interface RainyStreetWorldProps {
  currentTab: NavTab;
  onSelectStation: (tab: NavTab) => void;
  isInspectingWorld: boolean;
  onToggleInspectWorld: () => void;
  children?: React.ReactNode;
}

export const RainyStreetWorld: React.FC<RainyStreetWorldProps> = ({
  currentTab,
  onSelectStation,
  isInspectingWorld,
  onToggleInspectWorld,
  children
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [isAutoCruising, setIsAutoCruising] = useState<boolean>(false);
  const [isRainAudioActive, setIsRainAudioActive] = useState<boolean>(false);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('high');
  const [weatherState, setWeatherState] = useState<WeatherState>('moderate');
  const [lensDropletsEnabled, setLensDropletsEnabled] = useState<boolean>(true);
  const [windDisplay, setWindDisplay] = useState<{ speed: number; direction: string }>({ speed: 3.2, direction: 'ENE' });

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rainfallEngineRef = useRef<CinematicRainfallEngine | null>(null);
  const currentZRef = useRef<number>(0);
  const targetZRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  const totalJourneyZ = WORLD_STATIONS[WORLD_STATIONS.length - 1].z;

  // Sync targetZ when currentTab changes from UI navigation
  useEffect(() => {
    const station = WORLD_STATIONS.find(s => s.id === currentTab);
    if (station) {
      targetZRef.current = station.z;
    }
  }, [currentTab]);

  // Toggle procedural rain ambient sound with intensity sync
  const handleToggleRainAudio = useCallback(() => {
    if (isRainAudioActive) {
      soundManager.stopAmbient();
      setIsRainAudioActive(false);
    } else {
      soundManager.startAmbient('rain', 0.28);
      soundManager.setRainIntensity(weatherState);
      setIsRainAudioActive(true);
    }
  }, [isRainAudioActive, weatherState]);

  // Cycle weather presets (Light -> Moderate -> Heavy -> Storm)
  const handleCycleWeather = () => {
    soundManager.playSfx('click');
    const states: WeatherState[] = ['light', 'moderate', 'heavy', 'storm'];
    const nextIdx = (states.indexOf(weatherState) + 1) % states.length;
    const nextState = states[nextIdx];
    setWeatherState(nextState);
    rainfallEngineRef.current?.setWeather(nextState);
    if (isRainAudioActive) {
      soundManager.setRainIntensity(nextState);
    }
  };

  // Toggle subtle lens water beads
  const handleToggleLensDroplets = () => {
    soundManager.playSfx('click');
    setLensDropletsEnabled(prev => !prev);
  };

  // Cycle graphics quality
  const handleCycleQuality = () => {
    soundManager.playSfx('click');
    setGraphicsQuality(prev => {
      if (prev === 'high') return 'medium';
      if (prev === 'medium') return 'low';
      return 'high';
    });
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Volumetric Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x03050f);
    // Exponential atmospheric distance haze
    scene.fog = new THREE.FogExp2(0x040615, graphicsQuality === 'low' ? 0.018 : 0.012);

    // 2. Camera with Natural Human Eye Height Perspective
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 750);
    cameraRef.current = camera;
    camera.position.set(0, 2.6, 0);

    // 3. Renderer with Physically Correct Color & Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      alpha: false
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(graphicsQuality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Realistic Night Sky & City Equirectangular Environment Map
    const envMap = createRainyCityEnvironmentMap();
    scene.environment = envMap;

    // Ambient cold overcast skylight
    const ambientLight = new THREE.AmbientLight(0x182035, 1.4);
    scene.add(ambientLight);

    // Moon / high-angle cool blue moonlight
    const moonLight = new THREE.DirectionalLight(0x6366f1, 0.9);
    moonLight.position.set(25, 60, -30);
    scene.add(moonLight);

    // 5. Photorealistic Wet Asphalt Road with AAA Dielectric Water Puddles & Dynamic Reflections
    const roadLength = 420;
    const roadWidth = 14;
    const asphaltPBR = createRealisticAsphaltPBR();

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 64, 64);
    const roadMat = createAAAWetRoadMaterial(
      asphaltPBR.map,
      asphaltPBR.roughnessMap,
      asphaltPBR.normalMap,
      envMap
    );
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, roadLength / 2 - 30);
    scene.add(roadMesh);

    // 6. Photorealistic Concrete Sidewalks & Beveled Curbs
    const pavementPBR = createConcretePavementPBR();
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: pavementPBR.map,
      roughnessMap: pavementPBR.roughnessMap,
      roughness: 0.45,
      metalness: 0.15,
      envMapIntensity: 0.8
    });

    const sidewalkGeo = new THREE.BoxGeometry(6, 0.38, roadLength);
    const leftSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftSidewalk.position.set(-10, 0.19, roadLength / 2 - 30);
    scene.add(leftSidewalk);

    const rightSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightSidewalk.position.set(10, 0.19, roadLength / 2 - 30);
    scene.add(rightSidewalk);

    // Glowing Neon Curb Trims (Hunter Cyan & Monarch Purple)
    const curbGeo = new THREE.BoxGeometry(0.25, 0.22, roadLength);
    const curbL = new THREE.Mesh(curbGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    curbL.position.set(-7, 0.32, roadLength / 2 - 30);
    scene.add(curbL);

    const curbR = new THREE.Mesh(curbGeo, new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    curbR.position.set(7, 0.32, roadLength / 2 - 30);
    scene.add(curbR);

    // 7. Urban Road Props: Metal Storm Drains & Cast-Iron Manholes
    const roadProps = createRoadProps();
    scene.add(roadProps);

    // 8. Detailed Streetlights with Gooseneck Posts & Volumetric Rain Cones
    const streetLampGroup = new THREE.Group();
    const dynamicRoadLights: RoadLightSource[] = [];
    const lampSpacing = 24;
    const lampCount = 16;

    for (let i = 0; i < lampCount; i++) {
      const zPos = i * lampSpacing - 12;
      const isLeft = i % 2 === 0;
      const xPos = isLeft ? -7.2 : 7.2;
      const lampColor = isLeft ? 0x00f0ff : 0xffb040; // Cyan or Warm Amber
      const lamp = createDetailedStreetlight(xPos, zPos, isLeft, lampColor);
      streetLampGroup.add(lamp);

      dynamicRoadLights.push({
        position: new THREE.Vector3(xPos, 5.0, zPos),
        color: new THREE.Color(lampColor),
        intensity: 2.5,
        radius: 30.0
      });
    }
    scene.add(streetLampGroup);

    // 9. Parked Vehicles along Curbs
    const vehiclesGroup = new THREE.Group();
    const vehiclePositions = [
      { x: -5.4, z: 18, rot: 0, color: 0x1e293b },
      { x: 5.4, z: 64, rot: Math.PI, color: 0x0f172a },
      { x: -5.4, z: 110, rot: 0, color: 0x334155 },
      { x: 5.4, z: 156, rot: Math.PI, color: 0x1e1b4b },
      { x: -5.4, z: 204, rot: 0, color: 0x0284c7 },
      { x: 5.4, z: 252, rot: Math.PI, color: 0x475569 }
    ];

    vehiclePositions.forEach(v => {
      const car = createParkedVehicle(v.x, v.z, v.rot, v.color);
      vehiclesGroup.add(car);

      dynamicRoadLights.push({
        position: new THREE.Vector3(v.x, 0.7, v.z + (v.rot === 0 ? 2.5 : -2.5)),
        color: new THREE.Color(0xfff5ea),
        intensity: 1.8,
        radius: 16.0
      });
    });
    scene.add(vehiclesGroup);

    // 10. Transit Rain Shelters (Bus Stops) with Illuminated Route Screens
    const shelterL = createTransitShelter(-9.5, 34, true);
    const shelterR = createTransitShelter(9.5, 172, false);
    scene.add(shelterL);
    scene.add(shelterR);

    // 11. Street Trees along Sidewalks
    const treesGroup = new THREE.Group();
    for (let z = 20; z < 310; z += 38) {
      treesGroup.add(createStreetTree(-11.5, z));
      treesGroup.add(createStreetTree(11.5, z + 19));
    }
    scene.add(treesGroup);

    // 12. Distant Oncoming Traffic with Long Headlight Beams
    const traffic = createDistantTraffic();
    scene.add(traffic);

    // 13. Multi-Storey Buildings with Recessed Windows & Facades
    const buildingsGroup = new THREE.Group();
    const facadeTexViolet = createArchitecturalFacadeTexture('neon-violet');
    const facadeTexCyan = createArchitecturalFacadeTexture('cyan-steel');
    const facadeTexAmber = createArchitecturalFacadeTexture('warm-amber');

    const buildingDefs = [
      // Left side architecture
      { x: -24, z: 0, w: 18, h: 48, d: 26, tex: facadeTexViolet },
      { x: -26, z: 42, w: 20, h: 62, d: 30, tex: facadeTexCyan },
      { x: -23, z: 86, w: 16, h: 42, d: 24, tex: facadeTexAmber },
      { x: -27, z: 130, w: 22, h: 74, d: 34, tex: facadeTexViolet },
      { x: -24, z: 178, w: 18, h: 54, d: 28, tex: facadeTexCyan },
      { x: -26, z: 224, w: 20, h: 66, d: 32, tex: facadeTexAmber },
      { x: -23, z: 270, w: 17, h: 46, d: 26, tex: facadeTexViolet },

      // Right side architecture
      { x: 24, z: 6, w: 18, h: 52, d: 26, tex: facadeTexCyan },
      { x: 26, z: 48, w: 20, h: 70, d: 32, tex: facadeTexViolet },
      { x: 23, z: 94, w: 16, h: 44, d: 24, tex: facadeTexAmber },
      { x: 27, z: 138, w: 22, h: 78, d: 36, tex: facadeTexCyan },
      { x: 24, z: 186, w: 18, h: 58, d: 28, tex: facadeTexViolet },
      { x: 26, z: 232, w: 20, h: 68, d: 32, tex: facadeTexAmber },
      { x: 24, z: 280, w: 18, h: 50, d: 26, tex: facadeTexCyan }
    ];

    buildingDefs.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({
        map: b.tex,
        roughness: 0.5,
        metalness: 0.25,
        color: 0x121626
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      buildingsGroup.add(mesh);

      // Rooftop Communication Antennas with Flashing Red Hazard Beacons
      const antGeo = new THREE.CylinderGeometry(0.08, 0.12, 7, 6);
      const antMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(b.x + (Math.random() - 0.5) * 4, b.h + 3.5, b.z);
      buildingsGroup.add(ant);

      const beaconLight = new THREE.PointLight(0xef4444, 1.2, 10);
      beaconLight.position.set(b.x, b.h + 7.2, b.z);
      buildingsGroup.add(beaconLight);
    });
    scene.add(buildingsGroup);

    // 14. Integrated Architectural Station Monuments
    const station0 = createAwakeningPlazaMonument();
    const station1 = createKnowledgeSpireEntrance();
    const station2 = createRiftStation();
    const station3 = createBossArenaFacade();
    const station4 = createShadowSanctumFacade();
    const station5 = createRainPavilion();
    const station6 = createOracleSanctum();
    scene.add(station0);
    scene.add(station1);
    scene.add(station2);
    scene.add(station3);
    scene.add(station4);
    scene.add(station5);
    scene.add(station6);

    // Register station beacon lights into dynamic road lights for road reflections
    dynamicRoadLights.push(
      { position: new THREE.Vector3(0, 7.5, 0), color: new THREE.Color(0xa855f7), intensity: 2.8, radius: 25 },
      { position: new THREE.Vector3(0, 6.5, 48), color: new THREE.Color(0x06b6d4), intensity: 2.6, radius: 25 },
      { position: new THREE.Vector3(0, 5.0, 96), color: new THREE.Color(0x3b82f6), intensity: 2.6, radius: 25 },
      { position: new THREE.Vector3(0, 8.0, 144), color: new THREE.Color(0xef4444), intensity: 3.2, radius: 28 },
      { position: new THREE.Vector3(0, 7.0, 192), color: new THREE.Color(0x8b5cf6), intensity: 2.8, radius: 25 },
      { position: new THREE.Vector3(0, 5.0, 240), color: new THREE.Color(0x10b981), intensity: 2.4, radius: 24 },
      { position: new THREE.Vector3(0, 8.0, 288), color: new THREE.Color(0xf59e0b), intensity: 3.0, radius: 26 }
    );

    // 15. AAA Cinematic Rainfall Engine (Layer A Foreground streaks, Layer B Midground with Streetlight Illumination, Layer C Fine Background, Surface Impact Splashes & Wind Physics)
    const rainfallEngine = new CinematicRainfallEngine(scene, weatherState, graphicsQuality);
    rainfallEngineRef.current = rainfallEngine;

    // 16. Ground Atmospheric Mist / Wet Fog Layer
    const mistPlanes: THREE.Mesh[] = [];
    if (graphicsQuality !== 'low') {
      const mistGeo = new THREE.PlaneGeometry(28, 40);
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      for (let mz = 20; mz < 320; mz += 55) {
        const mist = new THREE.Mesh(mistGeo, mistMat);
        mist.rotation.x = -Math.PI / 2;
        mist.position.set(0, 0.45, mz);
        scene.add(mist);
        mistPlanes.push(mist);
      }
    }

    // 18. Interaction Listeners & Scroll Progression
    const handleResize = () => {
      if (!renderer || !camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY * 0.045;
      targetZRef.current = THREE.MathUtils.clamp(
        targetZRef.current + delta,
        -5,
        totalJourneyZ + 10
      );
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const delta = (touchStartY - e.touches[0].clientY) * 0.12;
        touchStartY = e.touches[0].clientY;
        targetZRef.current = THREE.MathUtils.clamp(
          targetZRef.current + delta,
          -5,
          totalJourneyZ + 10
        );
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 19. 60 FPS Render & Physics Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera lerp along Z
      currentZRef.current = THREE.MathUtils.lerp(currentZRef.current, targetZRef.current, 0.07);

      // Smooth mouse parallax
      mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.06);
      mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.06);

      const camZ = currentZRef.current;
      const camX = mouseRef.current.x * 0.85;
      // Natural walking bob & slight breathing
      const camY = 2.6 + Math.sin(elapsedTime * 2.8) * 0.035 - mouseRef.current.y * 0.25;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(camX * 0.35, 2.4 - mouseRef.current.y * 0.35, camZ + 28);

      // Update AAA Cinematic Rainfall Engine (3 depth layers, streetlight lighting, splashes, wind)
      rainfallEngine.update(delta, elapsedTime, camZ, dynamicRoadLights);

      // Environmental Reactions: Street trees foliage sways with real-time wind
      treesGroup.children.forEach((tree, idx) => {
        tree.rotation.z = Math.sin(elapsedTime * 1.6 + idx * 0.8) * (0.015 * Math.abs(rainfallEngine.currentWind.x));
      });

      // Subtle pulse & wind drift on ground mist
      mistPlanes.forEach((m, idx) => {
        m.position.x = Math.sin(elapsedTime * 0.4 + idx) * 1.0 + rainfallEngine.currentWind.x * 0.12;
      });

      // Update dynamic wet road shader (puddle ripples, dielectric Fresnel, local anisotropic streaks)
      const weatherCfg = WEATHER_PRESETS[weatherState];
      updateAAAWetRoadLights(
        roadMat,
        camera.position,
        elapsedTime,
        dynamicRoadLights,
        weatherCfg.rippleFactor,
        new THREE.Vector2(rainfallEngine.currentWind.x, rainfallEngine.currentWind.z)
      );

      // Dynamic scene fog density matching weather state
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, weatherCfg.fogDensity, 0.05);
      }

      // Update HUD wind telemetry periodically
      if (Math.floor(elapsedTime * 4) % 8 === 0) {
        setWindDisplay({
          speed: parseFloat(Math.abs(rainfallEngine.currentWind.x).toFixed(1)),
          direction: rainfallEngine.currentWind.x >= 0 ? 'ENE' : 'WSW'
        });
      }

      // Render Frame
      renderer.render(scene, camera);

      // Update UI Progress HUD
      const progress = THREE.MathUtils.clamp(camZ / totalJourneyZ, 0, 1);
      setScrollProgress(progress);

      let closestIdx = 0;
      let minDiff = Infinity;
      WORLD_STATIONS.forEach((s, idx) => {
        const diff = Math.abs(s.z - camZ);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      setCurrentStationIndex(closestIdx);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      renderer.dispose();
      rainfallEngine.dispose();
      roadGeo.dispose();
      roadMat.dispose();
      asphaltPBR.map.dispose();
      asphaltPBR.roughnessMap.dispose();
      asphaltPBR.normalMap.dispose();
      envMap.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [totalJourneyZ, graphicsQuality, weatherState]);

  // Auto-Cruise effect
  useEffect(() => {
    if (!isAutoCruising) return;
    const interval = setInterval(() => {
      targetZRef.current += 0.8;
      if (targetZRef.current >= totalJourneyZ) {
        targetZRef.current = 0;
      }
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoCruising, totalJourneyZ]);

  // Jump to specific station
  const handleJumpToStation = (station: StationInfo) => {
    soundManager.playSfx('click');
    targetZRef.current = station.z;
    onSelectStation(station.id);
  };

  const activeStation = WORLD_STATIONS[currentStationIndex] || WORLD_STATIONS[0];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#03050f] text-slate-100 font-sans select-none">
      {/* 1. Fullscreen Real-time Photorealistic 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Optional Cinematic Camera Lens Droplets Overlay */}
      <CameraLensDroplets
        weather={weatherState}
        enabled={lensDropletsEnabled}
        graphicsQuality={graphicsQuality}
      />

      {/* 3. Rainy Worlds Cinematic Atmospheric Vignette */}
      <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-t from-[#03050f]/95 via-transparent to-[#03050f]/75" />
      <div className="fixed inset-0 pointer-events-none z-1 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(2,4,12,0.85)_100%)]" />

      {/* 4. Top HUD: Real-time World Telemetry & Quality Settings */}
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-auto px-4 py-3 flex items-center justify-between border-b border-indigo-500/20 bg-[#030514]/85 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
            <span className="text-lg">{activeStation.icon}</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold">
                CINEMATIC RAIN WORLD // {activeStation.district}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                COORD Z: {Math.round(currentZRef.current || 0)}m
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-white drop-shadow">
              {activeStation.name}
            </h1>
          </div>
        </div>

        {/* World Exploration & Rainfall Weather Controls */}
        <div className="flex items-center gap-2">
          {/* Weather Intensity State Selector (Light / Moderate / Heavy / Storm) */}
          <button
            onClick={handleCycleWeather}
            title={`Weather Intensity: ${weatherState.toUpperCase()} (Click to cycle: Light, Moderate, Heavy, Storm)`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              weatherState === 'storm'
                ? 'bg-red-950/70 border-red-500/50 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                : weatherState === 'heavy'
                ? 'bg-blue-950/70 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : weatherState === 'moderate'
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-300'
            }`}
          >
            {weatherState === 'storm' ? (
              <CloudLightning className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : (
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">RAIN:</span>
            <span className="font-bold uppercase">{weatherState}</span>
          </button>

          {/* Lens Droplets Effect Toggle */}
          <button
            onClick={handleToggleLensDroplets}
            title={lensDropletsEnabled ? "Disable Camera Lens Droplets" : "Enable Camera Lens Droplets"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              lensDropletsEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Droplets className={`w-3.5 h-3.5 ${lensDropletsEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{lensDropletsEnabled ? 'LENS DROPS' : 'NO DROPS'}</span>
          </button>

          {/* Wind Telemetry Badge */}
          <div 
            title={`Dynamic Wind: ${windDisplay.speed} m/s towards ${windDisplay.direction}`}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-slate-900/60 border-slate-700/50 text-slate-400"
          >
            <Wind className="w-3.5 h-3.5 text-indigo-400" />
            <span>{windDisplay.speed}m/s {windDisplay.direction}</span>
          </div>

          {/* Graphics Quality Setting */}
          <button
            onClick={handleCycleQuality}
            title={`Graphics Quality: ${graphicsQuality.toUpperCase()}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">GFX:</span>
            <span className="font-bold text-cyan-400 uppercase">{graphicsQuality}</span>
          </button>

          {/* Lo-Fi Rain Audio Toggle */}
          <button
            onClick={handleToggleRainAudio}
            title={isRainAudioActive ? "Mute Ambient Rain Ambiance" : "Play Ambient Rain Ambiance"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isRainAudioActive 
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {isRainAudioActive ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRainAudioActive ? 'RAIN SOUND ON' : 'RAIN SOUND'}</span>
          </button>

          {/* Auto-Cruise Mode */}
          <button
            onClick={() => setIsAutoCruising(prev => !prev)}
            title="Auto-walk through rainy avenue"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isAutoCruising 
                ? 'bg-purple-950/70 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {isAutoCruising ? <Pause className="w-3.5 h-3.5 text-purple-400" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoCruising ? 'CRUISING' : 'AUTO-CRUISE'}</span>
          </button>

          {/* Inspect World (Hide / Show HUD Panels) */}
          <button
            onClick={onToggleInspectWorld}
            title={isInspectingWorld ? "Show Station Panels" : "Inspect World Freely"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isInspectingWorld 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            {isInspectingWorld ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isInspectingWorld ? 'EXIT INSPECT' : 'INSPECT WORLD'}</span>
          </button>
        </div>
      </header>

      {/* 4. Left Side District Road Stations Navigator */}
      <nav 
        aria-label="District Stations"
        className="fixed left-3 top-20 bottom-24 z-20 pointer-events-auto hidden md:flex flex-col justify-center gap-1.5 max-w-[210px]"
      >
        <div className="p-2 rounded-xl bg-[#060a1d]/85 backdrop-blur-md border border-indigo-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest border-b border-indigo-500/20">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>STREET WAYPOINTS</span>
          </div>
          <div className="space-y-1">
            {WORLD_STATIONS.map((station) => {
              const isSelected = activeStation.id === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => handleJumpToStation(station)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-all flex items-center justify-between text-xs group ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-900/60 to-indigo-950/60 border border-purple-500/40 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm shrink-0">{station.icon}</span>
                    <span className="truncate text-[11px] font-semibold">{station.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400">
                    {station.z}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 5. Right Side Journey Progress Meter */}
      <div className="fixed right-3 top-20 bottom-24 z-20 pointer-events-none hidden lg:flex flex-col items-center justify-center">
        <div className="h-48 w-2 rounded-full bg-slate-900/80 border border-indigo-500/30 overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.8)]">
          <div 
            className="w-full bg-gradient-to-b from-cyan-400 via-purple-500 to-indigo-500 transition-all duration-150"
            style={{ height: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>
        <span className="mt-2 text-[9px] font-mono text-cyan-400 font-bold">
          {Math.round(scrollProgress * 100)}%
        </span>
      </div>

      {/* 6. Main Interactive Hub Panels (Station Overlays) */}
      <div className={`relative z-10 w-full pt-16 pb-24 transition-all duration-300 ${
        isInspectingWorld ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 pointer-events-auto'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* Active Station Banner Notification */}
          <div className="mb-4 p-3 rounded-2xl bg-[#080d24]/85 backdrop-blur-xl border border-indigo-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/20"
                style={{ backgroundColor: `${activeStation.color}25` }}
              >
                {activeStation.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-black uppercase" style={{ backgroundColor: activeStation.color }}>
                    {activeStation.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Scroll down or click waypoints to travel deeper along the street
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {activeStation.description}
                </p>
              </div>
            </div>

            {/* Quick travel buttons to previous / next station */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                disabled={currentStationIndex <= 0}
                onClick={() => handleJumpToStation(WORLD_STATIONS[Math.max(0, currentStationIndex - 1)])}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                title="Previous Station"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                disabled={currentStationIndex >= WORLD_STATIONS.length - 1}
                onClick={() => handleJumpToStation(WORLD_STATIONS[Math.min(WORLD_STATIONS.length - 1, currentStationIndex + 1)])}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                title="Next Station"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Children View (The actual full StudyBuddy views: Dashboard, Syllabus, Dungeon, Boss, etc.) */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>

      {/* 7. Bottom Scroll Invitation Tooltip */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05081b]/80 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)] text-[11px] font-mono text-cyan-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>SCROLL TO MOVE CAMERA FORWARD ALONG THE RAINY STREET</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </div>
    </div>
  );
};
