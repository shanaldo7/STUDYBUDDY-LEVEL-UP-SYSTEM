import * as THREE from 'three';
import {
  createStormDrainTexture,
  createManholeCoverTexture
} from './RainyStreetPBRTextures';

/**
 * 3D Model Builders for Photorealistic Urban Rainy Street
 * Includes detailed Streetlights, Parked Vehicles, Transit Shelters,
 * Storm Drains, Manholes, Trees, and Architectural Station Landmarks.
 */

// 1. Detailed Cast-Iron Gooseneck Streetlight Model
export function createDetailedStreetlight(
  x: number,
  z: number,
  isLeft: boolean,
  colorHex: number
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x161a24,
    roughness: 0.35,
    metalness: 0.85
  });

  // Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.6, 12);
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.position.y = 0.3;
  group.add(base);

  // Electrical Access Door
  const doorGeo = new THREE.BoxGeometry(0.12, 0.35, 0.05);
  const door = new THREE.Mesh(doorGeo, metalMat);
  door.position.set(0, 0.35, isLeft ? 0.38 : -0.38);
  group.add(door);

  // Fluted Column Main Post
  const postGeo = new THREE.CylinderGeometry(0.09, 0.18, 6.2, 12);
  const post = new THREE.Mesh(postGeo, metalMat);
  post.position.y = 3.4;
  group.add(post);

  // Decorative Collar Rings
  [1.2, 4.8, 6.2].forEach(y => {
    const ringGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16);
    const ring = new THREE.Mesh(ringGeo, metalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  });

  // Arched Gooseneck Arm curving over the roadway
  const armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 6.4, 0),
    new THREE.Vector3(isLeft ? 1.0 : -1.0, 7.2, 0),
    new THREE.Vector3(isLeft ? 2.2 : -2.2, 6.8, 0)
  );
  const armGeo = new THREE.TubeGeometry(armCurve, 16, 0.06, 8, false);
  const arm = new THREE.Mesh(armGeo, metalMat);
  group.add(arm);

  // Bell Lantern Housing
  const lampX = isLeft ? 2.2 : -2.2;
  const lampY = 6.6;
  const capGeo = new THREE.CylinderGeometry(0.35, 0.15, 0.25, 12);
  const cap = new THREE.Mesh(capGeo, metalMat);
  cap.position.set(lampX, lampY + 0.15, 0);
  group.add(cap);

  // Glowing Bulb / Lantern Enclosure
  const bulbGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const bulbMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(lampX, lampY - 0.05, 0);
  group.add(bulb);

  // PointLight casting light onto the wet road below
  const light = new THREE.PointLight(colorHex, 2.4, 22, 1.4);
  light.position.set(lampX, lampY - 0.2, 0);
  group.add(light);

  // Volumetric Rain Haze Light Cone (semi-transparent mist cone)
  const coneGeo = new THREE.ConeGeometry(3.6, 6.8, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.09,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(lampX, lampY - 3.4, 0);
  group.add(cone);

  return group;
}

