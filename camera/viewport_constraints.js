/**
 * Kashgar Id Kah Mosque Viewport & Structural Constraints (`viewport_constraints.js`)
 *
 * Enforces ground, structural, and framing boundaries across interactive free-orbit states:
 *   1. Focal tether centered on the Id Kah Mosque compound `(0, y, -22)` (`y in [1.5 m .. 16.0 m]`).
 *   2. Pedestrian ground-floor polar pre-clamp (`Y >= max(1.65 m, localGroundY + 1.50 m)`)
 *      so downward drags glide along the plaza/courtyard brick without dipping under Tuman Canal.
 *   3. Structural exclusion around the East Gatehouse (Derwaza), twin tapering brick minarets,
 *      Qibla wall, and flanking hall walls—while keeping the central courtyard (`Howz` basin)
 *      and Id Kah Square open for intimate architectural inspection.
 *   4. Outer Kashgar adobe city-block clearance and misty horizon cap (`maxDistance = 240 m`,
 *      `maxWorldRadiusXZ = 260 m`).
 *   5. Anti-outward-gaze & frustum guard keeping the Mosque spine anchored inside
 *      `|ndc_x| <= 0.72, |ndc_y| <= 0.85`.
 *   6. `OrbitControls` momentum flush when hitting boundaries.
 */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const MOSQUE_FOCUS_X = 0.0;
const MOSQUE_FOCUS_Z = -22.0;
const MOSQUE_SPINE_X = 0.0;
const MOSQUE_SPINE_Z = -20.0;

/**
 * Characteristic half-width (m) of the Id Kah Mosque compound at elevation `y` (m).
 */
export function towerHalfWidthAtY(y) {
  const h = clamp(Number(y) || 0, 0, 24.0);
  if (h < 6.5) return lerp(52.0, 46.0, h / 6.5);
  if (h < 14.5) return lerp(46.0, 18.0, (h - 6.5) / 8.0);
  return lerp(18.0, 6.0, clamp((h - 14.5) / 9.5, 0, 1));
}

/**
 * Local terrain elevation (m) relative to courtyard plaza floor (`0.0 m`).
 * Models the sunken Tuman Canal north of the old-city edge (`Z in [-178 .. -128 m]`).
 */
export function localGroundElevation(_x, z) {
  if (z >= -178.0 && z <= -128.0) {
    const u = Math.sin(((z + 178.0) / 50.0) * Math.PI);
    return -2.4 * Math.max(0.0, u);
  }
  return 0.0;
}

/**
 * Minimum pedestrian / tripod camera height (m) at `(x, z)` for interactive free-orbit.
 */
export function minAllowedCameraY(x, z) {
  return Math.max(1.65, localGroundElevation(x, z) + 1.5);
}

/**
 * Bounding reference for flanking gatehouse / minaret towers (`(±16.8, z = 25.4)`).
 */
export function getInclinedPierLegSpec(y) {
  const h = clamp(Number(y) || 0, 0, 21.5);
  const u = clamp(h / 21.5, 0, 1);
  return {
    centerOffsetM: 16.8,
    legRadiusM: lerp(2.8, 1.85, u),
  };
}

/**
 * Minimum signed clearance distance (m) from `(x, y, z)` to solid Id Kah Mosque
 * masonry walls, East Gatehouse, and Twin Minarets (`> 0` means strictly outside solid geometry).
 * Leaves open Id Kah Square (`Z > 30`) and the inner courtyard (`|X| < 42, Z in [-46, 20]`).
 */
