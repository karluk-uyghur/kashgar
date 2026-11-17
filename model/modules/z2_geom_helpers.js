/**
 * Kashgar Id Kah Mosque Shared Architectural Geometry Primitives (`model/modules/z2_geom_helpers.js`)
 *
 * High-speed indexed `BufferGeometry` builder and Islamic / Uyghur architectural generators:
 *   - Pointed four-centered Persian/Uyghur Iwan & Riwaq arch spandrel walls (`addPointedArchWall`)
 *   - Ribbed ovoid / onion domes on faceted drums (`addRibbedDome`)
 *   - Stepped Kashgar saffron-brick crenellations (`addCrenellationRow`)
 *   - Carved walnut panjara lattice panels (`addLatticePanel`)
 *   - Tapered cylindrical minarets with decorative brick bands & muqarnas corbels (`addCylinderPrism`)
 *   - Hammered brass hilal crescent & ball finials (`addCrescentFinial`)
 */

export function sub3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function scale3(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}
export function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function norm3(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1.0;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export class GeomBuilder {
  constructor(initVerts = 512, initIdx = 1024) {
    this._vCap = initVerts;
    this._iCap = initIdx;
    this._pos = new Float32Array(initVerts * 3);
    this._nrm = new Float32Array(initVerts * 3);
    this._uvs = new Float32Array(initVerts * 2);
    this._idx = new Uint32Array(initIdx);
    this.vertCount = 0;
    this.idxCount = 0;
    this.minY = Infinity;
    this.maxY = -Infinity;
    this.sumX = 0;
    this.sumY = 0;
    this.sumZ = 0;
  }

  _ensureVerts(addV) {
    const need = this.vertCount + addV;
    if (need <= this._vCap) return;
    let cap = this._vCap;
    while (cap < need) cap <<= 1;
    const np = new Float32Array(cap * 3);
    np.set(this._pos.subarray(0, this.vertCount * 3));
    this._pos = np;
    const nn = new Float32Array(cap * 3);
    nn.set(this._nrm.subarray(0, this.vertCount * 3));
    this._nrm = nn;
    const nu = new Float32Array(cap * 2);
    nu.set(this._uvs.subarray(0, this.vertCount * 2));
    this._uvs = nu;
    this._vCap = cap;
  }

  _ensureIdx(addI) {
    const need = this.idxCount + addI;
    if (need <= this._iCap) return;
    let cap = this._iCap;
    while (cap < need) cap <<= 1;
    const ni = new Uint32Array(cap);
    ni.set(this._idx.subarray(0, this.idxCount));
    this._idx = ni;
    this._iCap = cap;
  }

  _pushVertXYZ(px, py, pz, nx, ny, nz, u, v) {
    this._ensureVerts(1);
    const idx = this.vertCount++;
    const po = idx * 3;
    const uo = idx * 2;
    this._pos[po] = px;
    this._pos[po + 1] = py;
    this._pos[po + 2] = pz;
    this._nrm[po] = nx;
    this._nrm[po + 1] = ny;
    this._nrm[po + 2] = nz;
    this._uvs[uo] = u;
    this._uvs[uo + 1] = v;
    if (py < this.minY) this.minY = py;
    if (py > this.maxY) this.maxY = py;
    this.sumX += px;
    this.sumY += py;
    this.sumZ += pz;
    return idx;
  }

  addQuad(p0, p1, p2, p3, uvScale = 0.25) {
    const x0 = p0[0], y0 = p0[1], z0 = p0[2];
    const x1 = p1[0], y1 = p1[1], z1 = p1[2];
    const x2 = p2[0], y2 = p2[1], z2 = p2[2];
    const x3 = p3[0], y3 = p3[1], z3 = p3[2];
    const e1x = x1 - x0, e1y = y1 - y0, e1z = z1 - z0;
    const e2x = x3 - x0, e2y = y3 - y0, e2z = z3 - z0;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
    const invNl = 1.0 / nl;
    nx *= invNl; ny *= invNl; nz *= invNl;
    const w = Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z) * uvScale;
    const h = Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z) * uvScale;

    this._ensureVerts(4);
    this._ensureIdx(6);
    const i0 = this._pushVertXYZ(x0, y0, z0, nx, ny, nz, 0, 0);
    const i1 = this._pushVertXYZ(x1, y1, z1, nx, ny, nz, w, 0);
    const i2 = this._pushVertXYZ(x2, y2, z2, nx, ny, nz, w, h);
    const i3 = this._pushVertXYZ(x3, y3, z3, nx, ny, nz, 0, h);
    const io = this.idxCount;
    const idx = this._idx;
    idx[io] = i0; idx[io + 1] = i1; idx[io + 2] = i2;
    idx[io + 3] = i0; idx[io + 4] = i2; idx[io + 5] = i3;
    this.idxCount = io + 6;
  }

  addTri(p0, p1, p2, uvScale = 0.25) {
    const x0 = p0[0], y0 = p0[1], z0 = p0[2];
    const x1 = p1[0], y1 = p1[1], z1 = p1[2];
    const x2 = p2[0], y2 = p2[1], z2 = p2[2];
    const e1x = x1 - x0, e1y = y1 - y0, e1z = z1 - z0;
    const e2x = x2 - x0, e2y = y2 - y0, e2z = z2 - z0;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
    const invNl = 1.0 / nl;
    nx *= invNl; ny *= invNl; nz *= invNl;
    const u1 = Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z) * uvScale;
    const v2 = Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z) * uvScale;

    this._ensureVerts(3);
    this._ensureIdx(3);
    const i0 = this._pushVertXYZ(x0, y0, z0, nx, ny, nz, 0, 0);
    const i1 = this._pushVertXYZ(x1, y1, z1, nx, ny, nz, u1, 0);
    const i2 = this._pushVertXYZ(x2, y2, z2, nx, ny, nz, 0, v2);
    const io = this.idxCount;
    const idx = this._idx;
    idx[io] = i0; idx[io + 1] = i1; idx[io + 2] = i2;
    this.idxCount = io + 3;
  }

  addHexahedron(bot, top, caps = true, uvScale = 0.25) {
    const upVec = sub3(top[0], bot[0]);
    const topN = cross3(sub3(top[1], top[0]), sub3(top[3], top[0]));
    let b = bot;
    let t = top;
    if (dot3(topN, upVec) < 0) {
      b = [bot[0], bot[3], bot[2], bot[1]];
      t = [top[0], top[3], top[2], top[1]];
    }
    for (let k = 0; k < 4; k++) {
      const kn = (k + 1) % 4;
      this.addQuad(b[k], b[kn], t[kn], t[k], uvScale);
    }
    if (caps) {
      this.addQuad(t[0], t[1], t[2], t[3], uvScale);
      this.addQuad(b[0], b[3], b[2], b[1], uvScale);
    }
  }

  addBox(cx, cy, cz, sx, sy, sz, caps = true, uvScale = 0.25) {
    const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
    const bot = [
      [cx - hx, cy - hy, cz - hz],
      [cx - hx, cy - hy, cz + hz],
      [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy - hy, cz - hz],
    ];
    const top = [
      [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy + hy, cz + hz],
      [cx + hx, cy + hy, cz + hz],
      [cx + hx, cy + hy, cz - hz],
    ];
    this.addHexahedron(bot, top, caps, uvScale);
  }

  addBoxBounds(x0, x1, y0, y1, z0, z1, caps = true, uvScale = 0.25) {
    const sx = Math.abs(x1 - x0);
    const sy = Math.abs(y1 - y0);
    const sz = Math.abs(z1 - z0);
    if (sx < 1e-4 || sy < 1e-4 || sz < 1e-4) return;
    this.addBox((x0 + x1) * 0.5, (y0 + y1) * 0.5, (z0 + z1) * 0.5, sx, sy, sz, caps, uvScale);
  }

  addBeamFrame(p0, p1, uAxis, vAxis, wU, wV, caps = true) {
    const hu = scale3(uAxis, wU * 0.5);
    const hv = scale3(vAxis, wV * 0.5);
    const cornersAt = (p) => [
      add3(p, add3(scale3(hu, -1), scale3(hv, -1))),
      add3(p, add3(scale3(hu, -1), hv)),
      add3(p, add3(hu, hv)),
      add3(p, add3(hu, scale3(hv, -1))),
    ];
    this.addHexahedron(cornersAt(p0), cornersAt(p1), caps);
  }

  addBeam(p0, p1, wU, wV, hintVec = [0, 1, 0], caps = true) {
    const d = sub3(p1, p0);
    const len = Math.hypot(d[0], d[1], d[2]);
    if (len < 1e-4) return;
    const tAxis = [d[0] / len, d[1] / len, d[2] / len];
    let uAxis = cross3(hintVec, tAxis);
    if (Math.hypot(uAxis[0], uAxis[1], uAxis[2]) < 1e-3) {
      uAxis = cross3([1, 0, 0], tAxis);
      if (Math.hypot(uAxis[0], uAxis[1], uAxis[2]) < 1e-3) {
        uAxis = cross3([0, 0, 1], tAxis);
      }
    }
    uAxis = norm3(uAxis);
    const vAxis = norm3(cross3(tAxis, uAxis));
    this.addBeamFrame(p0, p1, uAxis, vAxis, wU, wV, caps);
  }

  addCylinderPrism(cx, y0, y1, cz, rBot, rTop, sides = 16, rotOffset = 0, caps = true) {
    const bPts = [];
    const tPts = [];
    for (let i = 0; i < sides; i++) {
      const a = rotOffset + (i / sides) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      bPts.push([cx + ca * rBot, y0, cz + sa * rBot]);
      tPts.push([cx + ca * rTop, y1, cz + sa * rTop]);
    }
    for (let i = 0; i < sides; i++) {
      const inx = (i + 1) % sides;
      this.addQuad(bPts[inx], bPts[i], tPts[i], tPts[inx], 0.35);
    }
    if (caps) {
      const cTop = [cx, y1, cz];
      const cBot = [cx, y0, cz];
      for (let i = 0; i < sides; i++) {
        const inx = (i + 1) % sides;
        this.addTri(cTop, tPts[inx], tPts[i], 0.35);
        this.addTri(cBot, bPts[i], bPts[inx], 0.35);
      }
    }
  }

  addLatheProfile(cx, cz, profilePairs, sides = 20, rotOffset = 0, capBottom = false, capTop = false) {
    const rings = profilePairs.map(([r, y]) => {
      const pts = [];
      for (let i = 0; i < sides; i++) {
        const a = rotOffset + (i / sides) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
      }
      return pts;
    });

    for (let rIdx = 0; rIdx < rings.length - 1; rIdx++) {
      const lo = rings[rIdx];
      const hi = rings[rIdx + 1];
      for (let i = 0; i < sides; i++) {
        const inx = (i + 1) % sides;
        this.addQuad(lo[inx], lo[i], hi[i], hi[inx], 0.35);
      }
    }

    if (capBottom && rings.length > 0 && profilePairs[0][0] > 0.01) {
      const c = [cx, profilePairs[0][1], cz];
      const r0 = rings[0];
      for (let i = 0; i < sides; i++) {
        const inx = (i + 1) % sides;
        this.addTri(c, r0[i], r0[inx], 0.35);
      }
    }
    if (capTop && rings.length > 0 && profilePairs[rings.length - 1][0] > 0.01) {
      const c = [cx, profilePairs[rings.length - 1][1], cz];
      const rT = rings[rings.length - 1];
      for (let i = 0; i < sides; i++) {
        const inx = (i + 1) % sides;
        this.addTri(c, rT[inx], rT[i], 0.35);
      }
    }
  }

  isEmpty() {
    return this.vertCount === 0;
  }

  toBufferGeometry(THREE, recenterOffset = null) {
    const geom = new THREE.BufferGeometry();
    const vc3 = this.vertCount * 3;
    const vc2 = this.vertCount * 2;
    const posSlice = this._pos.slice(0, vc3);
    if (recenterOffset) {
      const ox = recenterOffset[0];
      const oy = recenterOffset[1];
      const oz = recenterOffset[2];
      for (let i = 0; i < vc3; i += 3) {
        posSlice[i] -= ox;
        posSlice[i + 1] -= oy;
        posSlice[i + 2] -= oz;
      }
    }
    geom.setAttribute('position', new THREE.BufferAttribute(posSlice, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(this._nrm.slice(0, vc3), 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(this._uvs.slice(0, vc2), 2));
    if (this.vertCount > 65535) {
      geom.setIndex(new THREE.BufferAttribute(this._idx.slice(0, this.idxCount), 1));
    } else {
      const idx16 = new Uint16Array(this.idxCount);
      const src = this._idx;
      for (let i = 0; i < this.idxCount; i++) idx16[i] = src[i];
      geom.setIndex(new THREE.BufferAttribute(idx16, 1));
    }
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    return geom;
  }
}

export class PieceBuilder {
  constructor() {
    this.buckets = new Map();
  }

  bucket(mat, userData = null) {
    const key = userData ? `${mat.uuid || mat.name || 'mat'}::${JSON.stringify(userData)}` : mat;
    let entry = this.buckets.get(key);
    if (!entry) {
      entry = { mat, geomB: new GeomBuilder(), userData };
      this.buckets.set(key, entry);
    }
    return entry.geomB;
  }

  finalize(THREE, meta) {
    let totalVerts = 0;
    let sumX = 0, sumY = 0, sumZ = 0;
    let yMin = Infinity, yMax = -Infinity;

    for (const { geomB: b } of this.buckets.values()) {
      if (b.isEmpty()) continue;
      totalVerts += b.vertCount;
      sumX += b.sumX;
      sumY += b.sumY;
      sumZ += b.sumZ;
      if (b.minY < yMin) yMin = b.minY;
      if (b.maxY > yMax) yMax = b.maxY;
    }

    const cx = totalVerts > 0 ? sumX / totalVerts : 0;
    const cy = totalVerts > 0 ? sumY / totalVerts : 0;
    const cz = totalVerts > 0 ? sumZ / totalVerts : 0;

    const grp = new THREE.Group();
    grp.name = meta.id;
    grp.position.set(cx, cy, cz);

    let meshCount = 0;
    let triCount = 0;
    for (const { mat, geomB: b, userData } of this.buckets.values()) {
      if (b.isEmpty()) continue;
      const geom = b.toBufferGeometry(THREE, [cx, cy, cz]);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `${meta.id}_${mat.name || meshCount}`;
      if (userData) Object.assign(mesh.userData, userData);
      mesh.castShadow = !mat.transparent;
      mesh.receiveShadow = true;
      grp.add(mesh);
      meshCount++;
      triCount += b.idxCount / 3;
    }

    return {
      piece: {
        id: meta.id,
        label: meta.label,
        object3D: grp,
        phase: meta.phase,
        span: meta.span,
        vanishSpan: meta.vanishSpan || null,
        category: meta.category || 'permanent',
        yMin: Number.isFinite(yMin) ? Number(yMin.toFixed(3)) : 0,
        yMax: Number.isFinite(yMax) ? Number(yMax.toFixed(3)) : 0,
        photoRefs: meta.photoRefs || [],
      },
      vertCount: totalVerts,
      triCount,
      meshCount,
    };
  }
}

/**
 * Generates a pointed Uyghur / Central-Asian 4-centered Iwan / Riwaq arch spandrel wall
 * facing either `+Z/-Z` (axis = 'x', width along X, thickness along Z) or `+X/-X` (axis = 'z').
 */
export function addPointedArchBay(
  wallB,
  trimB,
  {
    cx,
    cz,
    yBase,
    yTop,
    bayWidth,
    archWidth,
    ySpring,
    yCrown,
    depth,
    axis = 'x',
    segments = 10,
  }
) {
  const halfBay = bayWidth * 0.5;
  const halfArch = Math.min(archWidth * 0.5, halfBay - 0.12);
  const pierW = halfBay - halfArch;
  const hd = depth * 0.5;

  const boxFromLocal = (u0, u1, v0, v1, dHalf = hd, targetB = wallB) => {
    if (axis === 'x') {
      targetB.addBoxBounds(cx + u0, cx + u1, v0, v1, cz - dHalf, cz + dHalf);
    } else {
      targetB.addBoxBounds(cx - dHalf, cx + dHalf, v0, v1, cz + u0, cz + u1);
    }
  };

  // Flanking masonry piers
  if (pierW > 0.04) {
    boxFromLocal(-halfBay, -halfArch, yBase, yTop);
    boxFromLocal(halfArch, halfBay, yBase, yTop);
  }
  // Spandrel header above crown
  if (yTop > yCrown + 0.03) {
    boxFromLocal(-halfArch, halfArch, yCrown, yTop);
  }

  // Pointed arch spandrel haunches stepped from ySpring -> yCrown
  const archRise = Math.max(0.25, yCrown - ySpring);
  for (let side of [-1, +1]) {
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      // Pointed ogival curve: x(t) = halfArch * (1 - t^1.35), y(t) = ySpring + archRise * sin(t * pi/2)^0.85
      const xIn0 = halfArch * Math.pow(1 - t0, 0.78);
      const xIn1 = halfArch * Math.pow(1 - t1, 0.78);
      const yA = ySpring + archRise * Math.pow(t0, 0.85);
      const yB = ySpring + archRise * Math.pow(t1, 0.85);
      const uInner = Math.max(0, Math.min(xIn0, xIn1));
      const uOuter = halfArch;
      if (uOuter - uInner > 0.015 && yB - yA > 0.015) {
        if (side < 0) {
          boxFromLocal(-uOuter, -uInner, yA, yB);
        } else {
          boxFromLocal(uInner, uOuter, yA, yB);
        }
      }
      if (trimB) {
        const uT0 = side * (xIn0 + 0.01);
        const uT1 = side * (xIn1 + 0.01);
        const p0 = axis === 'x' ? [cx + uT0, yA, cz] : [cx, yA, cz + uT0];
        const p1 = axis === 'x' ? [cx + uT1, yB, cz] : [cx, yB, cz + uT1];
        const hint = axis === 'x' ? [0, 0, 1] : [1, 0, 0];
        trimB.addBeam(p0, p1, depth + 0.08, 0.14, hint, true);
      }
    }
  }
}

