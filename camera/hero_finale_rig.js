/**
 * Stage 3 — Stop 8 Hero 3D Model Showcase & Craftsmanship Rig (`hero_finale_rig.js`)
 *
 * Highlights the craftsmanship of the Kashgar Id Kah Mosque 3D model across both
 * desktop (`1440×900`) and portrait mobile (`390×844`) viewports, with deterministic
 * `update(dtSec)` orbital motion and instant zero-jump user yield.
 *
 * Curated Vantages:
 *   1. `overview` — Id Kah Square & Full East Facade
 *   2. `gate_iwan` — Saffron-Ochre Gatehouse (Derwaza) & Pointed Iwan
 *   3. `twin_minarets` — Twin Tapering Brick Minarets & Kashi Tilework
 *   4. `courtyard_howz` — Shade Garden, Poplar Courtyard & Howz Pool
 *   5. `namazgah_pillars` — 140 Emerald-Green Pillars & Qibla Sanctuary
 */

import { flushOrbitControlsMomentum } from './viewport_constraints.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstepCubic(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Canonical Stop 8 Hero 3D Model Showcase Camera.
 */
export const HERO_FINALE_CAMERA = Object.freeze({
  position: Object.freeze([58.0, 22.0, 92.0]),
  target: Object.freeze([0.0, 7.0, 10.0]),
  fov: 42.0,
});

/**
 * Curated Desktop + Portrait-Mobile Showcase Presets highlighting the 5 signature
 * architectural zones of Kashgar Id Kah Mosque.
 */
