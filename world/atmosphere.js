/**
 * Physical 3D Lighting Rig, Mood-Synced PMREM & Zero-Emissive Auditor (`world/atmosphere.js`)
 *
 * Calibrated for Kashgar Id Kah Mosque (`X ∈ [-52..+52], Z ∈ [-88..+31], Y ∈ [0..21]`):
 *   - 100% Real Light Sources Only across `day`, `dusk`, and `night`
 *   - Tight directional shadow frustum (`[-92, +92]`, `4096×4096` GPU / `1024×1024` software WebGL)
 *     centered at `(0, 4, -26)` for tack-sharp minarets, pointed Riwaq arches & fluted timber pillars
 *   - Warm architectural lanterns on the East Iwan Gatehouse, Twin Minaret sherefe galleries,
 *     courtyard Howz colonnades, and Namazgah prayer hall
 *   - Zero `emissive` (`0x000000`, `intensity = 0.0`), zero `AdditiveBlending`, zero unlit shaders
 */

const VALID_MOODS = ['day', 'dusk', 'night'];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerp3(out, a, b, t) {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

function smoothstep01(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function hexToRgb01(hex) {
  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}

export const ARCHIVAL_LIGHTING_PRESETS = Object.freeze({
  day: {
    exposure: 1.05,
    envIntensity: 0.78,
    skyZenith: hexToRgb01(0xd3cdc1),
    skyMid: hexToRgb01(0xe2dcd0),
    skyHorizon: hexToRgb01(0xe6e0d4), // Matches EXHIBITION_FOG_PRESETS.day 1:1
    skyNadir: hexToRgb01(0xd4cdc0),
    sunGlowStrength: 0.04,
    fogColor: 0xe6e0d4,
    fogNear: 240,
    fogFar: 1350,
    sunPos: [145, 185, 138], // Bright Tarim morning/afternoon light illuminating East Gatehouse (+Z)
    sunColor: 0xfff8ec,
    sunIntensity: 3.05,
    hemiSkyColor: 0xf1eee6,
    hemiGroundColor: 0xd0c6b4,
    hemiIntensity: 0.98,
    rimPos: [-135, 95, -145],
    rimColor: 0xdce2e8,
    rimIntensity: 0.60,
    fillPos: [-120, 110, 155],
    fillColor: 0xede6da,
    fillIntensity: 0.38,
    archPointIntensity: 36.0,
    floor1PointIntensity: 24.0,
    floor2PointIntensity: 22.0,
    pharePointIntensity: 48.0,
    phareSpotIntensity: 0.0,
  },

  dusk: {
    exposure: 1.04,
    envIntensity: 0.72,
    skyZenith: hexToRgb01(0xc7bdb0),
    skyMid: hexToRgb01(0xdad0bf),
    skyHorizon: hexToRgb01(0xe2d8c8), // Matches EXHIBITION_FOG_PRESETS.dusk 1:1
    skyNadir: hexToRgb01(0xc4b9aa),
    sunGlowStrength: 0.06,
    fogColor: 0xe2d8c8,
    fogNear: 225,
    fogFar: 1300,
    sunPos: [195, 86, 155], // Warm low-angle Tarim sunset raking saffron plaster & arched shadows
    sunColor: 0xf7e3c6,
    sunIntensity: 2.75,
    hemiSkyColor: 0xe8ddcb,
    hemiGroundColor: 0xbdad98,
    hemiIntensity: 0.84,
    rimPos: [-135, 85, -145],
    rimColor: 0xdad4c9,
    rimIntensity: 0.52,
    fillPos: [-110, 100, 145],
    fillColor: 0xe4d9c8,
    fillIntensity: 0.34,
    archPointIntensity: 95.0,
    floor1PointIntensity: 72.0,
    floor2PointIntensity: 68.0,
    pharePointIntensity: 110.0,
    phareSpotIntensity: 0.0,
  },

  night: {
    exposure: 1.06,
    envIntensity: 0.58,
    skyZenith: hexToRgb01(0x2b2a28),
    skyMid: hexToRgb01(0x3a3834),
    skyHorizon: hexToRgb01(0x4a4742),
    skyNadir: hexToRgb01(0x282623),
    sunGlowStrength: 0.025,
    fogColor: 0x4a4742,
    fogNear: 215,
    fogFar: 1240,
    sunPos: [-125, 195, 145], // Silver crescent moonlight
    sunColor: 0xdcdad4,
    sunIntensity: 0.88,
    hemiSkyColor: 0x646058,
    hemiGroundColor: 0x3a3630,
    hemiIntensity: 0.56,
    rimPos: [140, 95, -140],
    rimColor: 0xc8c5be,
    rimIntensity: 0.42,
    fillPos: [-100, 105, 130],
    fillColor: 0x9e968a,
    fillIntensity: 0.25,
    archPointIntensity: 210.0,
    floor1PointIntensity: 165.0,
    floor2PointIntensity: 155.0,
    pharePointIntensity: 240.0,
    phareSpotIntensity: 0.0,
  },
});

function createEquirectSkyBuffer(THREE, width = 256, height = 128) {
  const bytes = new Uint8Array(width * height * 4);
  const tex = new THREE.DataTexture(bytes, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, bytes, width, height };
}

function updateEquirectSkyPixels(skyObj, state, sunDirNorm) {
  const { tex, bytes, width, height } = skyObj;
  const [zr, zg, zb] = state.skyZenith;
  const [mr, mg, mb] = state.skyMid;
  const [hr, hg, hb] = state.skyHorizon;
  const [nr, ng, nb] = state.skyNadir;
  const glowAmp = state.sunGlowStrength ?? 0.03;

  const cosLon = new Float32Array(width);
  const sinLon = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    const lon = ((x + 0.5) / width - 0.5) * Math.PI * 2.0;
    cosLon[x] = Math.cos(lon);
    sinLon[x] = Math.sin(lon);
  }

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const lat = (v - 0.5) * Math.PI;
    const dirY = Math.sin(lat);
    const cosLat = Math.cos(lat);

    let baseR;
    let baseG;
    let baseB;
    if (dirY >= 0.0) {
      const tLow = smoothstep01(dirY / 0.24);
      const tHigh = smoothstep01((dirY - 0.16) / 0.74);
      const veilBoost = smoothstep01(dirY / 0.06) * (1.0 - smoothstep01((dirY - 0.06) / 0.22));
      const vr = Math.min(0.96, hr * (1.0 + 0.028 * veilBoost));
      const vg = Math.min(0.96, hg * (1.0 + 0.028 * veilBoost));
      const vb = Math.min(0.96, hb * (1.0 + 0.028 * veilBoost));
      const m1r = lerp(vr, mr, tLow);
      const m1g = lerp(vg, mg, tLow);
      const m1b = lerp(vb, mb, tLow);
      baseR = lerp(m1r, zr, tHigh);
      baseG = lerp(m1g, zg, tHigh);
      baseB = lerp(m1b, zb, tHigh);
    } else {
      const tDown = smoothstep01(-dirY / 0.30);
      baseR = lerp(hr, nr, tDown);
      baseG = lerp(hg, ng, tDown);
      baseB = lerp(hb, nb, tDown);
    }

    const horizonMask = clamp(1.0 - Math.abs(dirY) * 1.4, 0.0, 1.0);
    for (let x = 0; x < width; x++) {
      const dirX = cosLat * cosLon[x];
      const dirZ = cosLat * sinLon[x];
      const sunDot = Math.max(0.0, dirX * sunDirNorm[0] + dirY * sunDirNorm[1] + dirZ * sunDirNorm[2]);
      const halo = Math.pow(sunDot, 5.0) * glowAmp * (dirY >= -0.05 ? 1.0 : 0.0) * (0.4 + 0.6 * horizonMask);

      const o = (y * width + x) * 4;
      bytes[o] = Math.max(0, Math.min(255, Math.round((baseR + halo) * 255)));
      bytes[o + 1] = Math.max(0, Math.min(255, Math.round((baseG + halo * 0.96) * 255)));
      bytes[o + 2] = Math.max(0, Math.min(255, Math.round((baseB + halo * 0.88) * 255)));
      bytes[o + 3] = 255;
    }
  }
  tex.needsUpdate = true;
}