/**
 * Generates an Islamic ribbed melon / onion dome atop a cylindrical drum.
 */
export function addRibbedDome(domeB, ribB, { cx, cz, yBase, radius, height, sides = 20, ribs = 10 }) {
  const rings = [];
  const profile = [
    [radius * 1.02, yBase],
    [radius * 1.07, yBase + height * 0.22],
    [radius * 1.02, yBase + height * 0.45],
    [radius * 0.82, yBase + height * 0.68],
    [radius * 0.50, yBase + height * 0.86],
    [radius * 0.18, yBase + height * 0.96],
    [0.02, yBase + height],
  ];
  for (const [r, y] of profile) {
    rings.push([r, y]);
  }
  domeB.addLatheProfile(cx, cz, rings, sides, 0, false, false);

  if (ribB) {
    for (let k = 0; k < ribs; k++) {
      const a = (k / ribs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let j = 0; j < rings.length - 1; j++) {
        const [r0, y0] = rings[j];
        const [r1, y1] = rings[j + 1];
        ribB.addBeam(
          [cx + ca * r0 * 1.01, y0, cz + sa * r0 * 1.01],
          [cx + ca * r1 * 1.01, y1, cz + sa * r1 * 1.01],
          0.09,
          0.09,
          [ca, 0, sa],
          false
        );
      }
    }
  }
}