// 2. Realistic Parked Vehicle (Cyber Sedan / Sports Car)
export function createParkedVehicle(x: number, z: number, rotationY: number, colorHex: number): THREE.Group {
  const car = new THREE.Group();
  car.position.set(x, 0, z);
  car.rotation.y = rotationY;

  // Wet Metallic Car Paint Material
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.18, // Wet glossy car clearcoat
    metalness: 0.85
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.1
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.2,
    metalness: 0.95
  });

  // Lower Chassis Body
  const chassisGeo = new THREE.BoxGeometry(1.9, 0.55, 4.4);
  const chassis = new THREE.Mesh(chassisGeo, paintMat);
  chassis.position.y = 0.5;
  car.add(chassis);

  // Cabin & Windshield Roof
  const cabinGeo = new THREE.BoxGeometry(1.65, 0.52, 2.3);
  const cabin = new THREE.Mesh(cabinGeo, paintMat);
  cabin.position.set(0, 0.98, -0.2);
  car.add(cabin);

  // Windshield & Rear Windows
  const frontGlassGeo = new THREE.BoxGeometry(1.58, 0.44, 0.08);
  const frontGlass = new THREE.Mesh(frontGlassGeo, glassMat);
  frontGlass.position.set(0, 0.94, 0.98);
  frontGlass.rotation.x = -Math.PI / 6;
  car.add(frontGlass);

  const rearGlass = new THREE.Mesh(frontGlassGeo, glassMat);
  rearGlass.position.set(0, 0.94, -1.38);
  rearGlass.rotation.x = Math.PI / 6;
  car.add(rearGlass);

  // 4 Realistic Wheels with Rims
  const wheelOffsets = [
    { wx: -0.98, wz: 1.3 },
    { wx: 0.98, wz: 1.3 },
    { wx: -0.98, wz: -1.3 },
    { wx: 0.98, wz: -1.3 }
  ];

  wheelOffsets.forEach(pos => {
    const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16);
    const tire = new THREE.Mesh(tireGeo, rubberMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(pos.wx, 0.34, pos.wz);
    car.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 8);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(pos.wx, 0.34, pos.wz);
    car.add(rim);
  });

  // Glowing Headlights (Front, Z > 0)
  const headGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
  const headMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
  [-0.65, 0.65].forEach(hx => {
    const hMesh = new THREE.Mesh(headGeo, headMat);
    hMesh.position.set(hx, 0.52, 2.22);
    car.add(hMesh);
  });

  // Glowing Red Taillights (Rear, Z < 0)
  const tailGeo = new THREE.BoxGeometry(0.35, 0.1, 0.08);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  [-0.65, 0.65].forEach(tx => {
    const tMesh = new THREE.Mesh(tailGeo, tailMat);
    tMesh.position.set(tx, 0.52, -2.22);
    car.add(tMesh);
  });

  // Red glow on wet asphalt behind the car
  const tailLight = new THREE.PointLight(0xef4444, 0.8, 6);
  tailLight.position.set(0, 0.4, -2.6);
  car.add(tailLight);

  return car;
}

// 3. Realistic Transit Rain Shelter (Bus Stop)
export function createTransitShelter(x: number, z: number, isLeft: boolean): THREE.Group {
  const shelter = new THREE.Group();
  shelter.position.set(x, 0, z);
  shelter.rotation.y = isLeft ? 0 : Math.PI;

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.8
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.45
  });

  // 4 Steel Pillar Posts
  [-1.8, 1.8].forEach(px => {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
    const post = new THREE.Mesh(postGeo, steelMat);
    post.position.set(px, 1.6, -0.9);
    shelter.add(post);
  });

  // Roof Canopy (slanted for rain runoff)
  const roofGeo = new THREE.BoxGeometry(4.2, 0.1, 2.2);
  const roof = new THREE.Mesh(roofGeo, steelMat);
  roof.position.set(0, 3.2, 0);
  roof.rotation.x = -0.08;
  shelter.add(roof);

  // Rear Glass Windbreak Wall with Rain Streaks
  const backGlassGeo = new THREE.PlaneGeometry(3.6, 2.4);
  const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
  backGlass.position.set(0, 1.7, -0.9);
  shelter.add(backGlass);

  // Illuminated Route Schedule Ad Display Kiosk
  const adGeo = new THREE.BoxGeometry(0.8, 1.8, 0.14);
  const adMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const adBox = new THREE.Mesh(adGeo, steelMat);
  adBox.position.set(1.4, 1.4, -0.2);
  shelter.add(adBox);

  const adScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.5), adMat);
  adScreen.position.set(1.4, 1.4, -0.12);
  shelter.add(adScreen);

  // Shelter Interior Warm Lamp
  const interiorLight = new THREE.PointLight(0xffedd5, 1.2, 8);
  interiorLight.position.set(0, 2.9, 0);
  shelter.add(interiorLight);

  return shelter;
}