export function auditZeroEmissive(scene, { enforceZero = false } = {}) {
  const violations = [];
  const offenders = [];
  const seenMats = new Set();
  let meshCount = 0;
  let checkedMaterials = 0;
  let unlitCount = 0;
  let additiveCount = 0;
  let spriteCount = 0;
  let realLightCount = 0;

  if (!scene) {
    return {
      passes: true,
      zeroEmissivePass: true,
      meshCount: 0,
      checkedMaterials: 0,
      offendingCount: 0,
      unlitCount: 0,
      additiveCount: 0,
      spriteCount: 0,
      realLightCount: 0,
      offenders,
      violations,
    };
  }

  scene.traverse((obj) => {
    if (obj.isLight) {
      realLightCount += 1;
      return;
    }
    if (obj.isSprite) {
      spriteCount += 1;
      violations.push({
        object: obj.name || obj.uuid,
        material: obj.material?.name || obj.material?.type || 'SpriteMaterial',
        reason: 'Sprite glow object forbidden',
      });
      return;
    }
    if (!obj.isMesh && !obj.isInstancedMesh) return;
    if (obj.name === 'sky_dome_1889') {
      if (enforceZero && obj.parent) {
        obj.visible = false;
      }
      return;
    }

    meshCount += 1;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m) continue;
      if (!seenMats.has(m)) {
        seenMats.add(m);
        checkedMaterials += 1;
      }

      if (enforceZero) {
        if (m.emissive && typeof m.emissive.setHex === 'function') {
          m.emissive.setHex(0x000000);
        }
        if ('emissiveIntensity' in m) {
          m.emissiveIntensity = 0.0;
        }
        if (m.emissiveMap) {
          m.emissiveMap = null;
          m.needsUpdate = true;
        }
        if (m.blending === 2) {
          m.blending = 1;
          m.needsUpdate = true;
        }
      }

      const emisHex = m.emissive && typeof m.emissive.getHex === 'function' ? m.emissive.getHex() : 0;
      const emisInt = Number(m.emissiveIntensity ?? 0);
      if ((emisHex !== 0 && emisInt > 0) || Boolean(m.emissiveMap)) {
        const entry = {
          meshName: obj.name || obj.uuid,
          materialName: m.name || m.type,
          object: obj.name || obj.uuid,
          material: m.name || m.type,
          emissiveHex: `#${emisHex.toString(16).padStart(6, '0')}`,
          emissiveIntensity: Number(emisInt.toFixed(3)),
          reason: `emissive=0x${emisHex.toString(16)} intensity=${emisInt} map=${Boolean(m.emissiveMap)}`,
        };
        violations.push(entry);
        offenders.push(entry);
      }

      if (m.blending === 2) {
        additiveCount += 1;
        const entry = {
          meshName: obj.name || obj.uuid,
          materialName: m.name || m.type,
          object: obj.name || obj.uuid,
          material: m.name || m.type,
          reason: 'AdditiveBlending',
        };
        violations.push(entry);
        offenders.push(entry);
      }

      if (m.isMeshBasicMaterial || m.isShaderMaterial || m.isRawShaderMaterial) {
        unlitCount += 1;
        const entry = {
          meshName: obj.name || obj.uuid,
          materialName: m.name || m.type,
          object: obj.name || obj.uuid,
          material: m.name || m.type,
          reason: `Unlit surface material (${m.type})`,
        };
        violations.push(entry);
        offenders.push(entry);
      }
    }
  });

  const passes = violations.length === 0;
  return {
    passes,
    zeroEmissivePass: passes,
    meshCount,
    checkedMaterials,
    offendingCount: violations.length,
    unlitCount,
    additiveCount,
    spriteCount,
    realLightCount,
    offenders,
    violations,
  };
}