export function computeStructuralClearanceM(x, y, z) {
  const h = Number(y) || 0;
  if (h > 22.5) {
    return h - 22.5;
  }

  let minClearance = 100.0;

  // 1. Twin tapering brick minarets centered at (±16.8, z = 25.4), radius ~2.8 m
  if (h <= 21.8) {
    const distMinaret = Math.hypot(Math.abs(x) - 16.8, z - 25.4);
    minClearance = Math.min(minClearance, distMinaret - 2.6);
  }

  // 2. East Gatehouse (Derwaza) massing (|X| < 7.5, Z in [21.0, 29.5], Y < 14.5)
  if (h < 14.5) {
    const dx = Math.max(0, Math.abs(x) - 7.5);
    const dz = z < 21.0 ? 21.0 - z : z > 29.5 ? z - 29.5 : 0;
    const gateClear =
      dx > 0 || dz > 0
        ? Math.hypot(dx, dz)
        : -Math.min(7.5 - Math.abs(x), z - 21.0, 29.5 - z);
    minClearance = Math.min(minClearance, gateClear);
  }

  // 3. West Qibla Sanctuary Wall (|X| < 48, Z in [-90, -85], Y < 9.0)
  if (h < 9.0) {
    const dx = Math.max(0, Math.abs(x) - 48.0);
    const dz = z < -90.0 ? -90.0 - z : z > -85.0 ? z - -85.0 : 0;
    const qiblaClear =
      dx > 0 || dz > 0
        ? Math.hypot(dx, dz)
        : -Math.min(48.0 - Math.abs(x), z - -90.0, -85.0 - z);
    minClearance = Math.min(minClearance, qiblaClear);
  }

  // 4. North & South Enclosure Walls (|X| in [43, 51], Z in [-86, 26], Y < 8.0)
  if (h < 8.0) {
    const ax = Math.abs(x);
    const dx = ax < 43.0 ? 43.0 - ax : ax > 51.0 ? ax - 51.0 : 0;
    const dz = z < -86.0 ? -86.0 - z : z > 26.0 ? z - 26.0 : 0;
    const sideClear =
      dx > 0 || dz > 0
        ? Math.hypot(dx, dz)
        : -Math.min(ax - 43.0, 51.0 - ax, z - -86.0, 26.0 - z);
    minClearance = Math.min(minClearance, sideClear);
  }

  return minClearance;
}

/**
 * Legacy-compatible radial clearance helper.
 */
export function minFreeOrbitAxisRadiusAtY(_y) {
  return 0.0;
}

/**
 * Smoothly pushes a 3D point `(x, y, z)` outside the East Gatehouse, Twin Minarets,
 * West Qibla wall, and North/South enclosure walls while keeping the Courtyard + Howz open.
 */
export function repelPointFromTowerStructure(
  vec3,
  { extraMargin = 1.6 } = {}
) {
  let changed = false;
  let x = vec3.x;
  let y = vec3.y;
  let z = vec3.z;
  const m = clamp(Number(extraMargin) || 1.6, 0.5, 4.0);

  // 1. Twin brick minarets at (±16.8, z = 25.4)
  if (y < 21.8) {
    const sx = x >= 0 ? 1 : -1;
    const mx = sx * 16.8;
    const mz = 25.4;
    const dx = x - mx;
    const dz = z - mz;
    const d = Math.hypot(dx, dz);
    const reqR = 2.65 + m;
    if (d < reqR) {
      if (d > 1e-4) {
        const s = reqR / d;
        x = mx + dx * s;
        z = mz + dz * s;
      } else {
        z = mz + reqR;
      }
      changed = true;
    }
  }

  // 2. East Gatehouse (Derwaza): |x| < 7.5, z in [21.0, 29.5], y < 14.5
  if (y < 14.5) {
    const xLim = 7.5 + m;
    const zMin = 21.0 - m;
    const zMax = 29.5 + m;
    if (Math.abs(x) < xLim && z > zMin && z < zMax) {
      const dX = xLim - Math.abs(x);
      const dZFront = zMax - z;
      const dZBack = z - zMin;
      if (dZFront <= dX && dZFront <= dZBack) {
        z = zMax;
      } else if (dZBack <= dX && dZBack <= dZFront) {
        z = zMin;
      } else {
        x = (x >= 0 ? 1 : -1) * xLim;
      }
      changed = true;
    }
  }

  // 3. West Qibla Sanctuary Wall: |x| < 48, z in [-90, -85], y < 9.0
  if (y < 9.0) {
    const xLim = 48.0 + m;
    const zMin = -90.0 - m;
    const zMax = -85.0 + m;
    if (Math.abs(x) < xLim && z > zMin && z < zMax) {
      const dFront = zMax - z;
      const dBack = z - zMin;
      if (dFront <= dBack) {
        z = zMax;
      } else {
        z = zMin;
      }
      changed = true;
    }
  }

  // 4. North & South Side Walls: |x| in [43, 51], z in [-86, 26], y < 8.0
  if (y < 8.0 && z >= -86.0 - m && z <= 26.0 + m) {
    const ax = Math.abs(x);
    const inLo = 43.0 - m;
    const inHi = 51.0 + m;
    if (ax > inLo && ax < inHi) {
      const sx = x >= 0 ? 1 : -1;
      x = sx * (ax < 47.0 ? inLo : inHi);
      changed = true;
    }
  }

  if (changed) {
    vec3.set(x, y, z);
  }
  return changed;
}