/**
 * Adds a hammered brass mast with three stacked spheres (`alem`) and crescent moon (`hilal`).
 */
export function addCrescentFinial(brassB, { cx, cz, yBase, height = 2.1, facingAxis = 'z' }) {
  const mastTop = yBase + height * 0.78;
  brassB.addCylinderPrism(cx, yBase, mastTop, cz, 0.08, 0.035, 8, 0, true);
  // Three ceremonial alem spheres
  for (const [f, r] of [[0.22, 0.19], [0.46, 0.14], [0.68, 0.10]]) {
    const yc = yBase + height * f;
    brassB.addLatheProfile(
      cx,
      cz,
      [
        [0.03, yc - r],
        [r, yc - r * 0.2],
        [r, yc + r * 0.2],
        [0.03, yc + r],
      ],
      10
    );
  }
  // Open upturned Crescent Moon (`Hilal`)
  const cy = mastTop + height * 0.16;
  const rCres = height * 0.22;
  const arcSteps = 10;
  for (let i = 0; i < arcSteps; i++) {
    const a0 = -Math.PI * 0.85 + (i / arcSteps) * (Math.PI * 1.70);
    const a1 = -Math.PI * 0.85 + ((i + 1) / arcSteps) * (Math.PI * 1.70);
    const thick0 = 0.065 * Math.cos(a0 * 0.45);
    const dx0 = Math.sin(a0) * rCres;
    const dy0 = -Math.cos(a0) * rCres;
    const dx1 = Math.sin(a1) * rCres;
    const dy1 = -Math.cos(a1) * rCres;
    if (facingAxis === 'z') {
      brassB.addBeam([cx + dx0, cy + dy0, cz], [cx + dx1, cy + dy1, cz], Math.max(0.03, thick0), 0.06, [0, 0, 1], true);
    } else {
      brassB.addBeam([cx, cy + dy0, cz + dx0], [cx, cy + dy1, cz + dx1], Math.max(0.03, thick0), 0.06, [1, 0, 0], true);
    }
  }
}