// 4. Urban Storm Drains and Cast-Iron Manholes
export function createRoadProps(): THREE.Group {
  const group = new THREE.Group();
  const drainTex = createStormDrainTexture();
  const manholeTex = createManholeCoverTexture();

  const drainMat = new THREE.MeshStandardMaterial({
    map: drainTex,
    roughness: 0.3,
    metalness: 0.85
  });

  const manholeMat = new THREE.MeshStandardMaterial({
    map: manholeTex,
    roughness: 0.4,
    metalness: 0.9
  });

  // Storm Drains placed along curb gutters every 40 meters
  for (let z = 10; z < 320; z += 42) {
    // Left curb drain
    const drainL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), drainMat);
    drainL.rotation.x = -Math.PI / 2;
    drainL.position.set(-6.6, 0.08, z);
    group.add(drainL);

    // Right curb drain
    const drainR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), drainMat);
    drainR.rotation.x = -Math.PI / 2;
    drainR.position.set(6.6, 0.08, z + 21);
    group.add(drainR);
  }

  // Cast Iron Manhole Covers spaced along traffic lanes
  const manholeZ = [25, 75, 130, 185, 235, 280];
  manholeZ.forEach((z, idx) => {
    const mh = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16), manholeMat);
    mh.rotation.x = -Math.PI / 2;
    mh.position.set(idx % 2 === 0 ? -2.2 : 2.2, 0.06, z);
    group.add(mh);
  });

  return group;
}

// 5. Urban Street Trees with Glistening Wet Foliage
export function createStreetTree(x: number, z: number): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.8,
    metalness: 0.1
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    roughness: 0.35, // Wet leaf shine
    metalness: 0.1
  });

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 4.2, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2.1;
  tree.add(trunk);

  // Wet Foliage Clusters
  const clusterDefs = [
    { y: 3.8, r: 1.4 },
    { y: 4.6, r: 1.1 },
    { y: 5.3, r: 0.8 }
  ];

  clusterDefs.forEach(c => {
    const folGeo = new THREE.DodecahedronGeometry(c.r, 1);
    const fol = new THREE.Mesh(folGeo, foliageMat);
    fol.position.y = c.y;
    tree.add(fol);
  });

  return tree;
}

// 6. District 01: Awakening Plaza Monument (Archway & Braziers)
export function createAwakeningPlazaMonument(): THREE.Group {
  const plaza = new THREE.Group();
  plaza.position.set(0, 0, 0);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1e2436,
    roughness: 0.45,
    metalness: 0.3
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85
  });

  // Twin Grand Entrance Pillars
  [-6.2, 6.2].forEach(px => {
    const colGeo = new THREE.BoxGeometry(1.6, 9.2, 1.6);
    const col = new THREE.Mesh(colGeo, stoneMat);
    col.position.set(px, 4.6, 0);
    plaza.add(col);

    // Glowing Brazier atop each pillar
    const fireLight = new THREE.PointLight(0xa855f7, 2.5, 16);
    fireLight.position.set(px, 9.6, 0);
    plaza.add(fireLight);
  });

  // Archway Transom Span
  const archGeo = new THREE.BoxGeometry(14.0, 1.4, 1.8);
  const arch = new THREE.Mesh(archGeo, stoneMat);
  arch.position.set(0, 9.4, 0);
  plaza.add(arch);

  // Floating Runic Monarch Crest
  const crestGeo = new THREE.TorusGeometry(2.4, 0.12, 16, 32);
  const crest = new THREE.Mesh(crestGeo, goldMat);
  crest.position.set(0, 6.2, 0);
  plaza.add(crest);

  return plaza;
}