/**
 * Smoothly pushes or elevates a 3D point `(x, y, z)` clear of outer Kashgar Old City
 * earthen-brick courtyard districts (`|X| > 56 m`, `Z < -92 m`).
 */
export function repelPointFromExpositionObstacles(
  vec3,
  { extraMargin = 2.0, preferAerialLift = false } = {}
) {
  let changed = false;
  let x = vec3.x;
  let y = vec3.y;
  let z = vec3.z;
  const m = Math.max(1.0, extraMargin);

  // 1. Flanking Old City earthen-brick neighborhoods (`|X| > 56` beside mosque, `|X| > 60` along square)
  const sideLim = z >= 28.0 ? 60.0 - m : 56.0 - m;
  if (Math.abs(x) > sideLim && z <= 105.0 && y < 10.5 + m) {
    if (preferAerialLift || y >= 7.5) {
      y = 10.5 + m;
    } else {
      x = (x >= 0 ? 1 : -1) * sideLim;
    }
    changed = true;
  }

  // 2. Old City adobe quarter west of Qibla wall (`Z < -92 m`)
  if (z < -92.0 + m && y < 10.5 + m) {
    if (preferAerialLift || y >= 7.5) {
      y = 10.5 + m;
    } else {
      z = -92.0 + m;
    }
    changed = true;
  }

  if (changed) {
    vec3.set(x, y, z);
  }
  return changed;
}

/**
 * Flushes internal residual spherical/pan/zoom momentum inside Three.js `OrbitControls`.
 */
export function flushOrbitControlsMomentum(controls, { spherical = true, pan = true, scale = false } = {}) {
  if (!controls) return;
  if (spherical && controls._sphericalDelta && typeof controls._sphericalDelta.set === 'function') {
    controls._sphericalDelta.set(0, 0, 0);
  }
  if (pan && controls._panOffset && typeof controls._panOffset.set === 'function') {
    controls._panOffset.set(0, 0, 0);
  }
  if (scale && typeof controls._scale === 'number') {
    controls._scale = 1;
  }
}

