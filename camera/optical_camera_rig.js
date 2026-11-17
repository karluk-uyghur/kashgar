/**
 * Unified Zero-Jump Optical Camera Rig & Helical Flight Planner (`optical_camera_rig.js`)
 *
 * Provides C² smooth architectural camera flights (`easeCameraFlight`), velocity-matched
 * interruption carry-over, and zero-jump transitions between Id Kah Mosque vantages and
 * free orbit controls.
 */

import {
  localGroundElevation,
  minAllowedCameraY,
  computeStructuralClearanceM,
  repelPointFromTowerStructure,
  repelPointFromExpositionObstacles,
  flushOrbitControlsMomentum,
} from './viewport_constraints.js';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstepQuintic(t) {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function smoothstepQuinticDeriv(t) {
  const x = clamp(t, 0, 1);
  if (x <= 0 || x >= 1) return 0;
  return 30 * x * x * (x - 1) * (x - 1);
}

export function easeCameraFlight(t) {
  const x = clamp(t, 0, 1);
  if (x <= 0 || x >= 1) return x;
  const c = 0.28;
  const m = 1.0 / (1.0 - c);
  let collarRamp;
  if (x < c) {
    const u = x / c;
    collarRamp = m * c * u * u * u * (1.0 - 0.5 * u);
  } else if (x > 1.0 - c) {
    const w = (1.0 - x) / c;
    collarRamp = 1.0 - m * c * w * w * w * (1.0 - 0.5 * w);
  } else {
    collarRamp = m * (x - 0.5 * c);
  }
  return clamp(0.85 * collarRamp + 0.15 * smoothstepQuintic(x), 0, 1);
}

export function easeCameraFlightDeriv(t) {
  const x = clamp(t, 0, 1);
  if (x <= 0 || x >= 1) return 0;
  const c = 0.28;
  const m = 1.0 / (1.0 - c);
  let collarDeriv;
  if (x < c) {
    const u = x / c;
    collarDeriv = m * u * u * (3.0 - 2.0 * u);
  } else if (x > 1.0 - c) {
    const w = (1.0 - x) / c;
    collarDeriv = m * w * w * (3.0 - 2.0 * w);
  } else {
    collarDeriv = m;
  }
  return 0.85 * collarDeriv + 0.15 * smoothstepQuinticDeriv(x);
}

function shortestAngleDelta(fromRad, toRad) {
  let d = (toRad - fromRad) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Computes a natural focal distance `lambda` along world ray `(origin, dir)` closest to the
 * Kashgar Id Kah Mosque anchor `(0, y, -20)`.
 */
export function computeRayTowerAnchorDistance(originArr, dirArr) {
  const [ox, , oz] = originArr;
  const [dx, , dz] = dirArr;
  const relOx = ox;
  const relOz = oz + 20.0;
  const horizSq = dx * dx + dz * dz;
  const rOrigin = Math.hypot(relOx, relOz);

  if (horizSq > 1e-4) {
    const tAxis = -(relOx * dx + relOz * dz) / horizSq;
    if (tAxis > 8.0 && tAxis < 240.0) {
      return clamp(tAxis, 8.0, 240.0);
    }
  }

  return clamp(rOrigin > 10.0 ? rOrigin : 48.0, 8.0, 240.0);
}

/**
 * Reference 3D Id Kah Mosque structural landmarks used to measure optical screen-space continuity.
 */
export const CONTINUITY_PROBE_LANDMARKS_M = Object.freeze([
  [-16.8, 20.8, 25.4], // North Minaret finial
  [16.8, 20.8, 25.4],  // South Minaret finial
  [0.0, 14.0, 26.8],   // East Gatehouse Pishtaq crown
  [0.0, 0.5, -16.0],   // Courtyard Howz ablution basin center
  [-25.0, 6.8, -64.0], // Namazgah north column hall bay
  [25.0, 6.8, -64.0],  // Namazgah south column hall bay
  [0.0, 4.0, -85.0],   // West Qibla Mihrab niche
]);

export class OpticalCameraRig {
  constructor({ THREE, camera, controls = null, viewportConstraints = null } = {}) {
    if (!THREE) throw new Error('OpticalCameraRig requires THREE');
    if (!camera) throw new Error('OpticalCameraRig requires camera');

    this.THREE = THREE;
    this.camera = camera;
    this.controls = controls;
    this.viewportConstraints = viewportConstraints;

    this._flight = null;
    this._release = null;

    this._velPos = [0, 0, 0];
    this._velFocal = [0, 0, 0];
    this._velTanHalfY = 0;
    this._velShiftX = 0;
    this._velShiftY = 0;
    this._angSpeedRadps = 0;

    this._prevSamplePos = null;
    this._prevSampleFocal = null;
    this._prevSampleQuat = new THREE.Quaternion();
    this._prevLinearSpeed = 0;

    this._tmpVecA = new THREE.Vector3();
    this._tmpVecB = new THREE.Vector3();
    this._tmpVecC = new THREE.Vector3();
    this._tmpUp = new THREE.Vector3(0, 1, 0);
    this._tmpZNeg = new THREE.Vector3(0, 0, -1);
    this._tmpMat4 = new THREE.Matrix4();
    this._tmpQuatLook = new THREE.Quaternion();
    this._tmpQuatCorr = new THREE.Quaternion();
    this._tmpQuatAim = new THREE.Quaternion();
    this._tmpQuatRoll = new THREE.Quaternion();
    this._tmpQuatA = new THREE.Quaternion();
    this._tmpQuatB = new THREE.Quaternion();
    this._tmpSpherical = new THREE.Spherical();

    this._telemetry = {
      transitionCount: 0,
      lastTransitionKind: 'none',
      lastOnsetJumpPx: 0,
      maxOnsetJumpPx: 0,
      lastLockSnapPx: 0,
      maxLockSnapPx: 0,
      maxFrameStepPx: 0,
      linearSpeedMps: 0,
      maxLinearSpeedMps: 0,
      angularSpeedRadps: 0,
      maxAngularSpeedRadps: 0,
      maxLinearAccelJumpMps: 0,
      minFlightCamY: Infinity,
      minFlightGroundClearanceM: Infinity,
      minFlightStructuralClearanceM: Infinity,
      minExteriorFlightStructuralClearanceM: Infinity,
      interruptionCount: 0,
      history: [],
    };
  }

  setViewportConstraints(vc) {
    this.viewportConstraints = vc || null;
  }

  isFlying() {
    return Boolean(this._flight);
  }

  isReleasing() {
    return Boolean(this._release);
  }

  isActive() {
    return Boolean(this._flight || this._release);
  }

  resetTelemetry() {
    this._telemetry = {
      transitionCount: 0,
      lastTransitionKind: 'none',
      lastOnsetJumpPx: 0,
      maxOnsetJumpPx: 0,
      lastLockSnapPx: 0,
      maxLockSnapPx: 0,
      maxFrameStepPx: 0,
      linearSpeedMps: 0,
      maxLinearSpeedMps: 0,
      angularSpeedRadps: 0,
      maxAngularSpeedRadps: 0,
      maxLinearAccelJumpMps: 0,
      minFlightCamY: Infinity,
      minFlightGroundClearanceM: Infinity,
      minFlightStructuralClearanceM: Infinity,
      minExteriorFlightStructuralClearanceM: Infinity,
      interruptionCount: 0,
      history: [],
    };
  }

  resetDeterministic() {
    this.cancel();
    this.resetTelemetry();
  }

  getTelemetry() {
    return {
      ...this._telemetry,
      isFlying: this.isFlying(),
      isReleasing: this.isReleasing(),
      history: this._telemetry.history.slice(-24),
    };
  }

  captureLandmarkScreenPositions(vpWidth, vpHeight) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    this.camera.updateMatrixWorld(true);
    this.camera.updateProjectionMatrix();

    const out = [];
    for (let i = 0; i < CONTINUITY_PROBE_LANDMARKS_M.length; i++) {
      const [wx, wy, wz] = CONTINUITY_PROBE_LANDMARKS_M[i];
      this._tmpVecA.set(wx, wy, wz).applyMatrix4(this.camera.matrixWorldInverse);
      if (this._tmpVecA.z > -1.5) {
        out.push(null);
        continue;
      }
      this._tmpVecB.set(wx, wy, wz).project(this.camera);
      const sx = (this._tmpVecB.x * 0.5 + 0.5) * W;
      const sy = (0.5 - this._tmpVecB.y * 0.5) * H;
      if (sx < -0.5 * W || sx > 1.5 * W || sy < -0.5 * H || sy > 1.5 * H) {
        out.push(null);
        continue;
      }
      out.push([sx, sy]);
    }
    return out;
  }

  measureMaxLandmarkJumpPx(snapA, snapB) {
    if (!snapA || !snapB) return 0;
    let maxPx = 0;
    const n = Math.min(snapA.length, snapB.length);
    for (let i = 0; i < n; i++) {
      const a = snapA[i];
      const b = snapB[i];
      if (!a || !b) continue;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d > maxPx) maxPx = d;
    }
    return maxPx;
  }

  extractLiveCanonicalState(vpWidth, vpHeight) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    if (!this.camera.view || !this.camera.view.enabled) {
      this.camera.aspect = aspect;
    }
    this.camera.updateMatrixWorld(true);
    this.camera.updateProjectionMatrix();

    const e = this.camera.projectionMatrix.elements;
    const tanHalfY = 1.0 / Math.max(1e-7, Math.abs(e[5]));
    const tanHalfX = 1.0 / Math.max(1e-7, Math.abs(e[0]));
    const shiftX = e[8];
    const shiftY = e[9];

    const position = [this.camera.position.x, this.camera.position.y, this.camera.position.z];
    const quaternion = [
      this.camera.quaternion.x,
      this.camera.quaternion.y,
      this.camera.quaternion.z,
      this.camera.quaternion.w,
    ];

    this._tmpVecA.set(shiftX * tanHalfX, shiftY * tanHalfY, -1.0).normalize();
    this._tmpVecB.copy(this._tmpVecA).applyQuaternion(this.camera.quaternion).normalize();
    const rayDir = [this._tmpVecB.x, this._tmpVecB.y, this._tmpVecB.z];
    const lambda = computeRayTowerAnchorDistance(position, rayDir);
    const focalPoint = [
      position[0] + rayDir[0] * lambda,
      position[1] + rayDir[1] * lambda,
      position[2] + rayDir[2] * lambda,
    ];

    return {
      position,
      quaternion,
      tanHalfY,
      shiftX,
      shiftY,
      focalPoint,
      rayLambda: lambda,
      near: Number.isFinite(this.camera.near) ? this.camera.near : 0.4,
      far: Number.isFinite(this.camera.far) ? this.camera.far : 2800.0,
    };
  }

  portalStateToCanonical(portalState, vpWidth, vpHeight) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    const tanHalfY =
      Math.tan(portalState.fov * 0.5 * DEG2RAD) *
      (portalState.subHeight / Math.max(1e-6, portalState.fullHeight));
    const tanHalfX = tanHalfY * aspect;

    const shiftX =
      (2.0 * portalState.offsetX + portalState.subWidth - portalState.fullWidth) /
      Math.max(1e-6, portalState.subWidth);
    const shiftY =
      (portalState.fullHeight - 2.0 * portalState.offsetY - portalState.subHeight) /
      Math.max(1e-6, portalState.subHeight);

    const position = [...portalState.position];
    const quaternion = [...portalState.quaternion];

    this._tmpQuatA.set(quaternion[0], quaternion[1], quaternion[2], quaternion[3]).normalize();
    this._tmpVecA.set(shiftX * tanHalfX, shiftY * tanHalfY, -1.0).normalize();
    this._tmpVecB.copy(this._tmpVecA).applyQuaternion(this._tmpQuatA).normalize();
    const rayDir = [this._tmpVecB.x, this._tmpVecB.y, this._tmpVecB.z];
    const lambda = computeRayTowerAnchorDistance(position, rayDir);
    const focalPoint = [
      position[0] + rayDir[0] * lambda,
      position[1] + rayDir[1] * lambda,
      position[2] + rayDir[2] * lambda,
    ];

    return {
      position,
      quaternion,
      tanHalfY,
      shiftX,
      shiftY,
      focalPoint,
      rayLambda: lambda,
      near: Number.isFinite(portalState.near) ? portalState.near : 0.4,
      far: Number.isFinite(portalState.far) ? portalState.far : 2800.0,
      rect: portalState.rect ? { ...portalState.rect } : null,
    };
  }

  freePoseToCanonical({ position, target, fov = 42.0 }) {
    const pos = [Number(position[0]), Number(position[1]), Number(position[2])];
    const tgt = [Number(target[0]), Number(target[1]), Number(target[2])];
    const safeFov = clamp(Number(fov) || 42.0, 12.0, 120.0);
    const tanHalfY = Math.tan(safeFov * 0.5 * DEG2RAD);

    this._tmpVecA.set(pos[0], pos[1], pos[2]);
    this._tmpVecB.set(tgt[0], tgt[1], tgt[2]);
    this._tmpMat4.lookAt(this._tmpVecA, this._tmpVecB, this._tmpUp);
    this._tmpQuatA.setFromRotationMatrix(this._tmpMat4).normalize();

    return {
      position: pos,
      quaternion: [this._tmpQuatA.x, this._tmpQuatA.y, this._tmpQuatA.z, this._tmpQuatA.w],
      tanHalfY,
      shiftX: 0,
      shiftY: 0,
      focalPoint: tgt,
      rayLambda: Math.max(8.0, this._tmpVecA.distanceTo(this._tmpVecB)),
      near: 0.4,
      far: 2800.0,
      rect: null,
    };
  }

  applyCanonicalState(state, vpWidth, vpHeight) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);

    this.camera.position.set(state.position[0], state.position[1], state.position[2]);
    this.camera.quaternion.set(
      state.quaternion[0],
      state.quaternion[1],
      state.quaternion[2],
      state.quaternion[3]
    );

    const fovDeg = clamp(2.0 * Math.atan(Math.max(1e-5, state.tanHalfY)) * RAD2DEG, 12.0, 140.0);
    const rOrigin = Math.hypot(state.position[0], state.position[2]);
    this.camera.fov = fovDeg;
    this.camera.aspect = W / H;
    this.camera.near = clamp(Number.isFinite(state.near) ? state.near : 0.4, 0.25, 10.0);
    this.camera.far = Math.max(2800.0, Number.isFinite(state.far) ? state.far : 2800.0, rOrigin + 1200.0);

    if (Math.abs(state.shiftX) < 1e-7 && Math.abs(state.shiftY) < 1e-7) {
      this.camera.clearViewOffset();
    } else {
      const offX = 0.5 * W * state.shiftX;
      const offY = -0.5 * H * state.shiftY;
      this.camera.setViewOffset(W, H, offX, offY, W, H);
    }

    this.camera.updateMatrixWorld(true);
    this.camera.updateProjectionMatrix();
  }

  _computeShiftedAimQuaternion(posArr, focalArr, tanHalfX, tanHalfY, shiftX, shiftY, outQuat) {
    this._tmpVecA.set(posArr[0], posArr[1], posArr[2]);
    this._tmpVecB.set(focalArr[0], focalArr[1], focalArr[2]);

    this._tmpVecC.copy(this._tmpVecB).sub(this._tmpVecA);
    const dist = this._tmpVecC.length();
    if (dist < 0.5) {
      this._tmpVecB.set(0, clamp(posArr[1], 2.5, 14.0), -20.0);
    }
    this._tmpMat4.lookAt(this._tmpVecA, this._tmpVecB, this._tmpUp);
    this._tmpQuatLook.setFromRotationMatrix(this._tmpMat4).normalize();

    this._tmpVecC.set(shiftX * tanHalfX, shiftY * tanHalfY, -1.0).normalize();
    this._tmpQuatCorr.setFromUnitVectors(this._tmpVecC, this._tmpZNeg);

    return outQuat.copy(this._tmpQuatLook).multiply(this._tmpQuatCorr).normalize();
  }

  /**
   * Builds a smooth exterior/courtyard Catmull-Rom flight curve between two poses
   * while clearing the East Gatehouse, Twin Minarets, and Mosque walls cleanly.
   */
  _buildHelicalFlightCurve(posA, posB) {
    const { THREE } = this;
    const p0 = new THREE.Vector3(posA[0], posA[1], posA[2]);
    const p1 = new THREE.Vector3(posB[0], posB[1], posB[2]);
    const chordLen = p0.distanceTo(p1);

    if (chordLen < 0.05) {
      return null;
    }

    const knots = [p0];
    const interiorFracs = [0.2, 0.4, 0.6, 0.8];
    const craneLiftM = chordLen > 24.0 ? clamp(chordLen * 0.08, 2.5, 9.5) : 0.0;

    for (const s of interiorFracs) {
      const sinEnv = Math.sin(Math.PI * s);
      const pt = new THREE.Vector3(
        lerp(p0.x, p1.x, s),
        lerp(p0.y, p1.y, s) + craneLiftM * sinEnv,
        lerp(p0.z, p1.z, s)
      );

      repelPointFromTowerStructure(pt, { extraMargin: 2.2 });
      repelPointFromExpositionObstacles(pt, { extraMargin: 2.5, preferAerialLift: true });

      const minY = Math.max(1.75, localGroundElevation(pt.x, pt.z) + 1.55);
      if (pt.y < minY) pt.y = minY;
      knots.push(pt);
    }
    knots.push(p1);

    let curve = new THREE.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
    const probe = new THREE.Vector3();
    for (let pass = 0; pass < 2; pass += 1) {
      let adjusted = false;
      for (let i = 1; i <= 32; i += 1) {
        const u = i / 33;
        if (u <= 0.05 || u >= 0.95) continue;
        curve.getPoint(u, probe);
        const bx = probe.x;
        const by = probe.y;
        const bz = probe.z;
        const c1 = repelPointFromTowerStructure(probe, { extraMargin: 2.2 });
        const c2 = repelPointFromExpositionObstacles(probe, {
          extraMargin: 2.5,
          preferAerialLift: true,
        });
        const minY = Math.max(1.75, localGroundElevation(probe.x, probe.z) + 1.55);
        const c3 = probe.y < minY;
        if (c3) probe.y = minY;
        if (c1 || c2 || c3) {
          const kIdx = clamp(Math.round(u * (knots.length - 1)), 1, knots.length - 2);
          knots[kIdx].x += (probe.x - bx) * 0.65;
          knots[kIdx].y = Math.max(knots[kIdx].y, knots[kIdx].y + (probe.y - by) * 1.05);
          knots[kIdx].z += (probe.z - bz) * 0.65;
          adjusted = true;
        }
      }
      if (!adjusted) break;
      curve = new THREE.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
    }

    curve.arcLengthDivisions = 1800;
    return curve;
  }

  beginFlight({
    endCanonical,
    vpWidth,
    vpHeight,
    durationSec = 1.4,
    kind = 'flight',
    startRect = null,
    endRect = null,
    onProgress = null,
    onComplete = null,
  } = {}) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    const preSnap = this.captureLandmarkScreenPositions(W, H);

    const wasMoving = this.isActive();
    const carryVelPos = wasMoving ? [...this._velPos] : [0, 0, 0];
    const carryVelFocal = wasMoving ? [...this._velFocal] : [0, 0, 0];
    const carryVelTan = wasMoving ? this._velTanHalfY : 0;
    const carryVelSX = wasMoving ? this._velShiftX : 0;
    const carryVelSY = wasMoving ? this._velShiftY : 0;

    if (wasMoving) {
      this._telemetry.interruptionCount += 1;
    }

    this._flight = null;
    this._release = null;

    if (this.controls) {
      this.controls.enabled = false;
      flushOrbitControlsMomentum(this.controls, { spherical: true, pan: true, scale: true });
    }

    const startCanonical = this.extractLiveCanonicalState(W, H);
    const T = Math.max(0.22, Number(durationSec) || 1.4);

    const posCurve = this._buildHelicalFlightCurve(
      startCanonical.position,
      endCanonical.position
    );

    const qStart = new this.THREE.Quaternion(...startCanonical.quaternion).normalize();
    const qEnd = new this.THREE.Quaternion(...endCanonical.quaternion).normalize();

    const qAimStart = this._computeShiftedAimQuaternion(
      startCanonical.position,
      startCanonical.focalPoint,
      startCanonical.tanHalfY * aspect,
      startCanonical.tanHalfY,
      startCanonical.shiftX,
      startCanonical.shiftY,
      new this.THREE.Quaternion()
    );
    const dqStart = qAimStart.clone().invert().multiply(qStart).normalize();
    if (dqStart.w < 0) {
      dqStart.set(-dqStart.x, -dqStart.y, -dqStart.z, -dqStart.w);
    }

    const qAimEnd = this._computeShiftedAimQuaternion(
      endCanonical.position,
      endCanonical.focalPoint,
      endCanonical.tanHalfY * aspect,
      endCanonical.tanHalfY,
      endCanonical.shiftX,
      endCanonical.shiftY,
      new this.THREE.Quaternion()
    );
    const dqEnd = qAimEnd.clone().invert().multiply(qEnd).normalize();
    if (dqStart.dot(dqEnd) < 0) {
      dqEnd.set(-dqEnd.x, -dqEnd.y, -dqEnd.z, -dqEnd.w);
    }

    const thetaA = Math.atan2(startCanonical.position[0], startCanonical.position[2]);
    const thetaB = Math.atan2(endCanonical.position[0], endCanonical.position[2]);
    const absDTheta = Math.abs(shortestAngleDelta(thetaA, thetaB));

    const startClearanceM = computeStructuralClearanceM(
      startCanonical.position[0],
      startCanonical.position[1],
      startCanonical.position[2]
    );
    const endClearanceM = computeStructuralClearanceM(
      endCanonical.position[0],
      endCanonical.position[1],
      endCanonical.position[2]
    );
    const isExteriorFlight = startClearanceM >= 0.0 && endClearanceM >= 0.0;

    this._flight = {
      kind,
      elapsed: 0,
      duration: T,
      vpWidth: W,
      vpHeight: H,
      startCanonical,
      endCanonical,
      posCurve,
      dqStart,
      dqEnd,
      absDTheta,
      isExteriorFlight,
      wasMoving,
      carryVelPos,
      carryVelFocal,
      carryVelTan,
      carryVelSX,
      carryVelSY,
      startRect: startRect ? { ...startRect } : null,
      endRect: endRect ? { ...endRect } : null,
      onProgress,
      onComplete,
    };

    this._evaluateActiveFlightAt(0, W, H, 0);
    const postSnap = this.captureLandmarkScreenPositions(W, H);
    const onsetJumpPx = this.measureMaxLandmarkJumpPx(preSnap, postSnap);

    this._prevSamplePos = [...startCanonical.position];
    this._prevSampleFocal = [...startCanonical.focalPoint];
    this._prevSampleQuat.copy(this.camera.quaternion);

    this._telemetry.transitionCount += 1;
    this._telemetry.lastTransitionKind = kind;
    this._telemetry.lastOnsetJumpPx = Number(onsetJumpPx.toFixed(6));
    if (onsetJumpPx > this._telemetry.maxOnsetJumpPx) {
      this._telemetry.maxOnsetJumpPx = Number(onsetJumpPx.toFixed(6));
    }
    this._telemetry.history.push({
      kind,
      onsetJumpPx: Number(onsetJumpPx.toFixed(6)),
      interruptedActiveMotion: wasMoving,
      durationSec: T,
    });
  }

  _evaluateActiveFlightAt(tau, vpWidth, vpHeight, dtForVel = 0) {
    const fl = this._flight;
    if (!fl) return null;

    const u = clamp(tau, 0, 1);
    const e = easeCameraFlight(u);
    const T = fl.duration;
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    const oneMinusU = 1.0 - u;
    const hermiteW = fl.wasMoving ? u * oneMinusU * oneMinusU * oneMinusU : 0.0;

    if (!fl.posCurve) {
      this._tmpVecA.set(
        lerp(fl.startCanonical.position[0], fl.endCanonical.position[0], e),
        lerp(fl.startCanonical.position[1], fl.endCanonical.position[1], e),
        lerp(fl.startCanonical.position[2], fl.endCanonical.position[2], e)
      );
    } else if (u <= 0.0) {
      this._tmpVecA.set(...fl.startCanonical.position);
    } else if (u >= 1.0) {
      this._tmpVecA.set(...fl.endCanonical.position);
    } else {
      fl.posCurve.getPointAt(clamp(e, 0.0, 0.9999999), this._tmpVecA);
    }

    const curvePt = this._tmpVecA;
    let px = curvePt.x + clamp(fl.carryVelPos[0] * T, -240, 240) * hermiteW;
    let py = curvePt.y + clamp(fl.carryVelPos[1] * T, -120, 120) * hermiteW;
    let pz = curvePt.z + clamp(fl.carryVelPos[2] * T, -240, 240) * hermiteW;

    if (fl.wasMoving && u > 0.02 && u < 0.98) {
      const safetyBlend =
        smoothstepQuintic(Math.min(1.0, u / 0.18)) *
        smoothstepQuintic(Math.min(1.0, (1.0 - u) / 0.18));
      this._tmpVecB.set(px, py, pz);
      if (fl.isExteriorFlight) {
        repelPointFromTowerStructure(this._tmpVecB, { extraMargin: 2.0 });
        repelPointFromExpositionObstacles(this._tmpVecB, {
          extraMargin: 2.2,
          preferAerialLift: true,
        });
      }
      const minY = Math.max(1.75, localGroundElevation(this._tmpVecB.x, this._tmpVecB.z) + 1.55);
      if (this._tmpVecB.y < minY) this._tmpVecB.y = minY;
      px = lerp(px, this._tmpVecB.x, safetyBlend);
      py = lerp(py, this._tmpVecB.y, safetyBlend);
      pz = lerp(pz, this._tmpVecB.z, safetyBlend);
    }

    const fA = fl.startCanonical.focalPoint;
    const fB = fl.endCanonical.focalPoint;
    let fx = lerp(fA[0], fB[0], e) + clamp(fl.carryVelFocal[0] * T, -80, 80) * hermiteW;
    let fy = lerp(fA[1], fB[1], e) + clamp(fl.carryVelFocal[1] * T, -40, 40) * hermiteW;
    let fz = lerp(fA[2], fB[2], e) + clamp(fl.carryVelFocal[2] * T, -80, 80) * hermiteW;

    if (fl.absDTheta > 1.25) {
      const spinePull = 0.32 * Math.sin(Math.PI * e) * clamp((fl.absDTheta - 1.25) / 1.8, 0, 1);
      fx = lerp(fx, 0.0, spinePull);
      fz = lerp(fz, -20.0, spinePull);
    }

    const tanA = Math.max(1e-4, fl.startCanonical.tanHalfY);
    const tanB = Math.max(1e-4, fl.endCanonical.tanHalfY);
    const logTan = lerp(Math.log(tanA), Math.log(tanB), e);
    const tanHalfY = Math.max(
      0.01,
      Math.exp(logTan) + clamp(fl.carryVelTan * T, -0.4, 0.4) * hermiteW
    );
    const tanHalfX = tanHalfY * aspect;

    const shiftX =
      lerp(fl.startCanonical.shiftX, fl.endCanonical.shiftX, e) +
      clamp(fl.carryVelSX * T, -0.5, 0.5) * hermiteW;
    const shiftY =
      lerp(fl.startCanonical.shiftY, fl.endCanonical.shiftY, e) +
      clamp(fl.carryVelSY * T, -0.5, 0.5) * hermiteW;

    const nearA = Number.isFinite(fl.startCanonical.near) ? fl.startCanonical.near : 0.4;
    const nearB = Number.isFinite(fl.endCanonical.near) ? fl.endCanonical.near : 0.4;
    const farA = Number.isFinite(fl.startCanonical.far) ? fl.startCanonical.far : 2800.0;
    const farB = Number.isFinite(fl.endCanonical.far) ? fl.endCanonical.far : 2800.0;
    const nearNow = lerp(nearA, nearB, e);
    const farNow = Math.max(2800.0, lerp(farA, farB, e), Math.hypot(px, pz) + 1200.0);

    this._computeShiftedAimQuaternion(
      [px, py, pz],
      [fx, fy, fz],
      tanHalfX,
      tanHalfY,
      shiftX,
      shiftY,
      this._tmpQuatAim
    );
    this._tmpQuatRoll.copy(fl.dqStart).slerp(fl.dqEnd, e);
    this._tmpQuatAim.multiply(this._tmpQuatRoll).normalize();

    const stateNow = {
      position: [px, py, pz],
      quaternion: [
        this._tmpQuatAim.x,
        this._tmpQuatAim.y,
        this._tmpQuatAim.z,
        this._tmpQuatAim.w,
      ],
      tanHalfY,
      shiftX,
      shiftY,
      focalPoint: [fx, fy, fz],
      near: nearNow,
      far: farNow,
    };

    this.applyCanonicalState(stateNow, W, H);

    if (dtForVel > 1e-5 && this._prevSamplePos) {
      const vx = (px - this._prevSamplePos[0]) / dtForVel;
      const vy = (py - this._prevSamplePos[1]) / dtForVel;
      const vz = (pz - this._prevSamplePos[2]) / dtForVel;
      this._velPos = [vx, vy, vz];

      const deDt = easeCameraFlightDeriv(u) / T;
      if (this._prevSampleFocal) {
        this._velFocal = [
          (fx - this._prevSampleFocal[0]) / dtForVel,
          (fy - this._prevSampleFocal[1]) / dtForVel,
          (fz - this._prevSampleFocal[2]) / dtForVel,
        ];
      } else {
        this._velFocal = [(fB[0] - fA[0]) * deDt, (fB[1] - fA[1]) * deDt, (fB[2] - fA[2]) * deDt];
      }
      this._velTanHalfY = tanHalfY * (Math.log(tanB) - Math.log(tanA)) * deDt;
      this._velShiftX = (fl.endCanonical.shiftX - fl.startCanonical.shiftX) * deDt;
      this._velShiftY = (fl.endCanonical.shiftY - fl.startCanonical.shiftY) * deDt;
    }
    this._prevSampleFocal = [fx, fy, fz];

    let rectNow = null;
    if (fl.startRect && fl.endRect) {
      rectNow = {
        x: lerp(fl.startRect.x, fl.endRect.x, e),
        y: lerp(fl.startRect.y, fl.endRect.y, e),
        width: lerp(fl.startRect.width, fl.endRect.width, e),
        height: lerp(fl.startRect.height, fl.endRect.height, e),
      };
    } else if (fl.endRect) {
      rectNow = { ...fl.endRect };
    } else if (fl.startRect) {
      rectNow = { ...fl.startRect };
    }

    return { u, e, stateNow, rectNow };
  }

  beginOrbitRelease({
    vpWidth,
    vpHeight,
    durationSec = 0.65,
    onComplete = null,
  } = {}) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    const preSnap = this.captureLandmarkScreenPositions(W, H);

    this._flight = null;
    this._release = null;

    if (this.controls) {
      this.controls.enabled = false;
      flushOrbitControlsMomentum(this.controls, { spherical: true, pan: true, scale: true });
    }

    const startCanonical = this.extractLiveCanonicalState(W, H);
    const startFovDeg = 2.0 * Math.atan(startCanonical.tanHalfY) * RAD2DEG;

    const settledFovDeg =
      aspect < 0.82 ? clamp(startFovDeg, 40.0, 54.0) : clamp(startFovDeg, 32.0, 46.0);
    const settledTanHalfY = Math.tan(settledFovDeg * 0.5 * DEG2RAD);

    const target0 = [...startCanonical.focalPoint];

    const rawOffset0 = new this.THREE.Vector3(
      startCanonical.position[0] - target0[0],
      startCanonical.position[1] - target0[1],
      startCanonical.position[2] - target0[2]
    );
    const sph0 = new this.THREE.Spherical().setFromVector3(rawOffset0);
    const scaleCompensation = Math.pow(
      clamp(startCanonical.tanHalfY / Math.max(1e-4, settledTanHalfY), 0.45, 2.2),
      0.72
    );
    const rawDesiredRadius = clamp(sph0.radius * scaleCompensation, 10.0, 220.0);

    const rawCandidateOffset = new this.THREE.Vector3().setFromSphericalCoords(
      rawDesiredRadius,
      clamp(sph0.phi, 0.28, 1.82),
      sph0.theta
    );
    const rawCandidateTarget = [
      clamp(target0[0], -50.0, 50.0),
      clamp(target0[1], 1.5, 16.0),
      clamp(target0[2], -86.0, 32.0),
    ];
    const rawCandidatePos = [
      rawCandidateTarget[0] + rawCandidateOffset.x,
      rawCandidateTarget[1] + rawCandidateOffset.y,
      rawCandidateTarget[2] + rawCandidateOffset.z,
    ];

    let legalEnd = { position: rawCandidatePos, target: rawCandidateTarget };
    if (this.viewportConstraints?.solveLegalPose) {
      legalEnd = this.viewportConstraints.solveLegalPose({
        position: rawCandidatePos,
        target: rawCandidateTarget,
        fov: settledFovDeg,
        aspect,
      });
    }

    const offset1Vec = new this.THREE.Vector3(
      legalEnd.position[0] - legalEnd.target[0],
      legalEnd.position[1] - legalEnd.target[1],
      legalEnd.position[2] - legalEnd.target[2]
    );
    const sph1 = new this.THREE.Spherical().setFromVector3(offset1Vec);

    const qStart = new this.THREE.Quaternion(...startCanonical.quaternion).normalize();
    const qAim0 = this._computeShiftedAimQuaternion(
      startCanonical.position,
      target0,
      startCanonical.tanHalfY * aspect,
      startCanonical.tanHalfY,
      startCanonical.shiftX,
      startCanonical.shiftY,
      new this.THREE.Quaternion()
    );
    const dqRoll0 = qAim0.clone().invert().multiply(qStart).normalize();
    if (dqRoll0.w < 0) {
      dqRoll0.set(-dqRoll0.x, -dqRoll0.y, -dqRoll0.z, -dqRoll0.w);
    }

    this._release = {
      elapsed: 0,
      duration: Math.max(0.25, Number(durationSec) || 0.65),
      vpWidth: W,
      vpHeight: H,
      startCanonical,
      settledFovDeg,
      settledTanHalfY,
      target0,
      target1: legalEnd.target,
      sph0: { radius: sph0.radius, phi: sph0.phi, theta: sph0.theta },
      sph1: { radius: sph1.radius, phi: sph1.phi, theta: sph1.theta },
      dThetaBase: shortestAngleDelta(sph0.theta, sph1.theta),
      dqRoll0,
      targetDragTheta: 0,
      targetDragPhi: 0,
      targetZoomScale: 1.0,
      curDragTheta: 0,
      curDragPhi: 0,
      curZoomScale: 1.0,
      onComplete,
    };

    this._evaluateActiveReleaseAt(0, W, H);
    const postSnap = this.captureLandmarkScreenPositions(W, H);
    const onsetJumpPx = this.measureMaxLandmarkJumpPx(preSnap, postSnap);

    this._prevSamplePos = [...startCanonical.position];
    this._prevSampleQuat.copy(this.camera.quaternion);

    this._telemetry.transitionCount += 1;
    this._telemetry.lastTransitionKind = 'orbit_release';
    this._telemetry.lastOnsetJumpPx = Number(onsetJumpPx.toFixed(6));
    if (onsetJumpPx > this._telemetry.maxOnsetJumpPx) {
      this._telemetry.maxOnsetJumpPx = Number(onsetJumpPx.toFixed(6));
    }
    this._telemetry.history.push({
      kind: 'orbit_release',
      onsetJumpPx: Number(onsetJumpPx.toFixed(6)),
      durationSec: this._release.duration,
    });
  }

  addReleaseDragDelta(dxPx, dyPx) {
    if (!this._release) return;
    const H = Math.max(300, this._release.vpHeight || 900);
    const rotScale = (2.0 * Math.PI * 0.52) / H;
    this._release.targetDragTheta -= (Number(dxPx) || 0) * rotScale;
    this._release.targetDragPhi = clamp(
      this._release.targetDragPhi - (Number(dyPx) || 0) * rotScale,
      -0.65,
      0.65
    );
  }

  _evaluateActiveReleaseAt(tau, vpWidth, vpHeight) {
    const rel = this._release;
    if (!rel) return null;

    const u = clamp(tau, 0, 1);
    const e = smoothstepQuintic(u);
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    const aspect = W / H;

    const tx = lerp(rel.target0[0], rel.target1[0], e);
    const ty = lerp(rel.target0[1], rel.target1[1], e);
    const tz = lerp(rel.target0[2], rel.target1[2], e);

    const minR = lerp(Math.min(8.0, rel.sph0.radius), 8.0, e);
    const maxR = lerp(Math.max(240.0, rel.sph0.radius), 240.0, e);
    const interpBaseR = lerp(rel.sph0.radius, rel.sph1.radius, e);
    const radius = clamp(interpBaseR * rel.curZoomScale, minR, maxR);

    const basePhi = lerp(rel.sph0.phi, rel.sph1.phi, e);
    const minPhi = lerp(Math.min(0.05, rel.sph0.phi), 0.28, e);
    const maxPhi = lerp(Math.max(Math.PI - 0.05, rel.sph0.phi), 2.05, e);
    const phi = clamp(basePhi + rel.curDragPhi, minPhi, maxPhi);
    const theta = rel.sph0.theta + rel.dThetaBase * e + rel.curDragTheta;

    this._tmpSpherical.set(radius, phi, theta);
    this._tmpVecA.setFromSpherical(this._tmpSpherical);

    let px = tx + this._tmpVecA.x;
    let py = ty + this._tmpVecA.y;
    let pz = tz + this._tmpVecA.z;

    const minY = minAllowedCameraY(px, pz);
    const startFloorY = Math.min(rel.startCanonical.position[1], minY);
    const reqMinY = lerp(startFloorY, minY, e);
    if (py < reqMinY) {
      py = reqMinY;
    }

    if (e > 1e-4) {
      this._tmpVecB.set(px, py, pz);
      repelPointFromTowerStructure(this._tmpVecB, { extraMargin: 1.6 });
      px = lerp(px, this._tmpVecB.x, e);
      pz = lerp(pz, this._tmpVecB.z, e);
    }

    const shiftX = (1.0 - e) * rel.startCanonical.shiftX;
    const shiftY = (1.0 - e) * rel.startCanonical.shiftY;
    const tanHalfY = Math.exp(
      lerp(
        Math.log(Math.max(1e-4, rel.startCanonical.tanHalfY)),
        Math.log(Math.max(1e-4, rel.settledTanHalfY)),
        e
      )
    );
    const tanHalfX = tanHalfY * aspect;

    this._computeShiftedAimQuaternion(
      [px, py, pz],
      [tx, ty, tz],
      tanHalfX,
      tanHalfY,
      shiftX,
      shiftY,
      this._tmpQuatAim
    );

    this._tmpQuatRoll.set(0, 0, 0, 1);
    this._tmpQuatB.copy(rel.dqRoll0).slerp(this._tmpQuatRoll, e);
    this._tmpQuatAim.multiply(this._tmpQuatB).normalize();

    const startNear = Number.isFinite(rel.startCanonical.near) ? rel.startCanonical.near : 0.4;
    const rNowXZ = Math.hypot(px, pz);
    const nearNow = lerp(startNear, 0.4, e);
    const farNow = Math.max(2800.0, rNowXZ + 1200.0);

    const stateNow = {
      position: [px, py, pz],
      quaternion: [
        this._tmpQuatAim.x,
        this._tmpQuatAim.y,
        this._tmpQuatAim.z,
        this._tmpQuatAim.w,
      ],
      tanHalfY,
      shiftX,
      shiftY,
      focalPoint: [tx, ty, tz],
      near: nearNow,
      far: farNow,
    };

    this.applyCanonicalState(stateNow, W, H);
    return { u, e, stateNow, target: [tx, ty, tz] };
  }

  onResize(vpWidth, vpHeight) {
    const W = Math.max(1, vpWidth);
    const H = Math.max(1, vpHeight);
    if (this._flight) {
      this._flight.vpWidth = W;
      this._flight.vpHeight = H;
      const tau = clamp(this._flight.elapsed / this._flight.duration, 0, 1);
      this._evaluateActiveFlightAt(tau, W, H, 0);
    } else if (this._release) {
      this._release.vpWidth = W;
      this._release.vpHeight = H;
      const tau = clamp(this._release.elapsed / this._release.duration, 0, 1);
      this._evaluateActiveReleaseAt(tau, W, H);
    }
  }

  cancel() {
    this._flight = null;
    this._release = null;
    this._prevSampleFocal = null;
    this._velPos = [0, 0, 0];
    this._velFocal = [0, 0, 0];
    this._velTanHalfY = 0;
    this._velShiftX = 0;
    this._velShiftY = 0;
  }

  update(dtSec, vpWidth, vpHeight) {
    const dt = clamp(Number(dtSec) || 0, 0, 0.15);
    const W = Math.max(1, vpWidth || this._flight?.vpWidth || this._release?.vpWidth || 1440);
    const H = Math.max(1, vpHeight || this._flight?.vpHeight || this._release?.vpHeight || 900);

    if (!this._flight && !this._release) {
      this._velPos = [0, 0, 0];
      this._velFocal = [0, 0, 0];
      this._angSpeedRadps = 0;
      this._prevLinearSpeed = 0;
      return;
    }

    const preFrameSnap = dt > 0 ? this.captureLandmarkScreenPositions(W, H) : null;

    if (this._flight) {
      const fl = this._flight;
      fl.elapsed += dt;
      const rawTau = clamp(fl.elapsed / fl.duration, 0, 1);
      const evalRes = this._evaluateActiveFlightAt(rawTau, W, H, dt);

      this._recordFrameKinematics(dt, W, H, preFrameSnap);

      if (typeof fl.onProgress === 'function') {
        fl.onProgress({
          rawT: rawTau,
          easedT: evalRes.e,
          rect: evalRes.rectNow,
          state: evalRes.stateNow,
        });
      }

      if (rawTau >= 1.0) {
        const done = fl;
        this._flight = null;
        this._velPos = [0, 0, 0];
        this._velFocal = [0, 0, 0];
        this._velTanHalfY = 0;
        this._velShiftX = 0;
        this._velShiftY = 0;

        const preLockSnap = this.captureLandmarkScreenPositions(W, H);
        if (typeof done.onComplete === 'function') {
          done.onComplete();
        }
        const postLockSnap = this.captureLandmarkScreenPositions(W, H);
        const lockSnapPx = this.measureMaxLandmarkJumpPx(preLockSnap, postLockSnap);
        this._telemetry.lastLockSnapPx = Number(lockSnapPx.toFixed(6));
        if (lockSnapPx > this._telemetry.maxLockSnapPx) {
          this._telemetry.maxLockSnapPx = Number(lockSnapPx.toFixed(6));
        }
      }
      return;
    }

    if (this._release) {
      const rel = this._release;
      rel.elapsed += dt;
      const dampAlpha = 1.0 - Math.exp(-14.0 * dt);
      rel.curDragTheta = lerp(rel.curDragTheta, rel.targetDragTheta, dampAlpha);
      rel.curDragPhi = lerp(rel.curDragPhi, rel.targetDragPhi, dampAlpha);
      rel.curZoomScale = lerp(rel.curZoomScale, rel.targetZoomScale, dampAlpha);

      const rawTau = clamp(rel.elapsed / rel.duration, 0, 1);
      const evalRes = this._evaluateActiveReleaseAt(rawTau, W, H);

      this._recordFrameKinematics(dt, W, H, preFrameSnap);

      if (rawTau >= 1.0) {
        const done = rel;
        this._release = null;
        this._velPos = [0, 0, 0];
        this._velFocal = [0, 0, 0];

        const preLockSnap = this.captureLandmarkScreenPositions(W, H);

        this.camera.clearViewOffset();
        this.camera.fov = done.settledFovDeg;
        this.camera.aspect = W / H;
        this.camera.near = 0.4;
        this.camera.far = 2800.0;
        this.camera.up.set(0, 1, 0);
        this.camera.updateProjectionMatrix();

        if (this.controls) {
          this.controls.target.set(evalRes.target[0], evalRes.target[1], evalRes.target[2]);
          flushOrbitControlsMomentum(this.controls, { spherical: true, pan: true, scale: true });
          this.controls.enabled = true;
          const prevDamp = this.controls.enableDamping;
          this.controls.enableDamping = false;
          this.controls.update();
          this.controls.enableDamping = prevDamp;
        }
        if (this.viewportConstraints) {
          this.viewportConstraints.enforce();
        }

        const postLockSnap = this.captureLandmarkScreenPositions(W, H);
        const lockSnapPx = this.measureMaxLandmarkJumpPx(preLockSnap, postLockSnap);
        this._telemetry.lastLockSnapPx = Number(lockSnapPx.toFixed(6));
        if (lockSnapPx > this._telemetry.maxLockSnapPx) {
          this._telemetry.maxLockSnapPx = Number(lockSnapPx.toFixed(6));
        }

        if (typeof done.onComplete === 'function') {
          done.onComplete();
        }
      }
    }
  }

  _recordFrameKinematics(dt, W, H, preFrameSnap) {
    const cx = this.camera.position.x;
    const cy = this.camera.position.y;
    const cz = this.camera.position.z;

    if (cy < this._telemetry.minFlightCamY) {
      this._telemetry.minFlightCamY = Number(cy.toFixed(3));
    }
    const groundClear = cy - localGroundElevation(cx, cz);
    if (groundClear < this._telemetry.minFlightGroundClearanceM) {
      this._telemetry.minFlightGroundClearanceM = Number(groundClear.toFixed(3));
    }
    const structClear = computeStructuralClearanceM(cx, cy, cz);
    if (structClear < this._telemetry.minFlightStructuralClearanceM) {
      this._telemetry.minFlightStructuralClearanceM = Number(structClear.toFixed(3));
    }
    if (
      this._flight?.isExteriorFlight &&
      structClear < this._telemetry.minExteriorFlightStructuralClearanceM
    ) {
      this._telemetry.minExteriorFlightStructuralClearanceM = Number(structClear.toFixed(3));
    }

    if (dt > 1e-5 && this._prevSamplePos) {
      const distStep = Math.hypot(
        cx - this._prevSamplePos[0],
        cy - this._prevSamplePos[1],
        cz - this._prevSamplePos[2]
      );
      const linSpeed = distStep / dt;
      const speedJump = Math.abs(linSpeed - this._prevLinearSpeed);
      this._prevLinearSpeed = linSpeed;

      const dotQ = clamp(Math.abs(this._prevSampleQuat.dot(this.camera.quaternion)), 0, 1);
      const angStep = 2.0 * Math.acos(dotQ);
      const angSpeed = angStep / dt;

      this._telemetry.linearSpeedMps = Number(linSpeed.toFixed(3));
      this._telemetry.angularSpeedRadps = Number(angSpeed.toFixed(4));
      if (linSpeed > this._telemetry.maxLinearSpeedMps) {
        this._telemetry.maxLinearSpeedMps = Number(linSpeed.toFixed(3));
      }
      if (angSpeed > this._telemetry.maxAngularSpeedRadps) {
        this._telemetry.maxAngularSpeedRadps = Number(angSpeed.toFixed(4));
      }
      if (speedJump > this._telemetry.maxLinearAccelJumpMps) {
        this._telemetry.maxLinearAccelJumpMps = Number(speedJump.toFixed(3));
      }
    }

    if (preFrameSnap) {
      const postFrameSnap = this.captureLandmarkScreenPositions(W, H);
      const stepPx = this.measureMaxLandmarkJumpPx(preFrameSnap, postFrameSnap);
      if (stepPx > this._telemetry.maxFrameStepPx) {
        this._telemetry.maxFrameStepPx = Number(stepPx.toFixed(3));
      }
    }

    this._prevSamplePos = [cx, cy, cz];
    this._prevSampleQuat.copy(this.camera.quaternion);
  }
}