export function enforceZeroEmissiveAcrossScene(scene) {
  return auditZeroEmissive(scene, { enforceZero: true });
}

export function createLightingRig({
  THREE,
  scene,
  renderer,
  isSoftwareWebGL = false,
  preserveExistingFogDistances = false,
} = {}) {
  if (!THREE || !scene) {
    throw new Error('createLightingRig requires { THREE, scene }.');
  }

  const existingSkyMesh = scene.getObjectByName('sky_dome_1889');
  if (existingSkyMesh && existingSkyMesh.parent) {
    existingSkyMesh.parent.remove(existingSkyMesh);
    existingSkyMesh.geometry?.dispose?.();
    existingSkyMesh.material?.dispose?.();
  }

  const rigGroup = new THREE.Group();
  rigGroup.name = 'paris_1889_atmosphere';
  scene.add(rigGroup);

  if (renderer && renderer.shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap ?? THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
  }

  const skyEquirect = createEquirectSkyBuffer(THREE, 256, 128);
  const skyCubeRT =
    renderer && typeof THREE.WebGLCubeRenderTarget === 'function'
      ? new THREE.WebGLCubeRenderTarget(128)
      : null;
  scene.background = skyCubeRT ? skyCubeRT.texture : skyEquirect.tex;

  let pmremGen = null;
  let currentPmremRT = null;
  if (renderer && typeof THREE.PMREMGenerator === 'function') {
    try {
      pmremGen = new THREE.PMREMGenerator(renderer);
      pmremGen.compileEquirectangularShader?.();
    } catch {
      pmremGen = null;
    }
  }

  function syncSkyBackgroundCube() {
    if (skyCubeRT && renderer) {
      try {
        skyCubeRT.fromEquirectangularTexture(renderer, skyEquirect.tex);
      } catch {
        scene.background = skyEquirect.tex;
      }
    }
  }

  function rebuildEnvironmentFromSky() {
    if (!pmremGen) return;
    try {
      const nextRT = pmremGen.fromEquirectangular(skyEquirect.tex);
      if (currentPmremRT) currentPmremRT.dispose();
      currentPmremRT = nextRT;
      scene.environment = nextRT.texture;
    } catch {
      // Safe fallback if WebGL context is lost
    }
  }

  const hadUpstreamFog = Boolean(scene.fog);
  if (!scene.fog) {
    scene.fog = new THREE.Fog(
      ARCHIVAL_LIGHTING_PRESETS.day.fogColor,
      ARCHIVAL_LIGHTING_PRESETS.day.fogNear,
      ARCHIVAL_LIGHTING_PRESETS.day.fogFar
    );
  }

  // Primary Directional Sun Light — frustum covers entire Mosque compound + Id Kah Square foreground
  const sunLight = new THREE.DirectionalLight(
    ARCHIVAL_LIGHTING_PRESETS.day.sunColor,
    ARCHIVAL_LIGHTING_PRESETS.day.sunIntensity
  );
  sunLight.position.set(...ARCHIVAL_LIGHTING_PRESETS.day.sunPos);
  sunLight.name = 'atmo_sun_light';
  sunLight.castShadow = true;
  const shadowRes = isSoftwareWebGL ? 1024 : 4096;
  sunLight.shadow.mapSize.set(shadowRes, shadowRes);
  sunLight.shadow.camera.near = 40;
  sunLight.shadow.camera.far = 460;
  sunLight.shadow.camera.left = -92;
  sunLight.shadow.camera.right = 92;
  sunLight.shadow.camera.bottom = -92;
  sunLight.shadow.camera.top = 92;
  sunLight.shadow.bias = -0.00024;
  sunLight.shadow.normalBias = 0.022;
  sunLight.shadow.radius = 1.30;
  sunLight.target.position.set(0, 4, -26);
  rigGroup.add(sunLight, sunLight.target);

  const hemiLight = new THREE.HemisphereLight(
    ARCHIVAL_LIGHTING_PRESETS.day.hemiSkyColor,
    ARCHIVAL_LIGHTING_PRESETS.day.hemiGroundColor,
    ARCHIVAL_LIGHTING_PRESETS.day.hemiIntensity
  );
  hemiLight.position.set(0, 220, 0);
  hemiLight.name = 'atmo_hemi_light';
  rigGroup.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(
    ARCHIVAL_LIGHTING_PRESETS.day.rimColor,
    ARCHIVAL_LIGHTING_PRESETS.day.rimIntensity
  );
  rimLight.position.set(...ARCHIVAL_LIGHTING_PRESETS.day.rimPos);
  rimLight.name = 'atmo_rim_light';
  rigGroup.add(rimLight);

  const fillLight = new THREE.DirectionalLight(
    ARCHIVAL_LIGHTING_PRESETS.day.fillColor,
    ARCHIVAL_LIGHTING_PRESETS.day.fillIntensity
  );
  fillLight.position.set(...ARCHIVAL_LIGHTING_PRESETS.day.fillPos);
  fillLight.name = 'atmo_fill_light';
  rigGroup.add(fillLight);

  // Real Mosque Architectural PointLights (East Gatehouse Iwan, Twin Minarets, Naqara-khana, Courtyard, Namazgah)
  const archCoords = [
    [0, 8.2, 24.5],
    [16.8, 15.8, 25.4],
    [-16.8, 15.8, 25.4],
    [0, 16.5, 25.4],
  ];
  const archPointLights = archCoords.map(([x, y, z], idx) => {
    const pt = new THREE.PointLight(0xffebd2, ARCHIVAL_LIGHTING_PRESETS.day.archPointIntensity, 56, 2.0);
    pt.position.set(x, y, z);
    pt.name = `real_arch_gasolier_${idx}`;
    rigGroup.add(pt);
    return pt;
  });

  const floor1Coords = [
    [16, 4.4, -16],
    [-16, 4.4, -16],
    [16, 4.4, 8],
    [-16, 4.4, 8],
  ];
  const floor1PointLights = floor1Coords.map(([x, y, z], idx) => {
    const pt = new THREE.PointLight(0xffedd4, ARCHIVAL_LIGHTING_PRESETS.day.floor1PointIntensity, 48, 2.0);
    pt.position.set(x, y, z);
    pt.name = `real_floor1_lantern_${idx}`;
    rigGroup.add(pt);
    return pt;
  });

  const floor2Coords = [
    [14, 4.6, -54],
    [-14, 4.6, -54],
    [0, 4.8, -76],
  ];
  const floor2PointLights = floor2Coords.map(([x, y, z], idx) => {
    const pt = new THREE.PointLight(0xffeed8, ARCHIVAL_LIGHTING_PRESETS.day.floor2PointIntensity, 46, 2.0);
    pt.position.set(x, y, z);
    pt.name = `real_floor2_lantern_${idx}`;
    rigGroup.add(pt);
    return pt;
  });

  // Stationary East Gatehouse Plaza Gateway Lantern (`pharePointLight` API preserved; spot disabled)
  const pharePointLight = new THREE.PointLight(
    0xfff3de,
    ARCHIVAL_LIGHTING_PRESETS.day.pharePointIntensity,
    58,
    2.0
  );
  pharePointLight.position.set(0, 6.2, 34.0);
  pharePointLight.name = 'real_phare_point';
  rigGroup.add(pharePointLight);

  const phareSpotLight = new THREE.SpotLight(0xfff3de, 0.0, 90, 0.44, 0.65, 1.8);
  phareSpotLight.position.set(0, 12.0, 32.0);
  phareSpotLight.target.position.set(0, 0.5, 42.0);
  phareSpotLight.name = 'real_phare_spotlight';
  rigGroup.add(phareSpotLight, phareSpotLight.target);

  let currentMood = 'day';
  let currentStep = 11.0;
  let transitionProgress = 1.0;
  const TRANSITION_DURATION_SEC = 1.1;
  let sunAnglesOverride = null;
  let activeConstructionTimer = 0.0;
  let shadowAccumulator = 0.0;

  function cloneState(preset) {
    return {
      exposure: preset.exposure,
      envIntensity: preset.envIntensity,
      skyZenith: [...preset.skyZenith],
      skyMid: [...preset.skyMid],
      skyHorizon: [...preset.skyHorizon],
      skyNadir: [...preset.skyNadir],
      sunGlowStrength: preset.sunGlowStrength,
      fogColor: new THREE.Color(preset.fogColor),
      fogNear: preset.fogNear,
      fogFar: preset.fogFar,
      sunPos: [...preset.sunPos],
      sunColor: new THREE.Color(preset.sunColor),
      sunIntensity: preset.sunIntensity,
      hemiSkyColor: new THREE.Color(preset.hemiSkyColor),
      hemiGroundColor: new THREE.Color(preset.hemiGroundColor),
      hemiIntensity: preset.hemiIntensity,
      rimPos: [...preset.rimPos],
      rimColor: new THREE.Color(preset.rimColor),
      rimIntensity: preset.rimIntensity,
      fillPos: [...preset.fillPos],
      fillColor: new THREE.Color(preset.fillColor),
      fillIntensity: preset.fillIntensity,
      archPointIntensity: preset.archPointIntensity,
      floor1PointIntensity: preset.floor1PointIntensity,
      floor2PointIntensity: preset.floor2PointIntensity,
      pharePointIntensity: preset.pharePointIntensity,
      phareSpotIntensity: preset.phareSpotIntensity,
    };
  }

  let liveState = cloneState(ARCHIVAL_LIGHTING_PRESETS.day);
  let fromState = cloneState(ARCHIVAL_LIGHTING_PRESETS.day);
  let toState = cloneState(ARCHIVAL_LIGHTING_PRESETS.day);

  function requestShadowUpdate() {
    if (renderer && renderer.shadowMap) {
      renderer.shadowMap.needsUpdate = true;
    }
  }

  function notifyConstructionActivity(durationSec = 0.35) {
    activeConstructionTimer = Math.max(activeConstructionTimer, durationSec);
  }

  function applyLiveStateToScene({ rebuildEnv = false, syncSky = true } = {}) {
    if (sunAnglesOverride) {
      const az = THREE.MathUtils.degToRad(sunAnglesOverride.azimuthDeg);
      const el = THREE.MathUtils.degToRad(sunAnglesOverride.elevationDeg);
      const r = 270;
      const y = Math.sin(el) * r;
      const rh = Math.cos(el) * r;
      sunLight.position.set(Math.sin(az) * rh, y, -26 + Math.cos(az) * rh);
    } else {
      sunLight.position.set(...liveState.sunPos);
    }
    sunLight.color.copy(liveState.sunColor);
    sunLight.intensity = liveState.sunIntensity;

    if (syncSky) {
      const sx = sunLight.position.x;
      const sy = sunLight.position.y;
      const sz = sunLight.position.z;
      const sLen = Math.max(1e-4, Math.hypot(sx, sy, sz));
      updateEquirectSkyPixels(skyEquirect, liveState, [sx / sLen, sy / sLen, sz / sLen]);
      syncSkyBackgroundCube();
    }
    if (rebuildEnv) {
      rebuildEnvironmentFromSky();
    }

    if (scene.fog) {
      scene.fog.color.copy(liveState.fogColor);
      if (!preserveExistingFogDistances || !hadUpstreamFog) {
        if ('near' in scene.fog) scene.fog.near = liveState.fogNear;
        if ('far' in scene.fog) scene.fog.far = liveState.fogFar;
      }
    }

    hemiLight.color.copy(liveState.hemiSkyColor);
    hemiLight.groundColor.copy(liveState.hemiGroundColor);
    hemiLight.intensity = liveState.hemiIntensity;

    rimLight.position.set(...liveState.rimPos);
    rimLight.color.copy(liveState.rimColor);
    rimLight.intensity = liveState.rimIntensity;

    fillLight.position.set(...liveState.fillPos);
    fillLight.color.copy(liveState.fillColor);
    fillLight.intensity = liveState.fillIntensity;

    // Gate mosque lanterns smoothly across construction steps
    const gateHouseGate = smoothstep01((currentStep - 4.0) / 1.5);
    const courtyardGate = smoothstep01((currentStep - 2.6) / 1.2);
    const hallGate = smoothstep01((currentStep - 6.4) / 1.4);

    for (const pt of archPointLights) {
      pt.intensity = liveState.archPointIntensity * (0.25 + 0.75 * gateHouseGate);
    }
    for (const pt of floor1PointLights) {
      pt.intensity = liveState.floor1PointIntensity * courtyardGate;
    }
    for (const pt of floor2PointLights) {
      pt.intensity = liveState.floor2PointIntensity * hallGate;
    }
    pharePointLight.intensity = liveState.pharePointIntensity * gateHouseGate;
    phareSpotLight.intensity = 0.0;

    if (renderer) {
      renderer.toneMappingExposure = liveState.exposure;
    }
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = liveState.envIntensity;
    }
  }

  function snapshotLiveState() {
    return {
      exposure: liveState.exposure,
      envIntensity: liveState.envIntensity,
      skyZenith: [...liveState.skyZenith],
      skyMid: [...liveState.skyMid],
      skyHorizon: [...liveState.skyHorizon],
      skyNadir: [...liveState.skyNadir],
      sunGlowStrength: liveState.sunGlowStrength,
      fogColor: liveState.fogColor.clone(),
      fogNear: liveState.fogNear,
      fogFar: liveState.fogFar,
      sunPos: [...liveState.sunPos],
      sunColor: liveState.sunColor.clone(),
      sunIntensity: liveState.sunIntensity,
      hemiSkyColor: liveState.hemiSkyColor.clone(),
      hemiGroundColor: liveState.hemiGroundColor.clone(),
      hemiIntensity: liveState.hemiIntensity,
      rimPos: [...liveState.rimPos],
      rimColor: liveState.rimColor.clone(),
      rimIntensity: liveState.rimIntensity,
      fillPos: [...liveState.fillPos],
      fillColor: liveState.fillColor.clone(),
      fillIntensity: liveState.fillIntensity,
      archPointIntensity: liveState.archPointIntensity,
      floor1PointIntensity: liveState.floor1PointIntensity,
      floor2PointIntensity: liveState.floor2PointIntensity,
      pharePointIntensity: liveState.pharePointIntensity,
      phareSpotIntensity: liveState.phareSpotIntensity,
    };
  }

  function interpolateStates(tRaw) {
    const t = smoothstep01(tRaw);
    liveState.exposure = lerp(fromState.exposure, toState.exposure, t);
    liveState.envIntensity = lerp(fromState.envIntensity, toState.envIntensity, t);
    liveState.sunGlowStrength = lerp(fromState.sunGlowStrength, toState.sunGlowStrength, t);

    lerp3(liveState.skyZenith, fromState.skyZenith, toState.skyZenith, t);
    lerp3(liveState.skyMid, fromState.skyMid, toState.skyMid, t);
    lerp3(liveState.skyHorizon, fromState.skyHorizon, toState.skyHorizon, t);
    lerp3(liveState.skyNadir, fromState.skyNadir, toState.skyNadir, t);

    liveState.fogColor.copy(fromState.fogColor).lerp(toState.fogColor, t);
    liveState.fogNear = lerp(fromState.fogNear, toState.fogNear, t);
    liveState.fogFar = lerp(fromState.fogFar, toState.fogFar, t);

    lerp3(liveState.sunPos, fromState.sunPos, toState.sunPos, t);
    liveState.sunColor.copy(fromState.sunColor).lerp(toState.sunColor, t);
    liveState.sunIntensity = lerp(fromState.sunIntensity, toState.sunIntensity, t);

    liveState.hemiSkyColor.copy(fromState.hemiSkyColor).lerp(toState.hemiSkyColor, t);
    liveState.hemiGroundColor.copy(fromState.hemiGroundColor).lerp(toState.hemiGroundColor, t);
    liveState.hemiIntensity = lerp(fromState.hemiIntensity, toState.hemiIntensity, t);

    lerp3(liveState.rimPos, fromState.rimPos, toState.rimPos, t);
    liveState.rimColor.copy(fromState.rimColor).lerp(toState.rimColor, t);
    liveState.rimIntensity = lerp(fromState.rimIntensity, toState.rimIntensity, t);

    lerp3(liveState.fillPos, fromState.fillPos, toState.fillPos, t);
    liveState.fillColor.copy(fromState.fillColor).lerp(toState.fillColor, t);
    liveState.fillIntensity = lerp(fromState.fillIntensity, toState.fillIntensity, t);

    liveState.archPointIntensity = lerp(fromState.archPointIntensity, toState.archPointIntensity, t);
    liveState.floor1PointIntensity = lerp(fromState.floor1PointIntensity, toState.floor1PointIntensity, t);
    liveState.floor2PointIntensity = lerp(fromState.floor2PointIntensity, toState.floor2PointIntensity, t);
    liveState.pharePointIntensity = lerp(fromState.pharePointIntensity, toState.pharePointIntensity, t);
    liveState.phareSpotIntensity = 0.0;
  }

  function setMood(moodName, immediateOrOpts = false) {
    const immediate =
      typeof immediateOrOpts === 'boolean'
        ? immediateOrOpts
        : Boolean(immediateOrOpts?.immediate);
    const key = String(moodName || 'day').toLowerCase().trim();
    const nextMood = VALID_MOODS.includes(key) ? key : 'day';
    const wasAlreadySettledSameMood =
      nextMood === currentMood && transitionProgress >= 1.0 && Boolean(currentPmremRT);
    currentMood = nextMood;

    const targetPreset = ARCHIVAL_LIGHTING_PRESETS[nextMood];
    toState = cloneState(targetPreset);

    if (immediate) {
      fromState = cloneState(targetPreset);
      liveState = cloneState(targetPreset);
      transitionProgress = 1.0;
      applyLiveStateToScene({
        rebuildEnv: !wasAlreadySettledSameMood,
        syncSky: !wasAlreadySettledSameMood,
      });
      requestShadowUpdate();
    } else {
      fromState = snapshotLiveState();
      transitionProgress = 0.0;
    }
    return currentMood;
  }

  function setStep(stepVal) {
    const next = clamp(Number(stepVal) || 0, 0, 11);
    if (Math.abs(next - currentStep) > 1e-4) {
      currentStep = next;
      notifyConstructionActivity(0.25);
      applyLiveStateToScene({ rebuildEnv: false, syncSky: false });
    }
  }

  function setSunAngles(azimuthDeg, elevationDeg) {
    if (azimuthDeg === null || azimuthDeg === undefined) {
      sunAnglesOverride = null;
    } else {
      sunAnglesOverride = {
        azimuthDeg: clamp(Number(azimuthDeg) || 46, 0, 360),
        elevationDeg: clamp(Number(elevationDeg) || 42, 5, 78),
      };
    }
    applyLiveStateToScene({ rebuildEnv: true });
    requestShadowUpdate();
  }

  function getSunAngles() {
    if (sunAnglesOverride) return { ...sunAnglesOverride };
    if (currentMood === 'dusk') return { azimuthDeg: 52, elevationDeg: 19 };
    if (currentMood === 'night') return { azimuthDeg: 318, elevationDeg: 44 };
    return { azimuthDeg: 46, elevationDeg: 42 };
  }

  function getMood() {
    return currentMood;
  }

  function getNightFactor() {
    return 0.0;
  }

  function update(dt = 0) {
    const safeDt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.25);

    if (transitionProgress < 1.0) {
      transitionProgress = clamp(transitionProgress + safeDt / TRANSITION_DURATION_SEC, 0, 1);
      interpolateStates(transitionProgress);
      const finished = transitionProgress >= 1.0;
      applyLiveStateToScene({ rebuildEnv: finished });
      requestShadowUpdate();
    } else if (scene.fog && !scene.fog.color.equals(liveState.fogColor)) {
      scene.fog.color.copy(liveState.fogColor);
    }

    if (activeConstructionTimer > 0) {
      activeConstructionTimer = Math.max(0, activeConstructionTimer - safeDt);
      shadowAccumulator += safeDt;
      if (shadowAccumulator >= 1.0 / 15.0) {
        shadowAccumulator = 0.0;
        requestShadowUpdate();
      }
    } else {
      shadowAccumulator = 0.0;
    }
  }

  let shadowHelper = null;
  function setShadowHelperVisible(visible) {
    const show = Boolean(visible);
    if (show && !shadowHelper && sunLight.shadow?.camera) {
      shadowHelper = new THREE.CameraHelper(sunLight.shadow.camera);
      shadowHelper.name = 'debug_shadow_camera_helper';
      if (shadowHelper.material) {
        shadowHelper.material.color?.setHex(0x4b4238);
      }
      rigGroup.add(shadowHelper);
    }
    if (shadowHelper) {
      shadowHelper.visible = show;
      if (show) shadowHelper.update?.();
    }
  }

  applyLiveStateToScene({ rebuildEnv: true });
  requestShadowUpdate();

  return {
    group: rigGroup,
    sunLight,
    hemiLight,
    rimLight,
    fillLight,
    archPointLights,
    floor1PointLights,
    floor2PointLights,
    pharePointLight,
    phareSpotLight,
    skyTexture: skyEquirect.tex,
    setMood,
    getMood,
    isTransitioning: () => transitionProgress < 1.0,
    setStep,
    getNightFactor,
    setSunAngles,
    getSunAngles,
    setShadowHelperVisible,
    requestShadowUpdate,
    notifyConstructionActivity,
    auditZeroEmissive: (opts) => auditZeroEmissive(scene, opts),
    enforceZeroEmissive: () => enforceZeroEmissiveAcrossScene(scene),
    update,
  };
}

export const createAtmosphereController = createLightingRig;