/**
 * Adds stepped Kashgar brick roof crenellations (`merlons`) along an edge.
 */
export function addCrenellationRow(brickB, trimB, { x0, x1, z0, z1, yBase, height = 0.72, thick = 0.36, count = 12, axis = 'x' }) {
  const step = 1.0 / Math.max(1, count);
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) * step;
    const px = x0 + (x1 - x0) * u;
    const pz = z0 + (z1 - z0) * u;
    const merlonW = axis === 'x' ? Math.abs(x1 - x0) * step * 0.54 : thick;
    const merlonD = axis === 'z' ? Math.abs(z1 - z0) * step * 0.54 : thick;
    brickB.addBox(px, yBase + height * 0.35, pz, merlonW, height * 0.7, merlonD);
    if (trimB) {
      trimB.addBox(px, yBase + height * 0.82, pz, merlonW * 0.62, height * 0.28, merlonD * 0.62);
    }
  }
}

/**
 * Adds a traditional Uyghur carved walnut `panjara` wooden lattice screen frame.
 */
export function addPanjaraScreen(woodB, frameB, { cx, cz, yBase, yTop, width, depth = 0.16, axis = 'x', cols = 4, rows = 4 }) {
  const h = yTop - yBase;
  const hw = width * 0.5;
  const box = (u0, u1, v0, v1, d, targetB) => {
    if (axis === 'x') {
      targetB.addBoxBounds(cx + u0, cx + u1, v0, v1, cz - d * 0.5, cz + d * 0.5);
    } else {
      targetB.addBoxBounds(cx - d * 0.5, cx + d * 0.5, v0, v1, cz + u0, cz + u1);
    }
  };

  // Outer carved frame rails & stiles
  box(-hw, -hw + 0.14, yBase, yTop, depth, frameB);
  box(hw - 0.14, hw, yBase, yTop, depth, frameB);
  box(-hw, hw, yBase, yBase + 0.16, depth, frameB);
  box(-hw, hw, yTop - 0.16, yTop, depth, frameB);

  const innerW = width - 0.28;
  const innerH = h - 0.32;
  for (let c = 1; c < cols; c++) {
    const u = -innerW * 0.5 + (c / cols) * innerW;
    box(u - 0.03, u + 0.03, yBase + 0.16, yTop - 0.16, depth * 0.55, woodB);
  }
  for (let r = 1; r < rows; r++) {
    const v = yBase + 0.16 + (r / rows) * innerH;
    box(-innerW * 0.5, innerW * 0.5, v - 0.03, v + 0.03, depth * 0.55, woodB);
  }
}