export function createViewportConstraints({
  THREE,
  camera,
  controls,
  maxDistance = 240.0,
  maxWorldRadiusXZ = 260.0,
  maxSpineNdcX = 0.72,
  maxSpineNdcY = 0.85,
} = {}) {
  const offset = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const spinePoint = new THREE.Vector3();
  const projectedSpine = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);

  const lastFlags = {
    groundFloor: false,
    polarMax: false,
    polarMin: false,
    distMax: false,
    distMin: false,
    targetTether: false,
    pierExclusion: false,
    worldRadiusMax: false,
    antiOutwardGaze: false,
    towerFraming: false,
  };

  function resetFlags() {
    lastFlags.groundFloor = false;
    lastFlags.polarMax = false;
    lastFlags.polarMin = false;
    lastFlags.distMax = false;
    lastFlags.distMin = false;
    lastFlags.targetTether = false;
    lastFlags.pierExclusion = false;
    lastFlags.worldRadiusMax = false;
    lastFlags.antiOutwardGaze = false;
    lastFlags.towerFraming = false;
  }

  /**
   * Computes maximum allowed horizontal target tether radius (m) centered around `(0, y, -22)`.
   */
  function computeMaxTetherRadius(_targetY, camDist) {
    const baseR = 68.0;
    const distTighten = lerp(1.0, 0.45, clamp((camDist - 120.0) / 120.0, 0, 1));
    return Math.max(18.0, baseR * distTighten);
  }

  function enforce() {
    if (!camera || !controls || !controls.enabled) return lastFlags;

    resetFlags();

    const target = controls.target;

    // 1. Clamp target elevation to [1.5 m .. 16.0 m]
    const clampedTargetY = clamp(target.y, 1.5, 16.0);
    if (Math.abs(clampedTargetY - target.y) > 1e-4) {
      const dy = clampedTargetY - target.y;
      target.y = clampedTargetY;
      camera.position.y += dy;
      lastFlags.targetTether = true;
    }

    // 2. Adaptive horizontal Mosque-compound target tether around (0, y, -22)
    const rawCamDist = camera.position.distanceTo(target);
    const maxTetherR = computeMaxTetherRadius(target.y, rawCamDist);
    const relTX = target.x - MOSQUE_FOCUS_X;
    const relTZ = target.z - MOSQUE_FOCUS_Z;
    const curTargetR = Math.hypot(relTX, relTZ);
    if (curTargetR > maxTetherR && curTargetR > 1e-5) {
      const scale = maxTetherR / curTargetR;
      const nx = MOSQUE_FOCUS_X + relTX * scale;
      const nz = MOSQUE_FOCUS_Z + relTZ * scale;
      const dx = nx - target.x;
      const dz = nz - target.z;
      target.x = nx;
      target.z = nz;
      camera.position.x += dx;
      camera.position.z += dz;
      lastFlags.targetTether = true;
    }

    // 3. Spherical distance & ground-floor-coupled polar envelope
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);

    const minDist = 8.0;
    if (spherical.radius < minDist) {
      spherical.radius = minDist;
      lastFlags.distMin = true;
    } else if (spherical.radius > maxDistance) {
      spherical.radius = maxDistance;
      lastFlags.distMax = true;
    }

    const estSinPhi = Math.sin(clamp(spherical.phi, 0.28, 2.25));
    const estCamX = target.x + spherical.radius * estSinPhi * Math.sin(spherical.theta);
    const estCamZ = target.z + spherical.radius * estSinPhi * Math.cos(spherical.theta);
    const minCamY = minAllowedCameraY(estCamX, estCamZ);

    const minPolar = 0.28;
    const minCosPhiForGround = clamp(
      (minCamY - target.y) / Math.max(1.0, spherical.radius),
      -0.96,
      0.92
    );
    const groundMaxPolar = Math.acos(minCosPhiForGround);
    const maxPolar = Math.max(minPolar + 0.04, Math.min(2.22, groundMaxPolar));

    if (spherical.phi < minPolar) {
      spherical.phi = minPolar;
      lastFlags.polarMin = true;
    } else if (spherical.phi > maxPolar) {
      spherical.phi = maxPolar;
      lastFlags.polarMax = true;
      if (groundMaxPolar <= 2.22) {
        lastFlags.groundFloor = true;
      }
    }

    offset.setFromSpherical(spherical);
    camera.position.copy(target).add(offset);

    // 4. World-edge radius cap + Mosque structural exclusion + Old City perimeter clearance
    let camAxisR = Math.hypot(camera.position.x, camera.position.z);
    if (camAxisR > maxWorldRadiusXZ && camAxisR > 1e-4) {
      const s = maxWorldRadiusXZ / camAxisR;
      camera.position.x *= s;
      camera.position.z *= s;
      lastFlags.worldRadiusMax = true;
      lastFlags.distMax = true;
    }

    if (repelPointFromTowerStructure(camera.position, { extraMargin: 1.6 })) {
      lastFlags.pierExclusion = true;
    }

    if (
      repelPointFromExpositionObstacles(camera.position, {
        extraMargin: 2.0,
        preferAerialLift: false,
      })
    ) {
      lastFlags.pierExclusion = true;
    }

    camAxisR = Math.hypot(camera.position.x, camera.position.z);
    if (camAxisR > maxWorldRadiusXZ && camAxisR > 1e-4) {
      const s = maxWorldRadiusXZ / camAxisR;
      camera.position.x *= s;
      camera.position.z *= s;
      lastFlags.worldRadiusMax = true;
      lastFlags.distMax = true;
    }

    // Re-verify ground clearance at final XZ
    const exactMinY = minAllowedCameraY(camera.position.x, camera.position.z);
    if (camera.position.y < exactMinY) {
      camera.position.y = exactMinY;
      lastFlags.groundFloor = true;
    }

    // Hard aerial ceiling cap (140 m)
    if (camera.position.y > 140.0) {
      camera.position.y = 140.0;
      lastFlags.polarMin = true;
    }

    // Re-verify 3D distance cap (`<= maxDistance`) toward target
    const postDist = camera.position.distanceTo(target);
    if (postDist > maxDistance && postDist > 1e-4) {
      camera.position.lerp(target, 1.0 - maxDistance / postDist);
      repelPointFromTowerStructure(camera.position, { extraMargin: 1.6 });
      const clampMinY = minAllowedCameraY(camera.position.x, camera.position.z);
      if (camera.position.y < clampMinY) {
        camera.position.y = clampMinY;
      }
      lastFlags.distMax = true;
    }

    // 5. Anti-Outward-Gaze Guard relative to Mosque center `(0, -20)`
    const dxCam = camera.position.x - MOSQUE_SPINE_X;
    const dzCam = camera.position.z - MOSQUE_SPINE_Z;
    const finalAxisR = Math.hypot(dxCam, dzCam);
    if (finalAxisR > 38.0) {
      const toSpineX = -dxCam / finalAxisR;
      const toSpineZ = -dzCam / finalAxisR;
      const lookX = target.x - camera.position.x;
      const lookZ = target.z - camera.position.z;
      const lookLenXZ = Math.hypot(lookX, lookZ);

      if (lookLenXZ > 1e-3) {
        const cosYaw = (lookX * toSpineX + lookZ * toSpineZ) / lookLenXZ;
        const maxYawRad = lerp(0.85, 0.45, clamp((finalAxisR - 45.0) / 140.0, 0, 1));
        const minCosYaw = Math.cos(maxYawRad);
        if (cosYaw < minCosYaw) {
          let lo = 0.0;
          let hi = 1.0;
          for (let iter = 0; iter < 8; iter++) {
            const mid = 0.5 * (lo + hi);
            const tx = lerp(target.x, MOSQUE_SPINE_X, mid) - camera.position.x;
            const tz = lerp(target.z, MOSQUE_SPINE_Z, mid) - camera.position.z;
            const tLen = Math.hypot(tx, tz);
            const c = tLen > 1e-4 ? (tx * toSpineX + tz * toSpineZ) / tLen : 1.0;
            if (c >= minCosYaw) {
              hi = mid;
            } else {
              lo = mid;
            }
          }
          target.x = lerp(target.x, MOSQUE_SPINE_X, hi);
          target.z = lerp(target.z, MOSQUE_SPINE_Z, hi);
          lastFlags.antiOutwardGaze = true;
        }
      }
    }

    // 6. Mosque-In-Viewport Frustum Guard
    spinePoint.set(MOSQUE_SPINE_X, clamp(target.y, 2.5, 12.0), MOSQUE_SPINE_Z);
    camera.up.copy(upVec);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    projectedSpine.copy(spinePoint).project(camera);
    const outOfFrustum =
      !Number.isFinite(projectedSpine.x) ||
      !Number.isFinite(projectedSpine.y) ||
      projectedSpine.z >= 1.0 ||
      Math.abs(projectedSpine.x) > maxSpineNdcX ||
      Math.abs(projectedSpine.y) > maxSpineNdcY;

    if (outOfFrustum) {
      let lo = 0.0;
      let hi = 1.0;
      for (let iter = 0; iter < 9; iter++) {
        const mid = 0.5 * (lo + hi);
        const tx = lerp(target.x, spinePoint.x, mid);
        const ty = lerp(target.y, spinePoint.y, mid);
        const tz = lerp(target.z, spinePoint.z, mid);
        camera.lookAt(tx, ty, tz);
        camera.updateMatrixWorld(true);
        projectedSpine.copy(spinePoint).project(camera);
        const ok =
          projectedSpine.z < 1.0 &&
          Math.abs(projectedSpine.x) <= maxSpineNdcX &&
          Math.abs(projectedSpine.y) <= maxSpineNdcY;
        if (ok) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      target.lerp(spinePoint, hi);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      lastFlags.towerFraming = true;
    }

    // 7. Flush residual OrbitControls momentum when hitting walls
    if (
      lastFlags.targetTether ||
      lastFlags.antiOutwardGaze ||
      lastFlags.towerFraming
    ) {
      flushOrbitControlsMomentum(controls, { spherical: false, pan: true });
    }
    if (
      lastFlags.groundFloor ||
      lastFlags.polarMax ||
      lastFlags.polarMin ||
      lastFlags.pierExclusion ||
      lastFlags.worldRadiusMax
    ) {
      flushOrbitControlsMomentum(controls, { spherical: true, pan: false });
    }

    return lastFlags;
  }

  /**
   * Computes nearest legal `(position, target)` pair without mutating live controls.
   */
  function solveLegalPose({ position, target, fov = 42, aspect = 16 / 9 } = {}) {
    const savedPos = camera.position.clone();
    const savedQuat = camera.quaternion.clone();
    const savedUp = camera.up.clone();
    const savedFov = camera.fov;
    const savedAspect = camera.aspect;
    const savedTarget = controls.target.clone();
    const savedEnabled = controls.enabled;
    const savedView = camera.view && camera.view.enabled ? { ...camera.view } : null;

    camera.clearViewOffset();
    camera.fov = fov;
    camera.aspect = aspect;
    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.enabled = true;
    camera.lookAt(controls.target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    enforce();

    const legalPosition = [camera.position.x, camera.position.y, camera.position.z];
    const legalTarget = [controls.target.x, controls.target.y, controls.target.z];

    camera.position.copy(savedPos);
    camera.quaternion.copy(savedQuat);
    camera.up.copy(savedUp);
    camera.fov = savedFov;
    camera.aspect = savedAspect;
    if (savedView) {
      camera.setViewOffset(
        savedView.fullWidth,
        savedView.fullHeight,
        savedView.offsetX,
        savedView.offsetY,
        savedView.width,
        savedView.height
      );
    } else {
      camera.clearViewOffset();
    }
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    controls.target.copy(savedTarget);
    controls.enabled = savedEnabled;

    return { position: legalPosition, target: legalTarget };
  }

  function getFlags() {
    return { ...lastFlags };
  }

  return {
    enforce,
    solveLegalPose,
    getFlags,
  };
}

