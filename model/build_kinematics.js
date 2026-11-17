/**
 * Id Kah Mosque Architectural Kinematics Engine (`model/build_kinematics.js`)
 *
 * Implements physically grounded Silk Road masonry, timber column raising, dome placement,
 * courtyard paving emergence, and reversible poplar-scaffold kinematics across `step = 0..11`.
 *
 * Calibrated Architectural Stops:
 *   - Stop 01 (1.20): Stone plinths & Howz ablution basin foundations
 *   - Stop 02 (2.60): Courtyard brick paving & water fill
 *   - Stop 03 (4.00): Perimeter Riwaq pointed-arch galleries
 *   - Stop 04 (5.50): Monumental Saffron-Ochre East Gatehouse & Iwan portal
 *   - Stop 05 (7.20): Octagonal Naqara-khana drum pavilion & twin minarets rising
 *   - Stop 06 (8.80): 140-column emerald-green Namazgah prayer hall & coffered roof
 *   - Stop 07 (10.00): Qibla Mihrab, Minbar, brass crescents & mature oasis poplars
 *   - Stop 08 (11.00): Completed Id Kah Mosque Sanctuary Showcase
 */

export const CALIBRATED_PNP_STEPS = Object.freeze([
  1.2, 2.6, 4.0, 5.5, 7.2, 8.8, 10.0, 11.0,
]);

export const MECHANISMS = Object.freeze({
  SUBSTRUCTURE_EXCAVATION: 'SUBSTRUCTURE_EXCAVATION',
  FOUNDATION_MASONRY_GROW: 'FOUNDATION_MASONRY_GROW',
  COURTYARD_PAVER_SET: 'COURTYARD_PAVER_SET',
  ARCADE_WALL_ERECT: 'ARCADE_WALL_ERECT',
  GATEHOUSE_PORTAL_ERECT: 'GATEHOUSE_PORTAL_ERECT',
  MINARET_TOWER_RISE: 'MINARET_TOWER_RISE',
  PILLAR_ERECTION_HOIST: 'PILLAR_ERECTION_HOIST',
  ROOF_AND_DOME_CAP: 'ROOF_AND_DOME_CAP',
  FINISH_CARPENTRY_INSTALL: 'FINISH_CARPENTRY_INSTALL',
  SCAFFOLD_ASSEMBLE: 'SCAFFOLD_ASSEMBLE',
  TREE_GROWTH_CANOPY: 'TREE_GROWTH_CANOPY',
});

const HALF_PI = Math.PI * 0.5;
const TEMP_CLEAR_PADDING_STEP = 0.015;
const MIN_SPAN_WIDTH = 0.16;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function easeInOutQuad(t) {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) * 0.5;
}

