/**
 * Unified Walkthrough Camera & Step Choreography (`walkthrough_camera_choreography.js`)
 *
 * Bridges `OpticalCameraRig`, `ViewportConstraints`, `HeroFinaleRig`, and `PhotoPortalSystem`
 * with the 8-stop Kashgar Id Kah Mosque exhibition sequence (`Stops 1..7 = architectural_stage`
 * with curated `cameraPose`, `Stop 8 = hero_3d_model_finale` with 5 showcase presets).
 */

import {
  createHeroFinaleRig,
  resolveResponsiveHeroPose,
  HERO_FINALE_CAMERA,
  HERO_SHOWCASE_PRESETS,
} from './hero_finale_rig.js';

import {
  runAdversarialConstraintFuzz,
  flushOrbitControlsMomentum,
} from './viewport_constraints.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstepCubic(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function easeInteractiveStep(u) {
  const x = clamp(u, 0, 1);
  if (x <= 0 || x >= 1) return x;
  const collar = 0.14;
  const m = 1.0 / (1.0 - collar);
  let ramp;
  if (x < collar) {
    ramp = (m * x * x) / (2.0 * collar);
  } else if (x > 1.0 - collar) {
    const dx = 1.0 - x;
    ramp = 1.0 - (m * dx * dx) / (2.0 * collar);
  } else {
    ramp = m * (x - 0.5 * collar);
  }
  return clamp(0.70 * ramp + 0.30 * smoothstepCubic(x), 0, 1);
}

/**
 * Evaluates a curated exterior Mosque-framing pose `(position, target, fov)` along the
 * continuous walkthrough rail parameter `tau in [0 .. 7]` during interactive scrubbing.
 */
export function evaluateScrubExteriorPose(tau, vpWidth = 1440, vpHeight = 900, maxTau = 7.0) {
  const denom = Math.max(1.0, Number(maxTau) || 7.0);
  const u = clamp((Number(tau) || 0) / denom, 0, 1);
  const s = smoothstepCubic(u);
  const aspect = Math.max(1, vpWidth) / Math.max(1, vpHeight);
  const isPortrait = aspect < 0.80;

  if (isPortrait) {
    return {
      position: [
        lerp(42.0, 72.0, s),
        lerp(18.0, 26.0, s),
        lerp(36.0, 118.0, s),
      ],
      target: [0.0, lerp(3.0, 5.0, s), lerp(-22.0, 6.0, s)],
      fov: lerp(48.0, 52.0, s),
    };
  }

  return {
    position: [
      lerp(36.0, 58.0, s),
      lerp(14.0, 22.0, s),
      lerp(28.0, 92.0, s),
    ],
    target: [0.0, lerp(3.5, 7.0, s), lerp(-22.0, 10.0, s)],
    fov: 42.0,
  };
}

