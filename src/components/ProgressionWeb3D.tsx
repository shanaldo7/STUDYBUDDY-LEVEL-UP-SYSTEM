/**
 * StudyBuddy AI - Monarch Hunter 3D Progression Core & Academic Constellation
 * High-performance lightweight Three.js WebGL visualization of the student's real academic growth.
 * Visualizes authentic Level, XP, Attributes, and Syllabus Mastery with original abstract geometry.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  HunterUser, 
  Syllabus, 
  SyllabusSubject, 
  SyllabusTopic,
  TopicStatus 
} from '../types/hunter';
import { 
  buildProgressionWebGraph, 
  calculateStudyPower, 
  WebGraphNode, 
  inferSubjectAttribute,
  ATTRIBUTE_DEFINITIONS 
} from '../utils/progressionWebData';
import { soundManager } from '../utils/audio';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  Target, 
  ChevronRight, 
  X,
  Swords,
  Timer
} from 'lucide-react';

interface ProgressionWeb3DProps {
  user: HunterUser;
  activeSyllabus?: Syllabus | null;
  onSelectNode: (node: WebGraphNode) => void;
  selectedNode: WebGraphNode | null;
  isLevelUpAnimating?: boolean;
  onSkipLevelUp?: () => void;
  onFallbackTo2D: () => void;
}

export const ProgressionWeb3D: React.FC<ProgressionWeb3DProps> = ({
  user,
  activeSyllabus,
  onSelectNode,
  selectedNode,
  isLevelUpAnimating,
  onSkipLevelUp,
  onFallbackTo2D
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<{ title: string; mastery: number; type: string; color: string } | null>(null);

  // Graph metrics calculation
  const { nodes, metrics } = React.useMemo(() => {
    return buildProgressionWebGraph(user, activeSyllabus || null);
  }, [user, activeSyllabus]);

  // Keep references to Three.js objects for camera animation & controls
  const controlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetCamera: () => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      // 1. Scene & Camera Setup
      const activeScene = new THREE.Scene();
      scene = activeScene;
      activeScene.fog = new THREE.FogExp2(0x05070f, 0.018);

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      const defaultCameraPos = new THREE.Vector3(0, 14, 28);
      camera.position.copy(defaultCameraPos);
      camera.lookAt(0, 0, 0);

      // 2. WebGL Renderer with performance capping
      renderer = new THREE.WebGLRenderer({ 
        antialias: window.devicePixelRatio < 2, 
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // 3. Lighting
      const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0);
      scene.add(ambientLight);

      const coreLight = new THREE.PointLight(0x06b6d4, 3.5, 40);
      coreLight.position.set(0, 0, 0);
      scene.add(coreLight);

      const rimLight = new THREE.DirectionalLight(0x818cf8, 1.2);
      rimLight.position.set(15, 20, 15);
      scene.add(rimLight);

      // 4. Background Starfield / Cosmic Particles
      const particleCount = prefersReducedMotion ? 80 : 250;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 80;
        particlePositions[i + 1] = (Math.random() - 0.5) * 60;
        particlePositions[i + 2] = (Math.random() - 0.5) * 80;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.35,
        transparent: true,
        opacity: 0.55
      });
      const particlePoints = new THREE.Points(particleGeo, particleMat);
      scene.add(particlePoints);

      // 5. Central 3D Progression Core (Original Geometric Forms)
      const coreGroup = new THREE.Group();
      scene.add(coreGroup);

      // Core Inner Crystalline Sphere
      const innerCoreGeo = new THREE.IcosahedronGeometry(2.2, 1);
      const innerCoreMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false
      });
      const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      coreGroup.add(innerCoreMesh);

      // Wireframe faceted shroud
      const wireframeGeo = new THREE.IcosahedronGeometry(2.5, 1);
      const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
      coreGroup.add(wireframeMesh);

      // Gyro Rings (3 concentric rotating energy rings)
      const ringGeos = [
        new THREE.TorusGeometry(3.6, 0.06, 12, 48),
        new THREE.TorusGeometry(4.3, 0.05, 12, 48),
        new THREE.TorusGeometry(5.0, 0.04, 12, 48)
      ];
      const ringColors = [0x06b6d4, 0x818cf8, 0xa855f7];
      const gyroRings: THREE.Mesh[] = [];

      ringGeos.forEach((geo, idx) => {
        const mat = new THREE.MeshBasicMaterial({
          color: ringColors[idx],
          transparent: true,
          opacity: 0.7
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = (idx * Math.PI) / 3;
        ring.rotation.y = (idx * Math.PI) / 4;
        coreGroup.add(ring);
        gyroRings.push(ring);
      });

      // 6. Interactive Subject & Topic 3D Nodes
      const interactiveMeshes: { mesh: THREE.Mesh; node: WebGraphNode }[] = [];
      const branchConnectionsGroup = new THREE.Group();
      scene.add(branchConnectionsGroup);

      // Register the core node as interactive
      const coreNodeData = nodes.find(n => n.type === 'core');
      if (coreNodeData) {
        interactiveMeshes.push({ mesh: innerCoreMesh, node: coreNodeData });
      }

      // Filter subject or pillar branches
      const branchNodes = nodes.filter(n => n.type === 'subject' || n.type === 'pillar');
      const numBranches = branchNodes.length;
      const orbitRadius = 14.5;

      branchNodes.forEach((bNode, bIdx) => {
        const angle = (bIdx / Math.max(1, numBranches)) * (2 * Math.PI);
        const bx = orbitRadius * Math.cos(angle);
        const bz = orbitRadius * Math.sin(angle);
        const by = Math.sin(bIdx * 1.5) * 1.8;

        // Subject Node Geometry (Faceted Crystalline Dodecahedron)
        const subGeo = new THREE.DodecahedronGeometry(1.2, 0);
        const masteryPct = bNode.mastery || 0;
        
        // Energy radiance based strictly on real mastery
        let emissiveIntensity = 0.3;
        if (masteryPct >= 85) emissiveIntensity = 1.8;
        else if (masteryPct >= 60) emissiveIntensity = 1.2;
        else if (masteryPct >= 40) emissiveIntensity = 0.8;
        else if (masteryPct >= 20) emissiveIntensity = 0.5;

        const isWeak = masteryPct < 50;
        const nodeColor = isWeak ? 0xf59e0b : new THREE.Color(bNode.color).getHex();

        const subMat = new THREE.MeshStandardMaterial({
          color: nodeColor,
          emissive: nodeColor,
          emissiveIntensity,
          roughness: 0.25,
          metalness: 0.75
        });
        const subMesh = new THREE.Mesh(subGeo, subMat);
        subMesh.position.set(bx, by, bz);
        activeScene.add(subMesh);
        interactiveMeshes.push({ mesh: subMesh, node: bNode });

        // Mastery Ring around Subject Node
        const masteryRingGeo = new THREE.TorusGeometry(1.7, 0.04, 8, 36);
        const masteryRingMat = new THREE.MeshBasicMaterial({
          color: masteryPct >= 85 ? 0x38bdf8 : nodeColor,
          transparent: true,
          opacity: Math.max(0.3, masteryPct / 100)
        });
        const masteryRing = new THREE.Mesh(masteryRingGeo, masteryRingMat);
        masteryRing.rotation.x = Math.PI / 2;
        subMesh.add(masteryRing);

        // Weak Warning Indicator if mastery < 50%
        if (isWeak) {
          const warningHaloGeo = new THREE.RingGeometry(2.0, 2.1, 24);
          const warningHaloMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
          });
          const warningHalo = new THREE.Mesh(warningHaloGeo, warningHaloMat);
          warningHalo.rotation.x = Math.PI / 2;
          subMesh.add(warningHalo);
        }

        // Energy Connection Line from Center Core to Subject Node
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(bx * 0.5, by * 0.5 + 0.5, bz * 0.5),
          new THREE.Vector3(bx, by, bz)
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.04, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: nodeColor,
          transparent: true,
          opacity: Math.max(0.25, masteryPct / 100)
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        branchConnectionsGroup.add(tubeMesh);

        // Child Topic Satellites (Outward Orbit around Subject)
        const childTopics = nodes.filter(n => n.parentId === bNode.id).slice(0, 4);
        const topicRadius = 3.6;

        childTopics.forEach((tNode, tIdx) => {
          const tAngle = angle - 0.7 + (tIdx * 0.45);
          const tx = bx + topicRadius * Math.cos(tAngle);
          const tz = bz + topicRadius * Math.sin(tAngle);
          const ty = by + (tIdx % 2 === 0 ? 0.8 : -0.8);

          const tMastery = tNode.mastery || 0;
          const tGeo = new THREE.OctahedronGeometry(0.5, 0);
          const tColor = tNode.status === 'MASTERED' ? 0x38bdf8 : tNode.status === 'IN_PROGRESS' ? 0xa855f7 : 0x475569;
          const tMat = new THREE.MeshStandardMaterial({
            color: tColor,
            emissive: tColor,
            emissiveIntensity: tMastery >= 85 ? 1.5 : tMastery > 0 ? 0.7 : 0.1,
            roughness: 0.3
          });
          const tMesh = new THREE.Mesh(tGeo, tMat);
          tMesh.position.set(tx, ty, tz);
          activeScene.add(tMesh);
          interactiveMeshes.push({ mesh: tMesh, node: tNode });

          // Minor connection line from Subject to Topic
          const tLineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(bx, by, bz),
            new THREE.Vector3(tx, ty, tz)
          ]);
          const tLineMat = new THREE.LineBasicMaterial({
            color: tColor,
            transparent: true,
            opacity: 0.35
          });
          const tLine = new THREE.Line(tLineGeo, tLineMat);
          branchConnectionsGroup.add(tLine);
        });
      });

      // 7. Raycasting & Interaction Setup
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Camera Orbit Controls State
      let isDragging = false;
      let prevMousePos = { x: 0, y: 0 };
      let spherical = {
        radius: 30,
        theta: Math.PI / 2,
        phi: Math.PI / 3
      };

      const updateCameraPosition = () => {
        if (!camera) return;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        spherical.radius = Math.max(10, Math.min(55, spherical.radius));

        camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        camera.position.y = spherical.radius * Math.cos(spherical.phi);
        camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.lookAt(0, 0, 0);
      };
      updateCameraPosition();

      // Export camera control handlers to ref
      controlsRef.current = {
        zoomIn: () => {
          spherical.radius = Math.max(12, spherical.radius - 4);
          updateCameraPosition();
        },
        zoomOut: () => {
          spherical.radius = Math.min(50, spherical.radius + 4);
          updateCameraPosition();
        },
        resetCamera: () => {
          spherical = { radius: 30, theta: Math.PI / 2, phi: Math.PI / 3 };
          updateCameraPosition();
        }
      };

      // Pointer Event Handlers
      const onPointerDown = (e: MouseEvent) => {
        isDragging = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
      };

      const onPointerMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDragging) {
          const deltaX = e.clientX - prevMousePos.x;
          const deltaY = e.clientY - prevMousePos.y;
          prevMousePos = { x: e.clientX, y: e.clientY };

          spherical.theta -= deltaX * 0.008;
          spherical.phi -= deltaY * 0.008;
          updateCameraPosition();
        } else if (camera) {
          // Hover Raycast detection
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(interactiveMeshes.map(m => m.mesh));
          if (intersects.length > 0) {
            const hit = interactiveMeshes.find(m => m.mesh === intersects[0].object);
            if (hit) {
              setHoveredNodeInfo({
                title: hit.node.title,
                mastery: hit.node.mastery,
                type: hit.node.type.toUpperCase(),
                color: hit.node.color
              });
              container.style.cursor = 'pointer';
              return;
            }
          }
          setHoveredNodeInfo(null);
          container.style.cursor = 'grab';
        }
      };

      const onPointerUp = (e: MouseEvent) => {
        const deltaMove = Math.abs(e.clientX - prevMousePos.x) + Math.abs(e.clientY - prevMousePos.y);
        isDragging = false;

        // If it was a clean click without major dragging, select node
        if (deltaMove < 5 && camera) {
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(interactiveMeshes.map(m => m.mesh));
          if (intersects.length > 0) {
            const hit = interactiveMeshes.find(m => m.mesh === intersects[0].object);
            if (hit) {
              soundManager.playSfx('click');
              onSelectNode(hit.node);
            }
          }
        }
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        spherical.radius += e.deltaY * 0.02;
        updateCameraPosition();
      };

      const domEl = renderer.domElement;
      domEl.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      domEl.addEventListener('wheel', onWheel, { passive: false });

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      });
      resizeObserver.observe(container);

      // 8. Animation Render Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        if (!prefersReducedMotion) {
          // Slow ambient core rotation
          coreGroup.rotation.y += delta * 0.25;

          // Counter-rotate gyro rings
          gyroRings[0].rotation.z += delta * 0.4;
          gyroRings[1].rotation.x -= delta * 0.3;
          gyroRings[2].rotation.y += delta * 0.2;

          // Cosmic particles subtle drift
          particlePoints.rotation.y = elapsedTime * 0.02;

          // Pulse inner core scale slightly with heart-beat resonance
          const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.04;
          innerCoreMesh.scale.set(pulse, pulse, pulse);
        }

        // Render scene
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      // 9. Cleanup function
      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        domEl.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        domEl.removeEventListener('wheel', onWheel);

        if (renderer) {
          renderer.dispose();
          if (domEl.parentNode) {
            domEl.parentNode.removeChild(domEl);
          }
        }

        // Dispose geometries & materials
        scene?.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      };
    } catch (webglErr) {
      console.warn('[WebGL Initialization Failed]:', webglErr);
      onFallbackTo2D();
    }
  }, [nodes, onSelectNode, onFallbackTo2D]);

  return (
    <div className="relative w-full h-[640px] sm:h-[720px] bg-[#050814] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-[inset_0_0_90px_rgba(3,7,18,0.95)]">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Floating 3D Camera Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#090d1f]/90 border border-cyan-500/30 rounded-lg p-1.5 flex flex-col gap-1 backdrop-blur-md shadow-lg">
          <button
            onClick={() => controlsRef.current?.zoomIn()}
            className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => controlsRef.current?.zoomOut()}
            className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => controlsRef.current?.resetCamera()}
            className="p-2 rounded bg-slate-800/80 text-slate-200 hover:text-cyan-300 hover:bg-slate-700/80 transition-colors"
            title="Reset 3D Camera"
            aria-label="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="px-2.5 py-1 rounded bg-[#090d1f]/80 border border-cyan-500/20 text-[10px] font-mono-tech text-cyan-400">
          3D ORBIT MODE
        </div>
      </div>

      {/* 3D Legend & Attribute Indicator */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col gap-1.5 bg-[#090d1f]/90 border border-cyan-500/25 p-3 rounded-lg backdrop-blur-md shadow-lg max-w-[220px] pointer-events-auto">
        <div className="text-[10px] font-mono-tech font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
          3D RADIANCE MATRIX
        </div>
        <div className="text-[11px] text-slate-300 flex items-center justify-between">
          <span>85–100%:</span>
          <span className="text-cyan-400 font-mono-tech font-bold">★ MASTERED</span>
        </div>
        <div className="text-[11px] text-slate-300 flex items-center justify-between">
          <span>50–84%:</span>
          <span className="text-purple-300 font-mono-tech font-bold">⚡ STABLE ORBIT</span>
        </div>
        <div className="text-[11px] text-slate-300 flex items-center justify-between">
          <span>&lt; 50%:</span>
          <span className="text-amber-400 font-mono-tech font-bold">⚠️ WEAK TARGET</span>
        </div>
        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono-tech">
          Drag to rotate · Scroll to zoom · Click node to inspect
        </div>
      </div>

      {/* Hover Intel Tooltip */}
      {hoveredNodeInfo && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#090d20]/95 border border-cyan-500/40 p-3 rounded-lg backdrop-blur-md shadow-2xl max-w-xs animate-fadeIn pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredNodeInfo.color }} />
            <span className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-wider">
              {hoveredNodeInfo.type}
            </span>
          </div>
          <div className="font-bold text-sm text-slate-100 truncate">{hoveredNodeInfo.title}</div>
          <div className="text-xs text-slate-300 mt-0.5">
            Mastery: <span className="font-mono-tech font-bold text-cyan-300">{hoveredNodeInfo.mastery}%</span>
          </div>
        </div>
      )}

      {/* Level-Up 3D Sequence Overlay if active */}
      {isLevelUpAnimating && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#091228] border-2 border-cyan-400 rounded-2xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(6,182,212,0.6)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl animate-bounce">
              👑
            </div>
            <div>
              <div className="text-xs font-mono-tech font-bold text-cyan-400 uppercase tracking-widest">
                SYSTEM CORE RESONANCE
              </div>
              <h2 className="text-2xl font-black font-monarch text-white mt-1">
                LEVEL UP: {user.level} → {user.level + 1}
              </h2>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs font-mono-tech space-y-1.5 text-left">
              <div className="flex justify-between text-cyan-300">
                <span>+1 ATTRIBUTE POINT</span>
                <span className="text-emerald-400">UNSPENT</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>+120 XP SURGE</span>
                <span className="text-cyan-400">+POWER</span>
              </div>
            </div>
            {onSkipLevelUp && (
              <button
                onClick={onSkipLevelUp}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-colors"
              >
                SKIP ANIMATION
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