export const HERO_SHOWCASE_PRESETS = Object.freeze({
  overview: Object.freeze({
    id: 'overview',
    desktop: Object.freeze({
      position: Object.freeze([58.0, 22.0, 92.0]),
      target: Object.freeze([0.0, 7.0, 10.0]),
      fov: 42.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([72.0, 26.0, 118.0]),
      target: Object.freeze([0.0, 5.0, 6.0]),
      fov: 52.0,
    }),
    motionMode: 'turntable',
    turntableAutoplayRadps: 0.038,
    turntableIdleRadps: 0.014,
  }),

  gate_iwan: Object.freeze({
    id: 'gate_iwan',
    desktop: Object.freeze({
      position: Object.freeze([24.0, 9.5, 56.0]),
      target: Object.freeze([-1.5, 8.5, 25.5]),
      fov: 38.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([30.0, 10.0, 66.0]),
      target: Object.freeze([0.0, 7.5, 25.5]),
      fov: 48.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.04,
    swayElevM: 0.35,
    swayPeriodSec: 18.0,
  }),

  twin_minarets: Object.freeze({
    id: 'twin_minarets',
    desktop: Object.freeze({
      position: Object.freeze([38.0, 16.0, 52.0]),
      target: Object.freeze([4.0, 14.0, 25.4]),
      fov: 38.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([44.0, 17.0, 64.0]),
      target: Object.freeze([0.0, 12.0, 25.4]),
      fov: 48.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.042,
    swayElevM: 0.4,
    swayPeriodSec: 19.0,
  }),

  courtyard_howz: Object.freeze({
    id: 'courtyard_howz',
    desktop: Object.freeze({
      position: Object.freeze([28.0, 12.0, 8.0]),
      target: Object.freeze([-4.0, 2.5, -18.0]),
      fov: 40.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([34.0, 14.0, 14.0]),
      target: Object.freeze([0.0, 2.0, -18.0]),
      fov: 50.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.042,
    swayElevM: 0.35,
    swayPeriodSec: 20.0,
  }),

  namazgah_pillars: Object.freeze({
    id: 'namazgah_pillars',
    desktop: Object.freeze({
      position: Object.freeze([14.0, 4.2, -38.0]),
      target: Object.freeze([-6.0, 3.6, -68.0]),
      fov: 42.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([18.0, 4.8, -34.0]),
      target: Object.freeze([0.0, 3.2, -68.0]),
      fov: 52.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.036,
    swayElevM: 0.25,
    swayPeriodSec: 17.0,
  }),
});

/**
 * Resolves the responsive `(position, target, fov)` pose for a Stop 8 preset ID.
 */
export function resolveResponsiveHeroPose(presetId = 'overview', vpWidth = 1440, vpHeight = 900) {
  const key = String(presetId || 'overview').trim();
  const spec = HERO_SHOWCASE_PRESETS[key] || HERO_SHOWCASE_PRESETS.overview;
  const aspect = Math.max(1, Number(vpWidth) || 1440) / Math.max(1, Number(vpHeight) || 900);
  const usePortrait = aspect < 0.80;
  const variant = usePortrait ? spec.portrait : spec.desktop;

  return {
    presetId: spec.id,
    isPortrait: usePortrait,
    position: [...variant.position],
    target: [...variant.target],
    fov: variant.fov,
    motionMode: spec.motionMode,
  };
}

export function createHeroFinaleRig({
  THREE,
  camera,
  controls,
  viewportConstraints = null,
  idleResumeDelaySec = 5.0,
  ambientMotionEnabled = true,
} = {}) {
  const tmpOffset = new THREE.Vector3();
  const tmpSpherical = new THREE.Spherical();

  let active = false;
  let activePresetId = 'overview';
  let ambientEnabled = Boolean(ambientMotionEnabled);
  let userInteracting = false;
  let idleSinceInputSec = idleResumeDelaySec;
  let swayPhaseSec = 0;
  let lastSwayThetaOffset = 0;
  let lastSwayYOffset = 0;

  function notifyUserInputStart() {
    userInteracting = true;
    idleSinceInputSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
  }

  function notifyUserInputEnd() {
    userInteracting = false;
    idleSinceInputSec = 0;
  }

  function activatePreset(presetId = 'overview', vpWidth = 1440, vpHeight = 900) {
    active = true;
    activePresetId = HERO_SHOWCASE_PRESETS[presetId] ? presetId : 'overview';
    userInteracting = false;
    idleSinceInputSec = idleResumeDelaySec;
    swayPhaseSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
    return resolveResponsiveHeroPose(activePresetId, vpWidth, vpHeight);
  }

  function deactivate() {
    active = false;
    swayPhaseSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
  }

  function setAmbientMotionEnabled(enabled) {
    ambientEnabled = Boolean(enabled);
  }

  function getActivePresetId() {
    return activePresetId;
  }

  function isActive() {
    return active;
  }

  function hasActiveAmbientMotion() {
    return Boolean(active && ambientEnabled && !userInteracting && idleSinceInputSec >= idleResumeDelaySec * 0.8);
  }

  function update(dtSec, { isAutoplayFinaleBeat = false, isCameraFlying = false, speedMultiplier = 1.0 } = {}) {
    if (!active || !ambientEnabled || isCameraFlying || !camera || !controls) {
      return false;
    }

    const dt = clamp(Number(dtSec) || 0, 0, 0.15);
    if (dt <= 0) return false;

    if (userInteracting) {
      return false;
    }

    idleSinceInputSec += dt;

    const spec = HERO_SHOWCASE_PRESETS[activePresetId] || HERO_SHOWCASE_PRESETS.overview;

    const rampWeight = isAutoplayFinaleBeat
      ? 1.0
      : smoothstepCubic((idleSinceInputSec - idleResumeDelaySec) / 1.8);

    if (rampWeight <= 1e-4) {
      return false;
    }

    if (spec.motionMode === 'turntable') {
      const rate = isAutoplayFinaleBeat
        ? spec.turntableAutoplayRadps * clamp(speedMultiplier, 0.2, 4.0)
        : spec.turntableIdleRadps;
      const dTheta = dt * rate * rampWeight;

      tmpOffset.copy(camera.position).sub(controls.target);
      const cosA = Math.cos(dTheta);
      const sinA = Math.sin(dTheta);
      const nx = tmpOffset.x * cosA + tmpOffset.z * sinA;
      const nz = -tmpOffset.x * sinA + tmpOffset.z * cosA;
      camera.position.set(controls.target.x + nx, camera.position.y, controls.target.z + nz);
      camera.lookAt(controls.target);
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      if (viewportConstraints) {
        viewportConstraints.enforce();
      }
      return true;
    }

    if (spec.motionMode === 'parallax_sway') {
      swayPhaseSec += dt * rampWeight;
      const omega = (2.0 * Math.PI) / Math.max(4.0, spec.swayPeriodSec || 18.0);
      const nextThetaOff = (spec.swayAzimuthRad || 0.04) * Math.sin(omega * swayPhaseSec);
      const nextYOff = (spec.swayElevM || 0.35) * (1.0 - Math.cos(omega * swayPhaseSec)) * 0.5;

      const dTheta = nextThetaOff - lastSwayThetaOffset;
      const dY = nextYOff - lastSwayYOffset;
      lastSwayThetaOffset = nextThetaOff;
      lastSwayYOffset = nextYOff;

      tmpOffset.copy(camera.position).sub(controls.target);
      tmpSpherical.setFromVector3(tmpOffset);
      tmpSpherical.theta += dTheta;
      tmpOffset.setFromSpherical(tmpSpherical);

      camera.position.copy(controls.target).add(tmpOffset);
      camera.position.y += dY;
      camera.lookAt(controls.target);
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      if (viewportConstraints) {
        viewportConstraints.enforce();
      }
      return true;
    }

    return false;
  }

  function resetDeterministic() {
    userInteracting = false;
    idleSinceInputSec = idleResumeDelaySec;
    swayPhaseSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
  }

  return {
    activate: ({ presetId = 'overview', vpWidth = 1440, vpHeight = 900 } = {}) =>
      activatePreset(presetId, vpWidth, vpHeight),
    activatePreset,
    deactivate,
    update,
    resetDeterministic,
    notifyUserInputStart,
    notifyUserInputEnd,
    setAmbientMotionEnabled,
    getActivePresetId,
    isActive,
    hasActiveAmbientMotion,
    resolvePose: resolveResponsiveHeroPose,
  };
}