// 7. District 02: BCA Knowledge Spire Entrance Atrium
export function createKnowledgeSpireEntrance(): THREE.Group {
  const spire = new THREE.Group();
  spire.position.set(0, 0, 48);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.08,
    metalness: 0.9,
    transparent: true,
    opacity: 0.65
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.85
  });

  // Translucent Curved Glass Canopy over the street
  const canopyGeo = new THREE.CylinderGeometry(8.5, 8.5, 6.0, 16, 1, true, 0, Math.PI);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.rotation.z = Math.PI / 2;
  canopy.rotation.y = Math.PI / 2;
  canopy.position.set(0, 5.2, 0);
  spire.add(canopy);

  // Neon BCA Directory Pillar
  const pillarGeo = new THREE.BoxGeometry(0.8, 5.5, 0.8);
  const pillarL = new THREE.Mesh(pillarGeo, steelMat);
  pillarL.position.set(-6.2, 2.75, 0);
  spire.add(pillarL);

  const pillarR = new THREE.Mesh(pillarGeo, steelMat);
  pillarR.position.set(6.2, 2.75, 0);
  spire.add(pillarR);

  // Cyan Atrium Illumination
  const cyanLight = new THREE.PointLight(0x06b6d4, 2.2, 20);
  cyanLight.position.set(0, 6.5, 0);
  spire.add(cyanLight);

  return spire;
}

// 8. District 03: Dimensional Rift Station (Hazard Subterranean Vault)
export function createRiftStation(): THREE.Group {
  const rift = new THREE.Group();
  rift.position.set(0, 0, 96);

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.4,
    metalness: 0.75
  });

  // Heavy Vault Bulkhead Gates flanking the street
  [-6.4, 6.4].forEach(px => {
    const gateGeo = new THREE.BoxGeometry(1.8, 8.0, 3.5);
    const gate = new THREE.Mesh(gateGeo, steelMat);
    gate.position.set(px, 4.0, 0);
    rift.add(gate);

    // Flashing Warning Beacons
    const beacon = new THREE.PointLight(0x3b82f6, 2.2, 15);
    beacon.position.set(px, 8.2, 0);
    rift.add(beacon);
  });

  // Dimensional Rift Portal Core (Swirling Torus)
  const portalCoreGeo = new THREE.TorusGeometry(3.2, 0.2, 16, 48);
  const portalCoreMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const portalCore = new THREE.Mesh(portalCoreGeo, portalCoreMat);
  portalCore.position.set(0, 5.0, 0);
  rift.add(portalCore);

  return rift;
}

// 9. District 04: Monarch's Monolith & Boss Arena Facade
export function createBossArenaFacade(): THREE.Group {
  const boss = new THREE.Group();
  boss.position.set(0, 0, 144);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x090508,
    roughness: 0.25,
    metalness: 0.85
  });

  // Twin Gothic Obsidian Obelisks
  [-6.5, 6.5].forEach(px => {
    const obeliskGeo = new THREE.CylinderGeometry(0.6, 1.4, 12.0, 4);
    const obelisk = new THREE.Mesh(obeliskGeo, obsidianMat);
    obelisk.position.set(px, 6.0, 0);
    obelisk.rotation.y = Math.PI / 4;
    boss.add(obelisk);
  });

  // Crimson Spotlights casting down on the arena threshold
  const redSpot = new THREE.SpotLight(0xef4444, 4.0, 24, Math.PI / 4, 0.4);
  redSpot.position.set(0, 10.0, 0);
  redSpot.target.position.set(0, 0, 0);
  boss.add(redSpot);
  boss.add(redSpot.target);

  return boss;
}

// 10. Distant Oncoming Vehicle Headlight Beams
export function createDistantTraffic(): THREE.Group {
  const traffic = new THREE.Group();

  // Distant car 1 (Z = 160)
  const car1 = createParkedVehicle(-2.2, 160, 0, 0x1e293b);
  traffic.add(car1);

  // High-intensity xenon headlight beams projecting forward down the road
  const headlightBeam1 = new THREE.SpotLight(0x93c5fd, 3.5, 45, Math.PI / 6, 0.6);
  headlightBeam1.position.set(-2.2, 0.6, 160);
  headlightBeam1.target.position.set(-2.2, 0, 110);
  traffic.add(headlightBeam1);
  traffic.add(headlightBeam1.target);

  // Distant car 2 (Z = 280)
  const car2 = createParkedVehicle(2.2, 280, Math.PI, 0x0f172a);
  traffic.add(car2);

  return traffic;
}