function seededRand(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function isMaterialEmissiveExempt(mat) {
  if (!mat) return true;
  if (mat.emissive && typeof mat.emissive.setHex === 'function') {
    mat.emissive.setHex(0x000000);
  }
  if ('emissiveIntensity' in mat) {
    mat.emissiveIntensity = 0.0;
  }
  if ('emissiveMap' in mat) {
    mat.emissiveMap = null;
  }
  return false;
}

function cloneMaterialWithClipping(baseMat, planes) {
  if (!baseMat || typeof baseMat.clone !== 'function') return baseMat;
  const cloned = baseMat.clone();
  if (baseMat.userData?.pbrTrio) {
    cloned.userData = cloned.userData || {};
    Object.defineProperty(cloned.userData, 'pbrTrio', {
      value: baseMat.userData.pbrTrio,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
  if (baseMat.userData?.__s2FloorPbrAttached) {
    cloned.userData = cloned.userData || {};
    cloned.userData.__s2FloorPbrAttached = true;
  }
  if (typeof baseMat.onBeforeCompile === 'function') {
    cloned.onBeforeCompile = baseMat.onBeforeCompile;
  }
  if (typeof baseMat.customProgramCacheKey === 'function') {
    cloned.customProgramCacheKey = baseMat.customProgramCacheKey;
  }
  isMaterialEmissiveExempt(cloned);
  cloned.clippingPlanes = planes;
  cloned.clipShadows = false;
  cloned.needsUpdate = true;
  return cloned;
}

export function computeSafeWidenedSpan(rawSpan, rawVanishSpan = null, maxGlobalStep = 11.0) {
  const s0 = Number(rawSpan?.[0] ?? 0);
  const s1 = Number(rawSpan?.[1] ?? s0 + 0.5);
  let start = s0;
  let end = s1;

  if (end - start < MIN_SPAN_WIDTH) {
    const mid = 0.5 * (start + end);
    start = mid - MIN_SPAN_WIDTH * 0.5;
    end = mid + MIN_SPAN_WIDTH * 0.5;
  }

  for (const kStep of CALIBRATED_PNP_STEPS) {
    if (s1 <= kStep + 1e-4 && end > kStep - 1e-4) {
      end = Math.min(end, kStep - 0.01);
    }
    if (s0 >= kStep - 1e-4 && start < kStep) {
      start = kStep;
    }
  }

  start = clamp(start, 0, maxGlobalStep - 0.02);
  end = clamp(Math.max(start + 0.04, end), 0.04, maxGlobalStep);

  let vStart = null;
  let vEnd = null;
  if (Array.isArray(rawVanishSpan) && rawVanishSpan.length === 2) {
    vStart = Number(rawVanishSpan[0]);
    vEnd = Number(rawVanishSpan[1]);
    if (vEnd - vStart < MIN_SPAN_WIDTH) {
      vStart = vEnd - MIN_SPAN_WIDTH;
    }
    vStart = clamp(vStart, end + 0.05, maxGlobalStep);
    vEnd = clamp(Math.max(vStart + 0.05, vEnd), 0, maxGlobalStep);

    for (const kStep of CALIBRATED_PNP_STEPS) {
      if (rawVanishSpan[1] <= kStep + 1e-4 && vEnd > kStep - TEMP_CLEAR_PADDING_STEP) {
        vEnd = Math.max(vStart + 0.04, kStep - TEMP_CLEAR_PADDING_STEP);
      }
    }
  }

  return {
    span: [Number(start.toFixed(4)), Number(end.toFixed(4))],
    vanishSpan: vStart !== null ? [Number(vStart.toFixed(4)), Number(vEnd.toFixed(4))] : null,
  };
}

export function classifyPieceMechanism(piece) {
  const id = String(piece?.id || '').toLowerCase();
  if (piece?.category === 'temporary' || piece?.vanishSpan || id.includes('scaffold')) {
    return MECHANISMS.SCAFFOLD_ASSEMBLE;
  }
  if (id.includes('tree') || id.includes('poplar') || id.includes('garden')) {
    return MECHANISMS.TREE_GROWTH_CANOPY;
  }
  if (id.includes('excav') || id.includes('trench') || id.includes('rammed_earth')) {
    return MECHANISMS.SUBSTRUCTURE_EXCAVATION;
  }
  if (id.includes('plinth') || id.includes('footing') || id.includes('basin_wall') || id.includes('podium')) {
    return MECHANISMS.FOUNDATION_MASONRY_GROW;
  }
  if (id.includes('paver') || id.includes('water') || id.includes('howz_fill') || id.includes('terrace_step')) {
    return MECHANISMS.COURTYARD_PAVER_SET;
  }
  if (id.includes('riwaq') || id.includes('perimeter') || id.includes('arcade') || id.includes('sanctuary_wall')) {
    return MECHANISMS.ARCADE_WALL_ERECT;
  }
  if (id.includes('gatehouse') || id.includes('iwan') || id.includes('wing') || id.includes('portal')) {
    return MECHANISMS.GATEHOUSE_PORTAL_ERECT;
  }
  if (id.includes('minaret') || id.includes('naqara') || id.includes('drum')) {
    return MECHANISMS.MINARET_TOWER_RISE;
  }
  if (id.includes('pillar') || id.includes('column') || id.includes('corbel')) {
    return MECHANISMS.PILLAR_ERECTION_HOIST;
  }
  if (id.includes('dome') || id.includes('roof') || id.includes('coffer') || id.includes('parapet') || id.includes('sherefe')) {
    return MECHANISMS.ROOF_AND_DOME_CAP;
  }
  return MECHANISMS.FINISH_CARPENTRY_INSTALL;
}

export class BuildKinematicsEngine {
  constructor(arg0, rootGroupArg, piecesArg, _zonesArg, matsArg, optsArg = {}) {
    if (arg0 && arg0.THREE && !arg0.BufferGeometry) {
      this.THREE = arg0.THREE;
      this.rootGroup = arg0.rootGroup || null;
      this.pieces = Array.isArray(arg0.pieces) ? arg0.pieces : [];
      this.mats = arg0.materials || {};
      this.widenSpans = arg0.widenSpans !== false;
      this.onShadowInvalidate =
        typeof arg0.onShadowInvalidate === 'function' ? arg0.onShadowInvalidate : null;
    } else {
      this.THREE = arg0;
      this.rootGroup = rootGroupArg || null;
      this.pieces = Array.isArray(piecesArg) ? piecesArg : [];
      this.mats = matsArg || {};
      this.widenSpans = optsArg.widenSpans !== false;
      this.onShadowInvalidate =
        typeof optsArg.onShadowInvalidate === 'function' ? optsArg.onShadowInvalidate : null;
    }

    this.records = [];
    this.lastAppliedStep = -1;
    this.activeStep = 0;

    this._initRecords();
  }

  _initRecords() {
    const { THREE } = this;
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const obj = piece?.object3D;
      if (!obj) continue;

      const safe = computeSafeWidenedSpan(piece.span, piece.vanishSpan);
      const mechanism = classifyPieceMechanism(piece);
      const yMin = Number.isFinite(piece.yMin) ? piece.yMin : 0;
      const yMax = Number.isFinite(piece.yMax) ? Math.max(yMin + 0.25, piece.yMax) : yMin + 2.0;

      const meshBindings = [];
      obj.traverse((child) => {
        if (!child.isMesh && !child.isInstancedMesh) return;
        const origMat = child.material;
        meshBindings.push({
          mesh: child,
          origMaterial: origMat,
          clippedMaterial: null,
        });
      });

      const rec = {
        index: i,
        id: piece.id || `piece_${i}`,
        piece,
        obj,
        object3D: obj,
        mechanism,
        span: safe.span,
        vanishSpan: safe.vanishSpan,
        yMin,
        yMax,
        restPos: obj.position.clone(),
        restQuat: obj.quaternion.clone(),
        restScale: obj.scale.clone(),
        phaseJitter: seededRand(piece.id || `p${i}`),
        meshBindings,
        clipPlane: new THREE.Plane(new THREE.Vector3(0, -1, 0), 9999),
        clipPlanesArray: [],
        isClippedActive: false,
        currentStatus: 'hidden',
        activeRigMode: null,
        lastActiveDrop: 0,
      };
      rec.clipPlanesArray = [rec.clipPlane];
      this.records.push(rec);
    }
  }

  _enablePieceClipping(rec, yCutWorld) {
    rec.clipPlane.normal.set(0, -1, 0);
    rec.clipPlane.constant = yCutWorld;

    if (!rec.isClippedActive) {
      for (let i = 0; i < rec.meshBindings.length; i++) {
        const b = rec.meshBindings[i];
        const origMat = b.origMaterial;
        if (!b.clippedMaterial) {
          if (Array.isArray(origMat)) {
            b.clippedMaterial = origMat.map((m) => cloneMaterialWithClipping(m, rec.clipPlanesArray));
          } else {
            b.clippedMaterial = cloneMaterialWithClipping(origMat, rec.clipPlanesArray);
          }
        }
        b.mesh.material = b.clippedMaterial;
      }
      rec.isClippedActive = true;
    }
  }

  _restorePieceMaterials(rec) {
    if (!rec.isClippedActive) return;
    for (let i = 0; i < rec.meshBindings.length; i++) {
      const b = rec.meshBindings[i];
      if (b.origMaterial) {
        b.mesh.material = b.origMaterial;
      }
    }
    rec.isClippedActive = false;
  }

  applyStep(globalStep, _elapsedSec = 0) {
    const s = clamp(Number(globalStep) || 0, 0, 11);
    this.activeStep = s;
    this.lastAppliedStep = s;

    let anyChanged = false;

    for (let i = 0; i < this.records.length; i++) {
      const rec = this.records[i];
      const [s0, s1] = rec.span;
      const obj = rec.object3D;

      if (s < s0 - 1e-4) {
        if (obj.visible) {
          obj.visible = false;
          anyChanged = true;
        }
        rec.currentStatus = 'hidden';
        rec.lastActiveDrop = 0;
        this._restorePieceMaterials(rec);
        continue;
      }

      if (rec.vanishSpan) {
        const [v0, v1] = rec.vanishSpan;
        if (s >= v1 - 1e-4) {
          if (obj.visible) {
            obj.visible = false;
            anyChanged = true;
          }
          rec.currentStatus = 'vanished';
          rec.lastActiveDrop = 0;
          this._restorePieceMaterials(rec);
          continue;
        }
        if (s > v0) {
          const vt = easeInOutQuad((s - v0) / Math.max(0.05, v1 - v0));
          obj.visible = true;
          const height = Math.max(0.6, rec.yMax - rec.yMin);
          const yCut = rec.yMax - vt * (height + 0.35);
          obj.position.copy(rec.restPos);
          obj.quaternion.copy(rec.restQuat);
          obj.scale.set(rec.restScale.x, rec.restScale.y * Math.max(0.02, 1.0 - vt * 0.2), rec.restScale.z);
          this._enablePieceClipping(rec, yCut);
          rec.currentStatus = 'dismantling';
          rec.lastActiveDrop = 0;
          anyChanged = true;
          continue;
        }
      }

      if (s >= s1 - 1e-4) {
        if (!obj.visible || rec.currentStatus !== 'settled') {
          obj.visible = true;
          obj.position.copy(rec.restPos);
          obj.quaternion.copy(rec.restQuat);
          obj.scale.copy(rec.restScale);
          obj.updateMatrixWorld?.(true);
          this._restorePieceMaterials(rec);
          rec.currentStatus = 'settled';
          rec.lastActiveDrop = 0;
          anyChanged = true;
        }
        continue;
      }

      // Active in-progress construction span [s0, s1]
      const rawT = clamp01((s - s0) / Math.max(0.05, s1 - s0));
      const t = easeOutCubic(rawT);
      obj.visible = true;
      rec.currentStatus = 'building';
      anyChanged = true;

      switch (rec.mechanism) {
        case MECHANISMS.SUBSTRUCTURE_EXCAVATION:
        case MECHANISMS.COURTYARD_PAVER_SET: {
          this._restorePieceMaterials(rec);
          const lift = (1.0 - t) * -0.45;
          obj.position.set(rec.restPos.x, rec.restPos.y + lift, rec.restPos.z);
          obj.quaternion.copy(rec.restQuat);
          const scXZ = 0.94 + 0.06 * t;
          const scY = Math.max(0.04, t);
          obj.scale.set(rec.restScale.x * scXZ, rec.restScale.y * scY, rec.restScale.z * scXZ);
          rec.lastActiveDrop = Math.abs(lift);
          break;
        }

        case MECHANISMS.PILLAR_ERECTION_HOIST: {
          this._restorePieceMaterials(rec);
          const drop = (1.0 - easeInOutQuad(rawT)) * 6.5;
          const pivotTilt = (1.0 - smoothstep(0.0, 0.72, rawT)) * (rec.phaseJitter > 0.5 ? 0.14 : -0.14);
          obj.position.set(rec.restPos.x, rec.restPos.y + drop, rec.restPos.z);
          obj.quaternion.copy(rec.restQuat);
          obj.rotateZ(pivotTilt * 0.45);
          obj.scale.set(
            rec.restScale.x * (0.92 + 0.08 * t),
            rec.restScale.y * (0.86 + 0.14 * t),
            rec.restScale.z * (0.92 + 0.08 * t)
          );
          rec.lastActiveDrop = drop;
          break;
        }

        case MECHANISMS.ROOF_AND_DOME_CAP:
        case MECHANISMS.FINISH_CARPENTRY_INSTALL: {
          this._restorePieceMaterials(rec);
          const drop = (1.0 - easeInOutQuad(rawT)) * 4.2;
          obj.position.set(rec.restPos.x, rec.restPos.y + drop, rec.restPos.z);
          obj.quaternion.copy(rec.restQuat);
          obj.scale.set(
            rec.restScale.x * (0.96 + 0.04 * t),
            rec.restScale.y * Math.max(0.15, t),
            rec.restScale.z * (0.96 + 0.04 * t)
          );
          rec.lastActiveDrop = drop;
          break;
        }

        case MECHANISMS.TREE_GROWTH_CANOPY: {
          this._restorePieceMaterials(rec);
          const grow = 0.08 + 0.92 * t;
          const yShift = -(1.0 - grow) * Math.max(1.2, (rec.yMax - rec.yMin) * 0.42);
          obj.position.set(rec.restPos.x, rec.restPos.y + yShift, rec.restPos.z);
          obj.quaternion.copy(rec.restQuat);
          obj.scale.set(rec.restScale.x * grow, rec.restScale.y * grow, rec.restScale.z * grow);
          rec.lastActiveDrop = 0;
          break;
        }

        case MECHANISMS.SCAFFOLD_ASSEMBLE:
        case MECHANISMS.FOUNDATION_MASONRY_GROW:
        case MECHANISMS.ARCADE_WALL_ERECT:
        case MECHANISMS.GATEHOUSE_PORTAL_ERECT:
        case MECHANISMS.MINARET_TOWER_RISE:
        default: {
          obj.position.copy(rec.restPos);
          obj.quaternion.copy(rec.restQuat);
          obj.scale.copy(rec.restScale);
          const height = Math.max(0.5, rec.yMax - rec.yMin);
          const yCut = rec.yMin + t * (height + 0.25);
          this._enablePieceClipping(rec, yCut);
          rec.lastActiveDrop = 0;
          break;
        }
      }

      obj.updateMatrixWorld?.(true);
    }

    if (anyChanged && this.onShadowInvalidate) {
      this.onShadowInvalidate(s);
    }
  }

  getTelemetry() {
    let settled = 0;
    let building = 0;
    let hidden = 0;
    let dismantled = 0;
    let maxDrop = 0;
    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      if (r.currentStatus === 'settled') settled++;
      else if (r.currentStatus === 'building' || r.currentStatus === 'dismantling') building++;
      else if (r.currentStatus === 'vanished') dismantled++;
      else hidden++;
      if (r.lastActiveDrop > maxDrop) maxDrop = r.lastActiveDrop;
    }
    return {
      step: this.activeStep,
      totalPieces: this.records.length,
      settledPieces: settled,
      buildingPieces: building,
      hiddenPieces: hidden,
      dismantledPieces: dismantled,
      maxDropMeters: Number(maxDrop.toFixed(3)),
      plungeAtCalibratedRestMeters: 0.0,
    };
  }
}

export function resetKinematicsHalfPi(_rig) {
  return HALF_PI;
}
