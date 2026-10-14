import * as THREE from 'three';

/**
 * AAA Wet Road Custom Shader Material
 * Implements physically based dielectric water puddles, Schlick Fresnel grazing reflections,
 * elongated anisotropic light streaks for streetlights & neon signs, and animated puddle ripples.
 */

export interface RoadLightSource {
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  radius: number;
}

export function createAAAWetRoadMaterial(
  albedoMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  normalMap: THREE.Texture,
  envMap: THREE.Texture
): THREE.ShaderMaterial {
  // Vertex Shader
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  // Fragment Shader
  const fragmentShader = `
    uniform sampler2D tAlbedo;
    uniform sampler2D tRoughness;
    uniform sampler2D tNormal;
    uniform sampler2D tEnv;
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform float uRainIntensity;
    uniform vec2 uWindVector;

    // Up to 16 dynamic local light sources along the road (streetlamps, neon signs, headlights)
    const int MAX_LIGHTS = 16;
    uniform vec3 uLightPos[MAX_LIGHTS];
    uniform vec3 uLightColor[MAX_LIGHTS];
    uniform float uLightIntensity[MAX_LIGHTS];
    uniform float uLightRadius[MAX_LIGHTS];
    uniform int uLightCount;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    // Schlick Fresnel approximation for dielectric water (F0 = 0.02)
    float fresnelSchlick(float cosTheta, float F0) {
      return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
    }

    void main() {
      // Sample Base PBR maps
      vec4 albedo = texture2D(tAlbedo, vUv);
      vec4 roughSample = texture2D(tRoughness, vUv);
      vec3 normalSample = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;

      // Puddle mask: dark regions in roughness map are water puddles
      float isPuddle = 1.0 - smoothstep(0.02, 0.35, roughSample.r);
      float roughness = mix(roughSample.r, 0.03, isPuddle);

      // Physical concentric expanding impact ripples inside puddles
      // Primary droplet impact grid
      vec2 rippleGrid1 = vUv * vec2(32.0, 180.0);
      vec2 cellId1 = floor(rippleGrid1);
      vec2 cellFrac1 = fract(rippleGrid1) - 0.5;
      float dropPhase1 = fract(sin(dot(cellId1, vec2(127.1, 311.7))) * 43758.5453);
      float dropTime1 = fract(uTime * (1.2 * max(0.4, uRainIntensity)) + dropPhase1);
      float dropDist1 = length(cellFrac1);
      float waveRadius1 = dropTime1 * 0.55;
      float waveDiff1 = dropDist1 - waveRadius1;
      float ring1 = exp(-waveDiff1 * waveDiff1 * 60.0) * (1.0 - dropTime1) * sin(waveDiff1 * 45.0);

      // Secondary staggered droplet impact grid for non-uniform natural drops
      vec2 rippleGrid2 = (vUv + vec2(0.43, 0.29)) * vec2(44.0, 240.0);
      vec2 cellId2 = floor(rippleGrid2);
      vec2 cellFrac2 = fract(rippleGrid2) - 0.5;
      float dropPhase2 = fract(sin(dot(cellId2, vec2(269.5, 183.3))) * 28461.183);
      float dropTime2 = fract(uTime * (1.45 * max(0.4, uRainIntensity)) + dropPhase2);
      float dropDist2 = length(cellFrac2);
      float waveRadius2 = dropTime2 * 0.55;
      float waveDiff2 = dropDist2 - waveRadius2;
      float ring2 = exp(-waveDiff2 * waveDiff2 * 70.0) * (1.0 - dropTime2) * sin(waveDiff2 * 52.0);

      // Wind-driven surface shear
      vec2 windRippleUv = vUv * 65.0 + uWindVector * uTime * 0.06;
      float windNoise = (sin(windRippleUv.x * 4.0) + cos(windRippleUv.y * 3.5)) * 0.2;

      float totalRipple = (ring1 * 0.65 + ring2 * 0.55 + windNoise * 0.15) * uRainIntensity * isPuddle;
      vec3 animatedNormal = normalize(vNormal + normalSample * 0.35 + vec3(totalRipple * 0.14, 0.0, totalRipple * 0.14));

      vec3 viewDir = normalize(uCameraPos - vWorldPosition);
      float NdotV = max(dot(animatedNormal, viewDir), 0.001);

      // Dielectric Fresnel reflectance: 0.02 at head-on angle, up to 0.95 at grazing road horizon
      float fresnel = fresnelSchlick(NdotV, 0.035);
      fresnel = mix(fresnel * 0.6, fresnel, isPuddle); // Puddles have intense Fresnel response

      // Base diffuse lighting (ambient night skylight)
      vec3 ambient = vec3(0.04, 0.06, 0.12) * albedo.rgb;
      vec3 diffuse = ambient;
      vec3 specularTotal = vec3(0.0);

      // Evaluate lighting from local streetlights & neon signs
      for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uLightCount) break;

        vec3 lightPos = uLightPos[i];
        vec3 lightCol = uLightColor[i];
        float intensity = uLightIntensity[i];
        float radius = uLightRadius[i];

        vec3 lightDir = lightPos - vWorldPosition;
        float dist = length(lightDir);

        if (dist < radius) {
          lightDir = normalize(lightDir);
          float atten = pow(clamp(1.0 - dist / radius, 0.0, 1.0), 2.0);

          // Diffuse component
          float NdotL = max(dot(animatedNormal, lightDir), 0.0);
          diffuse += albedo.rgb * lightCol * NdotL * intensity * atten;

          // Anisotropic vertical specular streak on wet asphalt
          vec3 halfVec = normalize(lightDir + viewDir);
          float NdotH = max(dot(animatedNormal, halfVec), 0.0);

          // Stretch highlight along view direction for wet road look
          float specPower = mix(16.0, 128.0, 1.0 - roughness);
          float spec = pow(NdotH, specPower);

          // Additional elongated vertical reflection streak
          float dx = abs(lightPos.x - vWorldPosition.x);
          float streakFactor = exp(-dx * 1.2) * smoothstep(0.0, 15.0, vWorldPosition.z - uCameraPos.z);
          float wetStreak = streakFactor * pow(clamp(dot(reflect(-viewDir, animatedNormal), lightDir), 0.0, 1.0), 8.0) * isPuddle;

          specularTotal += lightCol * (spec + wetStreak * 2.5) * intensity * atten;
        }
      }

      // Sample Equirectangular City Sky Environment Reflection
      vec3 reflectDir = reflect(-viewDir, animatedNormal);
      float phi = atan(reflectDir.z, reflectDir.x);
      float theta = acos(clamp(reflectDir.y, -1.0, 1.0));
      vec2 envUv = vec2((phi + 3.14159) / 6.28318, theta / 3.14159);
      vec3 envReflection = texture2D(tEnv, envUv).rgb;

      // Combine Diffuse, Environment Reflections, and Local Lights
      vec3 waterReflection = envReflection * (0.4 + 0.6 * isPuddle);
      vec3 finalColor = diffuse + mix(specularTotal, waterReflection + specularTotal, fresnel);

      // Distance exponential fog blending with dark wet city atmosphere (matching scene.fog)
      float fogDist = length(uCameraPos - vWorldPosition);
      float fogFactor = 1.0 - exp(-fogDist * fogDist * 0.00028);
      vec3 fogColor = vec3(0.024, 0.035, 0.078); // Deep midnight blue-black fog
      vec3 outputWithFog = mix(finalColor, fogColor, clamp(fogFactor, 0.0, 0.98));

      gl_FragColor = vec4(outputWithFog, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      tAlbedo: { value: albedoMap },
      tRoughness: { value: roughnessMap },
      tNormal: { value: normalMap },
      tEnv: { value: envMap },
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uRainIntensity: { value: 1.0 },
      uWindVector: { value: new THREE.Vector2(2.5, 0.0) },
      uLightPos: { value: Array.from({ length: 16 }, () => new THREE.Vector3()) },
      uLightColor: { value: Array.from({ length: 16 }, () => new THREE.Color()) },
      uLightIntensity: { value: new Float32Array(16) },
      uLightRadius: { value: new Float32Array(16) },
      uLightCount: { value: 0 }
    }
  });

  return material;
}

/**
 * Updates the 16 nearest light sources and weather parameters into the wet road shader uniforms
 */
export function updateAAAWetRoadLights(
  material: THREE.ShaderMaterial,
  cameraPos: THREE.Vector3,
  time: number,
  allLights: RoadLightSource[],
  rainIntensity: number = 1.0,
  windVector: THREE.Vector2 = new THREE.Vector2(2.5, 0.0)
): void {
  if (!material.uniforms) return;

  material.uniforms.uTime.value = time;
  material.uniforms.uCameraPos.value.copy(cameraPos);
  if (material.uniforms.uRainIntensity) {
    material.uniforms.uRainIntensity.value = rainIntensity;
  }
  if (material.uniforms.uWindVector) {
    material.uniforms.uWindVector.value.copy(windVector);
  }

  // Sort lights by distance to camera along Z axis
  const sorted = [...allLights]
    .map(l => ({ light: l, dist: Math.abs(l.position.z - cameraPos.z) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 16);

  const posUniform = material.uniforms.uLightPos.value as THREE.Vector3[];
  const colUniform = material.uniforms.uLightColor.value as THREE.Color[];
  const intensityUniform = material.uniforms.uLightIntensity.value as Float32Array;
  const radiusUniform = material.uniforms.uLightRadius.value as Float32Array;

  sorted.forEach((item, idx) => {
    posUniform[idx].copy(item.light.position);
    colUniform[idx].copy(item.light.color);
    intensityUniform[idx] = item.light.intensity;
    radiusUniform[idx] = item.light.radius;
  });

  material.uniforms.uLightCount.value = sorted.length;
}