// 11. District 05: Shadow Sanctum & Guild Haven (Z = 192)
export function createShadowSanctumFacade(): THREE.Group {
  const sanctum = new THREE.Group();
  sanctum.position.set(0, 0, 192);

  const shadowMetalMat = new THREE.MeshStandardMaterial({
    color: 0x110e20,
    roughness: 0.22,
    metalness: 0.88
  });

  // Twin Dark Spire Sconces with Violet Extraction Flames
  [-6.2, 6.2].forEach(px => {
    const spireGeo = new THREE.CylinderGeometry(0.3, 0.9, 10.5, 6);
    const spire = new THREE.Mesh(spireGeo, shadowMetalMat);
    spire.position.set(px, 5.25, 0);
    sanctum.add(spire);

    // Deep purple extraction mist light
    const purpleLight = new THREE.PointLight(0x8b5cf6, 2.8, 18, 1.2);
    purpleLight.position.set(px, 10.8, 0);
    sanctum.add(purpleLight);
  });

  // Shadow Army Portal Crest Transom
  const crestGeo = new THREE.TorusGeometry(2.8, 0.15, 12, 32);
  const crestMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
  const crest = new THREE.Mesh(crestGeo, crestMat);
  crest.position.set(0, 6.8, 0);
  sanctum.add(crest);

  return sanctum;
}

// 12. District 06: Rain Pavilion & Memory Archive (Z = 240)
export function createRainPavilion(): THREE.Group {
  const pavilion = new THREE.Group();
  pavilion.position.set(0, 0, 240);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.6
  });

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.35,
    metalness: 0.75
  });

  // Architectural Glass Canopy Arch
  const canopyGeo = new THREE.TorusGeometry(6.8, 0.3, 8, 24, Math.PI);
  const canopy = new THREE.Mesh(canopyGeo, bronzeMat);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.set(0, 5.5, 0);
  pavilion.add(canopy);

  // Twin Emerald Garden Lanterns
  [-6.0, 6.0].forEach(px => {
    const lanternGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const lantern = new THREE.Mesh(lanternGeo, glassMat);
    lantern.position.set(px, 3.8, 0);
    pavilion.add(lantern);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.2, 16, 1.3);
    emeraldLight.position.set(px, 4.0, 0);
    pavilion.add(emeraldLight);
  });

  return pavilion;
}

// 13. District 07: System Oracle & Grimoire Sanctum (Z = 288)
export function createOracleSanctum(): THREE.Group {
  const oracle = new THREE.Group();
  oracle.position.set(0, 0, 288);

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.2,
    metalness: 0.9
  });

  // Monolithic Digital Beacon Obelisk
  [-6.2, 6.2].forEach(px => {
    const obGeo = new THREE.BoxGeometry(1.2, 11.0, 1.2);
    const ob = new THREE.Mesh(obGeo, goldTrimMat);
    ob.position.set(px, 5.5, 0);
    oracle.add(ob);

    // Golden System Oracle Beacon Light
    const amberLight = new THREE.PointLight(0xf59e0b, 2.6, 20, 1.2);
    amberLight.position.set(px, 11.2, 0);
    oracle.add(amberLight);
  });

  // Central Holographic Runestone
  const runeGeo = new THREE.OctahedronGeometry(1.8, 0);
  const runeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
  const rune = new THREE.Mesh(runeGeo, runeMat);
  rune.position.set(0, 7.2, 0);
  oracle.add(rune);

  return oracle;
}