export function installStage3CameraChoreography({
  THREE,
  app,
  camera,
  controls,
  canvas,
  portalSystem,
  viewportConstraints,
  walkthrough,
  placard,
} = {}) {
  if (!THREE || !app || !camera || !controls || !portalSystem || !viewportConstraints || !walkthrough) {
    throw new Error('installStage3CameraChoreography requires core scene/UI systems');
  }

  portalSystem.setViewportConstraints?.(viewportConstraints);
  portalSystem.setTowerController?.(app.towerController || null);
  portalSystem.setAllowCanvasDragExit?.(true);

  if (app.scene && !app.scene.__s5TelephotoFogHooked) {
    const targetScene = app.scene;
    targetScene.__s5TelephotoFogHooked = true;
    const prevBefore = targetScene.onBeforeRender;

    targetScene.onBeforeRender = function s5TelephotoBeforeRender(
      renderer,
      scn,
      cam,
      geometry,
      material,
      group
    ) {
      portalSystem.syncPortalCutaway?.();
      if (typeof prevBefore === 'function') {
        prevBefore.call(this, renderer, scn, cam, geometry, material, group);
      }
    };
  }

  const heroFinaleRig = createHeroFinaleRig({
    THREE,
    camera,
    controls,
    viewportConstraints,
    idleResumeDelaySec: 4.8,
    ambientMotionEnabled: true,
  });

  let interactiveStepGlide = null;
  const scrubState = {
    active: false,
    anchorTau: 0,
    releasedPortal: false,
    desiredPose: null,
  };

  let lastViewportPortrait =
    (typeof window !== 'undefined' ? window.innerWidth : 1440) /
      Math.max(1, typeof window !== 'undefined' ? window.innerHeight : 900) <
    0.80;

  if (canvas) {
    const onInputStart = () => {
      heroFinaleRig.notifyUserInputStart();
    };
    const onInputEnd = () => {
      heroFinaleRig.notifyUserInputEnd();
    };
    canvas.addEventListener('pointerdown', onInputStart, { passive: true });
    canvas.addEventListener('touchstart', onInputStart, { passive: true });
    canvas.addEventListener('wheel', () => {
      heroFinaleRig.notifyUserInputStart();
      heroFinaleRig.notifyUserInputEnd();
    }, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', onInputEnd, { passive: true });
      window.addEventListener('pointercancel', onInputEnd, { passive: true });
      window.addEventListener('touchend', onInputEnd, { passive: true });
    }
  }

  heroFinaleRig.flyToPreset = (
    presetId = 'overview',
    { duration = 1.25, immediate = false } = {}
  ) => {
    walkthrough.pause();
    interactiveStepGlide = null;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const pose = heroFinaleRig.activatePreset(presetId, vw, vh);
    placard?.setActiveHeroPreset?.(pose.presetId);

    return app.setCameraPose({
      position: pose.position,
      target: pose.target,
      fov: pose.fov,
      duration,
      immediate,
    });
  };

  if (placard) {
    placard.onSelectHeroPreset = (preset) => {
      if (!preset) return;
      const presetId = preset.presetId || preset.id || 'overview';
      heroFinaleRig.flyToPreset(presetId, { duration: 1.25, immediate: false });
    };
  }

  walkthrough._activateHeroFinale = async function stage3ActivateHeroFinale({
    immediate = false,
    duration = undefined,
    presetId = 'overview',
  } = {}) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const pose = heroFinaleRig.activatePreset(presetId, vw, vh);
    placard?.setActiveHeroPreset?.(pose.presetId);

    await app.setCameraPose({
      position: pose.position,
      target: pose.target,
      fov: pose.fov,
      duration: duration ?? 1.45,
      immediate,
    });

    if (this.onHeroFinaleActivate) {
      this.onHeroFinaleActivate({
        presetId: pose.presetId,
        cameraPose: {
          position: [...pose.position],
          target: [...pose.target],
          fov: pose.fov,
        },
        immediate,
      });
    }
  };

  const origWalkthroughGoToStop = walkthrough.goToStop.bind(walkthrough);

  walkthrough.goToStop = async function stage3GoToStop(
    stopIndexOrId,
    { immediate = false, reason = 'programmatic', keepLanding = false } = {}
  ) {
    scrubState.active = false;
    scrubState.desiredPose = null;

    if (this._landingMode && !keepLanding && !(immediate && reason === 'boot')) {
      this.setLandingMode(false);
    }

    const nextIdx = this.resolveStopIndex(stopIndexOrId);
    const nextStop = this._stops[nextIdx];
    if (!nextStop) {
      return origWalkthroughGoToStop(stopIndexOrId, { immediate, reason, keepLanding });
    }

    const isHeroFinale = nextStop.kind === 'hero_3d_model_finale';
    if (!isHeroFinale && !keepLanding) {
      heroFinaleRig.deactivate();
    }

    if (immediate || this._isPlaying) {
      interactiveStepGlide = null;
      const res = await origWalkthroughGoToStop(stopIndexOrId, { immediate, reason, keepLanding });
      portalSystem.syncPortalCutaway?.();
      return res;
    }

    const navToken = (this._navSeq = (this._navSeq || 0) + 1);

    const prevIdx = this._stopIndex;
    const startStep = Number.isFinite(app.getStep?.()) ? app.getStep() : this._step;
    const targetStep = nextStop.calibratedStep;
    const stepDelta = Math.abs(targetStep - startStep);

    let destPos = nextStop.cameraPose?.position || HERO_FINALE_CAMERA.position;
    if (nextStop.photoId) {
      const pEntry =
        portalSystem.getPortalById?.(nextStop.photoId)?.camEntry ||
        portalSystem.getCatalog?.()?.[nextStop.photoId];
      if (pEntry?.position_xyz_m) destPos = pEntry.position_xyz_m;
    }

    const chordDistM = Math.hypot(
      destPos[0] - camera.position.x,
      destPos[1] - camera.position.y,
      destPos[2] - camera.position.z
    );
    const flightDurSec = clamp(1.25 + chordDistM * 0.012 + stepDelta * 0.14, 1.35, 2.8);

    this._stopIndex = nextIdx;
    this._fromStopIndex = prevIdx;
    this._toStopIndex = nextIdx;
    this._tau = nextIdx;
    this._isRevealing3D = false;
    this._revealAnimActive = false;
    this._isFinished = false;
    this._beat = 'idle';
    this._beatTimer = 0;

    this._plateOpacity = nextStop.photoId ? 1.0 : 0.0;
    this._targetPlateOpacity = this._plateOpacity;
    this._placardOpacity = 1.0;

    if (stepDelta > 1e-3) {
      interactiveStepGlide = {
        startStep,
        targetStep,
        stopIndex: nextIdx,
        elapsed: 0,
        duration: flightDurSec * 0.92,
      };
    } else {
      interactiveStepGlide = null;
      this._step = targetStep;
      this._emitStep(targetStep, { stopIndex: nextIdx, beat: 'settled', progress: 1.0 });
    }

    this._emitPlacardOpacity(1.0, nextIdx);
    this._syncBarDom();

    if (this.onStopChange) {
      this.onStopChange({
        stopIndex: nextIdx,
        stopNumber: nextIdx + 1,
        stop: nextStop,
        tau: this._tau,
        step: targetStep,
        immediate: false,
        reason,
      });
    }

    if (isHeroFinale) {
      await this._activateHeroFinale({
        immediate: false,
        duration: flightDurSec,
        presetId: 'overview',
      });
    } else if (nextStop.photoId) {
      const lockPromise = this._applyPortalLock(nextStop.photoId, {
        plateOpacity: 1.0,
        immediate: false,
        duration: flightDurSec,
        beat: 'settled',
      });
      placard?.updatePlateRect?.(portalSystem.getOverlayRect());
      await lockPromise;
    } else {
      const pose = nextStop.cameraPose || HERO_FINALE_CAMERA;
      await app.setCameraPose({
        position: pose.position,
        target: pose.target,
        fov: pose.fov ?? 42.0,
        duration: flightDurSec,
        immediate: false,
      });
    }

    if (navToken !== this._navSeq) {
      return this.getActiveStop();
    }

    interactiveStepGlide = null;
    this._step = targetStep;
    this._emitStep(targetStep, { stopIndex: nextIdx, beat: 'settled', progress: 1.0 });
    placard?.updatePlateRect?.(portalSystem.getOverlayRect());
    this._syncBarDom();
    app.requestFrame?.(3);
    return nextStop;
  };

  const origSetTau = walkthrough.setTau.bind(walkthrough);

  walkthrough.setTau = function stage3SetTau(tau, opts = {}) {
    const scrubbing = Boolean(opts?.scrubbing);
    if (!scrubbing) {
      scrubState.active = false;
      scrubState.desiredPose = null;
      return origSetTau(tau, opts);
    }

    interactiveStepGlide = null;
    heroFinaleRig.deactivate();

    if (!scrubState.active) {
      scrubState.active = true;
      scrubState.anchorTau = this._tau;
      scrubState.releasedPortal = false;
    }

    const resTau = origSetTau(tau, opts);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

    if (!scrubState.releasedPortal && Math.abs(resTau - scrubState.anchorTau) > 0.08) {
      scrubState.releasedPortal = true;
      if (portalSystem.getActivePortalId() || portalSystem.isFlying()) {
        portalSystem.exitPortal({
          keepPinnedIn3D: false,
          reason: 'rail-scrub',
          immediate: false,
        });
      }
      placard?.set3DRevealState?.(true);
    }

    if (scrubState.releasedPortal) {
      const maxTau = Math.max(1, (this._stops?.length || 8) - 1);
      scrubState.desiredPose = evaluateScrubExteriorPose(resTau, vw, vh, maxTau);
    }

    app.requestFrame?.(3);
    return resTau;
  };

  const origHasActiveMotion = walkthrough.hasActiveMotion.bind(walkthrough);
  walkthrough.hasActiveMotion = function stage3HasActiveMotion() {
    return (
      origHasActiveMotion() ||
      Boolean(interactiveStepGlide) ||
      Boolean(scrubState.active && scrubState.desiredPose) ||
      portalSystem.hasActiveVisualTransition() ||
      heroFinaleRig.hasActiveAmbientMotion()
    );
  };

  function update(dtSec) {
    const safeDt = clamp(Number(dtSec) || 0, 0, 0.25);

    if (interactiveStepGlide && safeDt > 0) {
      interactiveStepGlide.elapsed += safeDt;
      const u = clamp(interactiveStepGlide.elapsed / interactiveStepGlide.duration, 0, 1);
      const eased = easeInteractiveStep(u);
      const nextStep = lerp(
        interactiveStepGlide.startStep,
        interactiveStepGlide.targetStep,
        eased
      );
      walkthrough._step = nextStep;
      walkthrough._emitStep(nextStep, {
        stopIndex: interactiveStepGlide.stopIndex,
        beat: 'interactive_flight',
        progress: eased,
      });
      if (u >= 1.0) {
        interactiveStepGlide = null;
      }
    }

    if (
      scrubState.active &&
      scrubState.desiredPose &&
      !portalSystem.getActivePortalId() &&
      !portalSystem.getOpticalRig().isReleasing() &&
      safeDt > 0
    ) {
      const alpha = 1.0 - Math.exp(-safeDt * 6.5);
      const dp = scrubState.desiredPose;
      camera.position.x = lerp(camera.position.x, dp.position[0], alpha);
      camera.position.y = lerp(camera.position.y, dp.position[1], alpha);
      camera.position.z = lerp(camera.position.z, dp.position[2], alpha);
      controls.target.x = lerp(controls.target.x, dp.target[0], alpha);
      controls.target.y = lerp(controls.target.y, dp.target[1], alpha);
      controls.target.z = lerp(controls.target.z, dp.target[2], alpha);
      camera.fov = lerp(camera.fov, dp.fov, alpha);
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      viewportConstraints.enforce();
    }

    const playState = walkthrough.getPlaythroughState();
    const activeStop = walkthrough.getActiveStop?.();
    const inLandingMode = Boolean(app.isLandingMode?.());
    const onHero3D = Boolean(
      inLandingMode || activeStop?.kind === 'hero_3d_model_finale'
    );
    if (
      onHero3D &&
      !heroFinaleRig.isActive() &&
      !portalSystem.getActivePortalId() &&
      !portalSystem.isFlying()
    ) {
      heroFinaleRig.activatePreset(
        'overview',
        typeof window !== 'undefined' ? window.innerWidth : 1440,
        typeof window !== 'undefined' ? window.innerHeight : 900
      );
    } else if (!onHero3D && heroFinaleRig.isActive()) {
      heroFinaleRig.deactivate();
    }

    if (
      heroFinaleRig.isActive() &&
      !portalSystem.getActivePortalId() &&
      !portalSystem.isFlying()
    ) {
      heroFinaleRig.update(safeDt, {
        isAutoplayFinaleBeat:
          playState.beat === 'finale_orbit' ||
          (onHero3D && !inLandingMode && playState.isPlaying && playState.beat === 'hold_d'),
        isCameraFlying: portalSystem.isFlying(),
        speedMultiplier: walkthrough.isPlaying() ? walkthrough.getSpeedMultiplier() : 1.0,
      });
    }
  }

  function onResize(width, height) {
    const w = Math.max(1, Number(width) || 1440);
    const h = Math.max(1, Number(height) || 900);
    const nowPortrait = w / h < 0.80;

    if (
      nowPortrait !== lastViewportPortrait &&
      heroFinaleRig.isActive() &&
      !portalSystem.getActivePortalId() &&
      !portalSystem.isFlying()
    ) {
      const pose = resolveResponsiveHeroPose(heroFinaleRig.getActivePresetId(), w, h);
      camera.clearViewOffset();
      camera.position.set(...pose.position);
      controls.target.set(...pose.target);
      camera.fov = pose.fov;
      camera.aspect = w / h;
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      const prevDamp = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = prevDamp;
      viewportConstraints.enforce();
    }

    lastViewportPortrait = nowPortrait;
  }

  const rigRef = portalSystem.getOpticalRig();
  const origResetDet = rigRef.resetDeterministic?.bind(rigRef);
  rigRef.resetDeterministic = () => {
    origResetDet?.();
    heroFinaleRig.resetDeterministic?.();
  };

  app.opticalRig = rigRef;
  app.heroFinaleRig = heroFinaleRig;
  app.cameraChoreography = {
    heroFinaleRig,
    opticalRig: rigRef,
    update,
    onResize,
    hasUrgentMotion: () => Boolean(interactiveStepGlide || scrubState.active),
    hasActiveMotion: () =>
      Boolean(interactiveStepGlide || scrubState.active || heroFinaleRig.hasActiveAmbientMotion()),
  };

  app.constraintFuzzTest = (iterations = 1500) =>
    runAdversarialConstraintFuzz({
      THREE,
      camera,
      controls,
      constraints: viewportConstraints,
      iterations,
    });

  app.getCameraMotionTelemetry = () => portalSystem.getOpticalRig().getTelemetry();
  app.resetCameraMotionTelemetry = () => portalSystem.getOpticalRig().resetTelemetry();

  app.auditCameraAndViewport = ({ fuzzIterations = 1200 } = {}) => {
    const portals = portalSystem.verifyAllPortalsProjection();
    const meanRmsePx =
      portals.length > 0
        ? portals.reduce((acc, r) => acc + r.rmseVsObservedPx, 0) / portals.length
        : 0;
    const motion = portalSystem.getOpticalRig().getTelemetry();
    const fuzz = runAdversarialConstraintFuzz({
      THREE,
      camera,
      controls,
      constraints: viewportConstraints,
      iterations: fuzzIterations,
    });

    return {
      pnpAlignment: {
        portalCount: portals.length,
        meanRmsePx: Number(meanRmsePx.toFixed(4)),
        passed: portals.length === 0 || meanRmsePx <= 1.85,
        portals,
      },
      motionContinuity: motion,
      viewportConstraintsFuzz: fuzz,
      heroFinaleState: {
        active: heroFinaleRig.isActive(),
        activePresetId: heroFinaleRig.getActivePresetId(),
        presetsAvailable: Object.keys(HERO_SHOWCASE_PRESETS),
      },
    };
  };

  return app.cameraChoreography;
}