/**
 * Deterministic adversarial fuzz test (`>= 1,200` extreme pan/orbit/zoom perturbations).
 */
export function runAdversarialConstraintFuzz({
  THREE,
  camera,
  controls,
  constraints,
  iterations = 1500,
} = {}) {
  const savedPos = camera.position.clone();
  const savedQuat = camera.quaternion.clone();
  const savedUp = camera.up.clone();
  const savedFov = camera.fov;
  const savedAspect = camera.aspect;
  const savedView = camera.view && camera.view.enabled ? { ...camera.view } : null;
  const savedTarget = controls.target.clone();
  const savedEnabled = controls.enabled;

  let seed = 0x14420809;
  const rand = () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randRange = (lo, hi) => lo + (hi - lo) * rand();

  camera.clearViewOffset();
  camera.fov = 42;
  camera.updateProjectionMatrix();
  controls.enabled = true;

  let undergroundViolations = 0;
  let worldEdgeViolations = 0;
  let pierClipViolations = 0;
  let outwardGazeViolations = 0;
  let towerOutsideViewportViolations = 0;

  let minRecordedCamY = Infinity;
  let maxRecordedDist = 0;
  let maxRecordedAxisR = 0;
  let minRecordedStructuralClearance = Infinity;
  let maxSpineAbsNdcX = 0;
  let maxSpineAbsNdcY = 0;
  let minCosYawToSpine = 1.0;

  const probeSpine = new THREE.Vector3();
  const ndcSpine = new THREE.Vector3();

  const explicitAttacks = [
    { cam: [0, -80, -10], tgt: [0, -25, -22] },
    { cam: [0, -1.5, -155], tgt: [0, 5, -22] },
    { cam: [10, 5, 50], tgt: [160, 8, 160] },
    { cam: [0, 6, 25], tgt: [0, 7, -18] },
    { cam: [16.8, 12, 25.4], tgt: [0, 8, -18] },
    { cam: [-46, 4, -30], tgt: [0, 5, -22] },
    { cam: [600, 90, 800], tgt: [0, 12, -22] },
    { cam: [95, 25, 110], tgt: [-280, 10, 110] },
    { cam: [50, 15, 80], tgt: [0, 260, -22] },
    { cam: [0.001, 220, -20.001], tgt: [0, 8, -22] },
  ];

  const totalSteps = Math.max(explicitAttacks.length, Number(iterations) || 1500);

  for (let i = 0; i < totalSteps; i++) {
    if (i < explicitAttacks.length) {
      camera.position.set(...explicitAttacks[i].cam);
      controls.target.set(...explicitAttacks[i].tgt);
    } else if (i % 3 === 0) {
      camera.position.set(
        randRange(-400, 400),
        randRange(-40, 180),
        randRange(-400, 400)
      );
      controls.target.set(
        randRange(-180, 180),
        randRange(-25, 90),
        randRange(-180, 180)
      );
    } else {
      controls.target.x += randRange(-45, 45);
      controls.target.y += randRange(-25, 25);
      controls.target.z += randRange(-45, 45);
      camera.position.x += randRange(-80, 80);
      camera.position.y += randRange(-50, 50);
      camera.position.z += randRange(-80, 80);
    }

    constraints.enforce();

    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    const tx = controls.target.x;
    const ty = controls.target.y;
    const tz = controls.target.z;

    const groundY = localGroundElevation(cx, cz);
    const dist = camera.position.distanceTo(controls.target);
    const axisR = Math.hypot(cx, cz);
    const structClear = computeStructuralClearanceM(cx, cy, cz);

    if (cy < minRecordedCamY) minRecordedCamY = cy;
    if (dist > maxRecordedDist) maxRecordedDist = dist;
    if (axisR > maxRecordedAxisR) maxRecordedAxisR = axisR;
    if (structClear < minRecordedStructuralClearance) minRecordedStructuralClearance = structClear;

    if (cy < 1.60 || cy < groundY + 1.45) {
      undergroundViolations++;
    }
    if (dist > 242.0 || axisR > 262.0) {
      worldEdgeViolations++;
    }
    if (structClear < -0.15) {
      pierClipViolations++;
    }

    const dxCam = cx - MOSQUE_SPINE_X;
    const dzCam = cz - MOSQUE_SPINE_Z;
    const toSpineLen = Math.hypot(dxCam, dzCam);
    const lookLen = Math.hypot(tx - cx, tz - cz);
    if (toSpineLen > 38.0 && lookLen > 1e-3) {
      const cosYaw = (-dxCam * (tx - cx) - dzCam * (tz - cz)) / (toSpineLen * lookLen);
      if (cosYaw < minCosYawToSpine) minCosYawToSpine = cosYaw;
      if (cosYaw < 0.35) {
        outwardGazeViolations++;
      }
    }

    probeSpine.set(MOSQUE_SPINE_X, clamp(ty, 2.5, 12.0), MOSQUE_SPINE_Z);
    ndcSpine.copy(probeSpine).project(camera);
    if (Math.abs(ndcSpine.x) > maxSpineAbsNdcX) maxSpineAbsNdcX = Math.abs(ndcSpine.x);
    if (Math.abs(ndcSpine.y) > maxSpineAbsNdcY) maxSpineAbsNdcY = Math.abs(ndcSpine.y);
    if (
      ndcSpine.z >= 1.0 ||
      Math.abs(ndcSpine.x) > 0.75 ||
      Math.abs(ndcSpine.y) > 0.88
    ) {
      towerOutsideViewportViolations++;
    }
  }

  camera.position.copy(savedPos);
  camera.quaternion.copy(savedQuat);
  camera.up.copy(savedUp);
  camera.fov = savedFov;
  camera.aspect = savedAspect;
  if (savedView) {
    camera.setViewOffset(
      savedView.fullWidth,
      savedView.fullHeight,
      savedView.offsetX,
      savedView.offsetY,
      savedView.width,
      savedView.height
    );
  } else {
    camera.clearViewOffset();
  }
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  controls.target.copy(savedTarget);
  controls.enabled = savedEnabled;
  flushOrbitControlsMomentum(controls, { spherical: true, pan: true, scale: true });

  const totalViolations =
    undergroundViolations +
    worldEdgeViolations +
    pierClipViolations +
    outwardGazeViolations +
    towerOutsideViewportViolations;

  return {
    passed: totalViolations === 0,
    passes: totalViolations === 0,
    iterations: totalSteps,
    totalViolations,
    violations: {
      underground: undergroundViolations,
      worldEdge: worldEdgeViolations,
      pierClip: pierClipViolations,
      outwardGaze: outwardGazeViolations,
      towerOutsideViewport: towerOutsideViewportViolations,
    },
    boundsObserved: {
      minCamY: Number(minRecordedCamY.toFixed(3)),
      maxDist: Number(maxRecordedDist.toFixed(3)),
      maxAxisRadiusXZ: Number(maxRecordedAxisR.toFixed(3)),
      minStructuralClearanceM: Number(minRecordedStructuralClearance.toFixed(3)),
      minCosYawToSpine: Number(minCosYawToSpine.toFixed(4)),
      maxSpineAbsNdcX: Number(maxSpineAbsNdcX.toFixed(4)),
      maxSpineAbsNdcY: Number(maxSpineAbsNdcY.toFixed(4)),
    },
  };
}
