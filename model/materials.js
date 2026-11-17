/**
 * Kashgar Id Kah Mosque Architectural PBR Material Library (`model/materials.js`)
 *
 * Synthesizes authentic Uyghur / Central Asian architectural surface trios (Albedo, Normal,
 * Roughness/AO) for all 5 construction & architectural zones of Id Kah Mosque (1442–present):
 *   - Saffron-ochre kiln brick (`ochreBrick` — iconic sunlit yellow-ochre East gatehouse & minarets)
 *   - Glazed turquoise & cobalt Kashi ceramic tilework (`turquoiseTile`, `cobaltTile`)
 *   - Carved pale gypsum plaster panels & niches (`carvedPlaster`)
 *   - Deep emerald-jade lacquered cedar pillars (`namazgahGreenWood`)
 *   - Carved walnut portals, Minbar & panjara lattice screens (`carvedWalnutWood`)
 *   - Dressed Kashgar sandstone plinths & Howz coping (`carvedStonePlinth`, `masonryAshlar`)
 *   - Octagonal kiln-fired courtyard brick pavers (`courtyardPaver`)
 *   - Hammered brass crescents & hanging lanterns (`brassCrescent`, `goldAccent`)
 *   - Compacted oasis roof loam (`roofTerraceEarth`, `concreteSub`)
 *   - Poplar scaffolding, bark & dappled summer foliage (`woodTimberTemp`, `poplarBark`, `poplarFoliage`)
 *   - Clear rippled Howz ablution water (`howzWater`)
 *
 * Strict Compliance:
 *   - 100% Real Light Response Only (`emissive = 0x000000`, `emissiveIntensity = 0.0`, `0` AdditiveBlending)
 *   - Self-Contained Offline WebGL + Web Worker (`synthesizeTowerPbrRawBank` / `hydrateTowerPbrBank`)
 */

import {
  attachWorldSurfacePbr,
  getFloorTextureBank,
} from './floor_textures.js';

let _cachedTowerPbrBank = null;
const _noiseGridCache = new Map();

function hash2i(ix, iy, seed = 1) {
  let n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function smooth01(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function getNoiseGrid(period, seed) {
  const key = (period << 16) ^ seed;
  let grid = _noiseGridCache.get(key);
  if (!grid) {
    grid = new Float64Array(period * period);
    for (let cy = 0; cy < period; cy++) {
      const row = cy * period;
      for (let cx = 0; cx < period; cx++) {
        grid[row + cx] = hash2i(cx, cy, seed);
      }
    }
    _noiseGridCache.set(key, grid);
  }
  return grid;
}

function tileNoise(u, v, period, seed) {
  const grid = getNoiseGrid(period, seed);
  const x = u * period;
  const y = v * period;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  let x0 = ix % period;
  if (x0 < 0) x0 += period;
  let y0 = iy % period;
  if (y0 < 0) y0 += period;
  const x1 = x0 + 1 === period ? 0 : x0 + 1;
  const y1 = y0 + 1 === period ? 0 : y0 + 1;
  const r0 = y0 * period;
  const r1 = y1 * period;
  const n00 = grid[r0 + x0];
  const n10 = grid[r0 + x1];
  const n01 = grid[r1 + x0];
  const n11 = grid[r1 + x1];
  return (n00 + (n10 - n00) * sx) * (1 - sy) + (n01 + (n11 - n01) * sx) * sy;
}

function buildSurfaceTrioRaw(size, slopeScale, sampleFn) {
  const N = size * size;
  const heights = new Float32Array(N);
  const albedoBytes = new Uint8Array(N * 4);
  const roughAoBytes = new Uint8Array(N * 4);
  const normalBytes = new Uint8Array(N * 4);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const invSize = 1.0 / size;

  for (let y = 0; y < size; y++) {
    const v = y * invSize;
    const row = y * size;
    for (let x = 0; x < size; x++) {
      const u = x * invSize;
      const idx = row + x;
      const p = sampleFn(u, v, x, y, size);
      heights[idx] = p.h;
      const o = idx << 2;
      const ar = clampByte(p.albR);
      const ag = clampByte(p.albG);
      const ab = clampByte(p.albB);
      albedoBytes[o] = ar;
      albedoBytes[o + 1] = ag;
      albedoBytes[o + 2] = ab;
      albedoBytes[o + 3] = 255;
      sumR += ar;
      sumG += ag;
      sumB += ab;

      roughAoBytes[o] = clampByte(clamp01(p.ao) * 255);
      roughAoBytes[o + 1] = clampByte(clamp01(p.rough) * 255);
      roughAoBytes[o + 2] = clampByte(clamp01(p.sheen ?? 0.5) * 255);
      roughAoBytes[o + 3] = 255;
    }
  }

  const targetMean = 244.0;
  const gainR = targetMean / Math.max(64.0, sumR / N);
  const gainG = targetMean / Math.max(64.0, sumG / N);
  const gainB = targetMean / Math.max(64.0, sumB / N);
  for (let i = 0; i < N * 4; i += 4) {
    albedoBytes[i] = clampByte(albedoBytes[i] * gainR);
    albedoBytes[i + 1] = clampByte(albedoBytes[i + 1] * gainG);
    albedoBytes[i + 2] = clampByte(albedoBytes[i + 2] * gainB);
  }

  const sobelScale = 0.125 * slopeScale;
  for (let y = 0; y < size; y++) {
    const ym = (y === 0 ? size - 1 : y - 1) * size;
    const yc = y * size;
    const yp = (y + 1 === size ? 0 : y + 1) * size;
    for (let x = 0; x < size; x++) {
      const xm = x === 0 ? size - 1 : x - 1;
      const xp = x + 1 === size ? 0 : x + 1;
      const hTL = heights[ym + xm];
      const hT = heights[ym + x];
      const hTR = heights[ym + xp];
      const hL = heights[yc + xm];
      const hR = heights[yc + xp];
      const hBL = heights[yp + xm];
      const hB = heights[yp + x];
      const hBR = heights[yp + xp];

      const nx = -((hTR + 2.0 * hR + hBR) - (hTL + 2.0 * hL + hBL)) * sobelScale;
      const ny = -((hBL + 2.0 * hB + hBR) - (hTL + 2.0 * hT + hTR)) * sobelScale;
      const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + 1.0);
      const o = (yc + x) << 2;
      normalBytes[o] = clampByte((nx * invLen * 0.5 + 0.5) * 255);
      normalBytes[o + 1] = clampByte((ny * invLen * 0.5 + 0.5) * 255);
      normalBytes[o + 2] = clampByte((invLen * 0.5 + 0.5) * 255);
      normalBytes[o + 3] = 255;
    }
  }

  return { size, albedoBytes, normalBytes, roughAoBytes };
}

function wrapSurfaceTrio(THREE, raw, maxAniso) {
  const { size, albedoBytes, normalBytes, roughAoBytes } = raw;
  const mk = (bytes, srgb) => {
    const tex = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (srgb && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.NoColorSpace) tex.colorSpace = THREE.NoColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = maxAniso;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    albedoMap: mk(albedoBytes, true),
    normalMap: mk(normalBytes, false),
    roughnessMap: mk(roughAoBytes, false),
  };
}

export function synthesizeTowerPbrRawBank() {
  // 1. Kashgar Saffron-Ochre Fired Brick & Earth-Wash Stucco (`512x512`)
  const ochreBrick = buildSurfaceTrioRaw(512, 6.0, (u, v, _x, _y, size) => {
    const courses = 16;
    const bricksPerRow = 8;
    const cyF = v * courses;
    const course = Math.floor(cyF);
    const fy = cyF - course;
    const uShift = (u + (course % 2) * (0.5 / bricksPerRow)) % 1.0;
    const bxF = uShift * bricksPerRow;
    const brickIdx = Math.floor(bxF);
    const fx = bxF - brickIdx;

    const jointPx = Math.min(
      Math.min(fy, 1.0 - fy) * (size / courses),
      Math.min(fx, 1.0 - fx) * (size / bricksPerRow)
    );
    const bRand = hash2i(brickIdx, course, 2101);
    const clayGrain = tileNoise(u, v, 64, 2113) * 0.6 + tileNoise(u, v, 128, 2129) * 0.4;
    const trowelWash = tileNoise(u, v, 16, 2141);

    let h = 0.72 + (bRand - 0.5) * 0.08 + clayGrain * 0.14 + (trowelWash - 0.5) * 0.06;
    let rough = clamp01(0.84 - clayGrain * 0.08 + (1.0 - trowelWash) * 0.06);
    let ao = clamp01(0.86 + clayGrain * 0.10);
    let lum = 240 + (bRand - 0.5) * 20 + (clayGrain - 0.5) * 16 + (trowelWash - 0.5) * 10;

    if (jointPx < 2.2) {
      const jt = jointPx / 2.2;
      h = 0.24 + jt * 0.22;
      rough = 0.94;
      ao = 0.52 + jt * 0.20;
      lum = 208 + jt * 14;
    } else if (jointPx < 4.2) {
      const bev = smooth01((jointPx - 2.2) / 2.0);
      h = 0.46 + bev * (h - 0.46);
      ao = 0.72 + bev * (ao - 0.72);
    }

    return {
      h,
      albR: lum + 5,
      albG: lum + 1,
      albB: lum - 6,
      rough,
      ao,
    };
  });

  // 2. Kashi Glazed Mosaic Ceramic Tile (`256x256` turquoise/cobalt star-girih geometric sheen)
  const glazedTile = buildSurfaceTrioRaw(256, 4.8, (u, v, _x, _y, size) => {
    const tiles = 8;
    const fx = (u * tiles) % 1.0;
    const fy = (v * tiles) % 1.0;
    const tx = Math.floor(u * tiles);
    const ty = Math.floor(v * tiles);
    const groutPx = Math.min(Math.min(fx, 1.0 - fx), Math.min(fy, 1.0 - fy)) * (size / tiles);

    // Subtle Islamic star-and-diamond girih bevel inside each glazed ceramic square
    const cx = Math.abs(fx - 0.5) * 2.0;
    const cy = Math.abs(fy - 0.5) * 2.0;
    const diamond = clamp01(1.0 - (cx + cy) * 0.78);
    const ring = Math.sin(Math.hypot(fx - 0.5, fy - 0.5) * Math.PI * 6.0) * 0.5 + 0.5;
    const tRand = hash2i(tx, ty, 2203);
    const glazeRipple = tileNoise(u, v, 32, 2213);

    let h = 0.80 + diamond * 0.08 + ring * 0.04 + (glazeRipple - 0.5) * 0.04;
    let rough = clamp01(0.20 + (1.0 - glazeRipple) * 0.08);
    let ao = clamp01(0.92 + ring * 0.06);
    let lum = 240 + (tRand - 0.5) * 18 + (diamond - 0.5) * 14;

    if (groutPx < 2.1) {
      h = 0.16;
      rough = 0.88;
      ao = 0.48;
      lum = 188;
    }

    return {
      h,
      albR: lum,
      albG: lum + 2,
      albB: lum + 4,
      rough,
      ao,
      sheen: 0.88,
    };
  });

  // 3. Carved Pale Gypsum Plaster Panels & Muqarnas Relief (`256x256`)
  const carvedPlaster = buildSurfaceTrioRaw(256, 4.6, (u, v) => {
    const cellU = (u * 6.0) % 1.0;
    const cellV = (v * 6.0) % 1.0;
    const oct = Math.max(
      Math.abs(cellU - 0.5),
      Math.abs(cellV - 0.5),
      (Math.abs(cellU - 0.5) + Math.abs(cellV - 0.5)) * 0.707
    );
    const recess = smooth01((0.38 - oct) * 8.0);
    const fineGrit = tileNoise(u, v, 64, 2309);
    const h = 0.45 + 0.40 * (1.0 - recess) + fineGrit * 0.10;
    const rough = clamp01(0.84 - (1.0 - recess) * 0.06);
    const ao = clamp01(0.68 + 0.30 * (1.0 - recess));
    const lum = 240 - recess * 22 + (fineGrit - 0.5) * 12;
    return { h, albR: lum + 2, albG: lum, albB: lum - 3, rough, ao };
  });

  // 4. Uyghur Carved Walnut & Lacquered Green Timber Joinery (`256x256`)
  const timberJoinery = buildSurfaceTrioRaw(256, 4.5, (u, v) => {
    const grain = tileNoise(u * 4.0, v * 0.5, 64, 2401);
    const ring = 0.5 + 0.5 * Math.sin(u * Math.PI * 22.0 + grain * 4.8);
    const pores = tileNoise(u * 2.0, v, 128, 2417);
    const h = 0.55 + ring * 0.25 + (pores - 0.5) * 0.14;
    const rough = clamp01(0.48 + (1.0 - ring) * 0.14 + (1.0 - pores) * 0.10);
    const ao = clamp01(0.78 + ring * 0.16 + pores * 0.06);
    const lum = 238 + ring * 18 + (pores - 0.5) * 14;
    return { h, albR: lum + 3, albG: lum + 2, albB: lum - 4, rough, ao };
  });

  // 5. Rough Poplar Scaffold Timber (`256x256`)
  const scaffoldPine = buildSurfaceTrioRaw(256, 5.2, (u, v) => {
    const grain = tileNoise(u * 3.0, v * 0.4, 48, 2503);
    const barkKnot = Math.sin(u * Math.PI * 16.0 + grain * 5.2);
    const h = 0.52 + barkKnot * 0.16 + (grain - 0.5) * 0.20;
    const rough = clamp01(0.86 - grain * 0.10);
    const ao = clamp01(0.72 + grain * 0.22);
    const lum = 236 + barkKnot * 12 + (grain - 0.5) * 20;
    return { h, albR: lum + 4, albG: lum + 1, albB: lum - 5, rough, ao };
  });

  // 6. Hammered Silk Road Brass & Copper Crescents / Lanternwork (`256x256`)
  const hammeredBrass = buildSurfaceTrioRaw(256, 3.4, (u, v) => {
    const d1 = tileNoise(u, v, 24, 2609);
    const d2 = tileNoise(u, v, 64, 2621);
    const h = 0.58 + d1 * 0.22 + d2 * 0.10;
    const rough = clamp01(0.32 + (1.0 - d1) * 0.16);
    const ao = clamp01(0.84 + d1 * 0.14);
    const lum = 242 + (d1 - 0.5) * 18;
    return { h, albR: lum + 5, albG: lum + 1, albB: lum - 8, rough, ao };
  });

  // 7. Crown Glass Wave Normal Map (`256x256`)
  const crownGlassWave = buildSurfaceTrioRaw(256, 2.2, (u, v) => {
    const w = Math.sin(u * Math.PI * 8.0 + tileNoise(u, v, 8, 2701) * 2.5) * 0.18 +
      tileNoise(u, v, 32, 2713) * 0.12;
    return { h: 0.5 + w, albR: 244, albG: 244, albB: 244, rough: 0.10, ao: 0.98 };
  });

  // 8. Courtyard Kiln-Brick Herringbone / Running-Bond Paver (`256x256`)
  const courtyardPaver = buildSurfaceTrioRaw(256, 5.6, (u, v, _x, _y, size) => {
    const grid = 6;
    const fx = (u * grid) % 1.0;
    const fy = (v * grid) % 1.0;
    const bx = Math.floor(u * grid);
    const by = Math.floor(v * grid);
    const jointPx = Math.min(Math.min(fx, 1.0 - fx), Math.min(fy, 1.0 - fy)) * (size / grid);
    const tone = hash2i(bx, by, 2801);
    const grit = tileNoise(u, v, 64, 2819);

    let h = 0.78 + (tone - 0.5) * 0.08 + grit * 0.10;
    let rough = clamp01(0.82 - grit * 0.08);
    let ao = clamp01(0.86 + grit * 0.12);
    let lum = 238 + (tone - 0.5) * 22 + (grit - 0.5) * 14;

    if (jointPx < 2.2) {
      h = 0.16;
      rough = 0.95;
      ao = 0.44;
      lum = 190;
    }

    return { h, albR: lum + 2, albG: lum, albB: lum - 3, rough, ao };
  });

  // 9. Foliage / Bark Dappled Organic Micro-Texture (`256x256`)
  const foliageLeaf = buildSurfaceTrioRaw(256, 4.2, (u, v) => {
    const n1 = tileNoise(u, v, 16, 2903);
    const n2 = tileNoise(u, v, 64, 2917);
    const h = 0.40 + n1 * 0.36 + n2 * 0.24;
    const rough = clamp01(0.84 - n2 * 0.12);
    const ao = clamp01(0.62 + n1 * 0.36);
    const lum = 234 + (h - 0.5) * 34;
    return { h, albR: lum - 2, albG: lum + 3, albB: lum - 3, rough, ao };
  });

  return {
    ochreBrick,
    glazedTile,
    carvedPlaster,
    timberJoinery,
    scaffoldPine,
    hammeredBrass,
    crownGlassWave,
    courtyardPaver,
    foliageLeaf,
  };
}

export function hydrateTowerPbrBank(THREE, rawBank, maxAniso = 8) {
  if (_cachedTowerPbrBank) return _cachedTowerPbrBank;
  const raw = rawBank || synthesizeTowerPbrRawBank();
  _cachedTowerPbrBank = {
    ochreBrick: wrapSurfaceTrio(THREE, raw.ochreBrick, maxAniso),
    glazedTile: wrapSurfaceTrio(THREE, raw.glazedTile, maxAniso),
    carvedPlaster: wrapSurfaceTrio(THREE, raw.carvedPlaster, maxAniso),
    timberJoinery: wrapSurfaceTrio(THREE, raw.timberJoinery, maxAniso),
    scaffoldPine: wrapSurfaceTrio(THREE, raw.scaffoldPine, maxAniso),
    hammeredBrass: wrapSurfaceTrio(THREE, raw.hammeredBrass, maxAniso),
    crownGlassWave: wrapSurfaceTrio(THREE, raw.crownGlassWave, maxAniso),
    courtyardPaver: wrapSurfaceTrio(THREE, raw.courtyardPaver, maxAniso),
    foliageLeaf: wrapSurfaceTrio(THREE, raw.foliageLeaf, maxAniso),
  };
  return _cachedTowerPbrBank;
}

export function getTowerPbrBank(THREE, maxAniso = 8) {
  if (_cachedTowerPbrBank) return _cachedTowerPbrBank;
  return hydrateTowerPbrBank(THREE, synthesizeTowerPbrRawBank(), maxAniso);
}

export function createMaterials(THREE, { maxAnisotropy = 8 } = {}) {
  const towerBank = getTowerPbrBank(THREE, maxAnisotropy);
  const floorBank = getFloorTextureBank(THREE, maxAnisotropy);

  const mkMosqueTri = (name, colorHex, roughness, metalness, envMapIntensity, side, triOpts) => {
    const mat = new THREE.MeshStandardMaterial({
      name,
      color: colorHex,
      roughness,
      metalness,
      envMapIntensity,
      side,
    });
    mat.emissive.setHex(0x000000);
    mat.emissiveIntensity = 0.0;
    return attachWorldSurfacePbr(THREE, mat, {
      secondaryScaleRatio: 0.0,
      enableRadialMist: false,
      ...triOpts,
    });
  };

  // 1. Iconic Sunlit Saffron-Ochre Fired Brick & Stucco (East Gatehouse, Minarets, Perimeter Parapet)
  const ochreBrick = mkMosqueTri('ochreBrick', 0xdba751, 0.84, 0.02, 0.86, THREE.DoubleSide, {
    pbrTrio: towerBank.ochreBrick,
    tileMeters: [2.40, 2.20],
    albedoStrength: 0.78,
    normalStrength: 1.05,
    roughnessStrength: 0.90,
    aoStrength: 0.76,
  });

  // 2. Glazed Turquoise-Teal Kashi Ceramic Tilework (Iwan Arch Bands, Drum Pavilion Dome, Minaret Bands)
  const turquoiseTile = attachWorldSurfacePbr(
    THREE,
    new THREE.MeshPhysicalMaterial({
      name: 'turquoiseTile',
      color: 0x2f8e94,
      roughness: 0.24,
      metalness: 0.06,
      clearcoat: 0.62,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.25,
      side: THREE.DoubleSide,
    }),
    {
      pbrTrio: towerBank.glazedTile,
      tileMeters: [1.40, 1.40],
      albedoStrength: 0.65,
      normalStrength: 0.88,
      roughnessStrength: 0.82,
      aoStrength: 0.65,
      enableRadialMist: false,
    }
  );

  // 3. Deep Lapis / Cobalt Glazed Tile Accents (Iwan Inscription Spandrels & Mihrab Border)
  const cobaltTile = attachWorldSurfacePbr(
    THREE,
    new THREE.MeshPhysicalMaterial({
      name: 'cobaltTile',
      color: 0x264b75,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.58,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.20,
      side: THREE.DoubleSide,
    }),
    {
      pbrTrio: towerBank.glazedTile,
      tileMeters: [1.20, 1.20],
      albedoStrength: 0.62,
      normalStrength: 0.84,
      roughnessStrength: 0.80,
      aoStrength: 0.64,
      enableRadialMist: false,
    }
  );

  // 4. Warm Cream-Ivory Carved Gypsum Plaster (Niche Backing, Arch Borders, Riwaq Facades)
  const carvedPlaster = mkMosqueTri('carvedPlaster', 0xdfd4bf, 0.82, 0.01, 0.88, THREE.DoubleSide, {
    pbrTrio: towerBank.carvedPlaster,
    tileMeters: [1.80, 1.80],
    albedoStrength: 0.68,
    normalStrength: 0.92,
    roughnessStrength: 0.88,
    aoStrength: 0.74,
  });

  // 5. Traditional Deep Jade-Green Lacquered Namazgah Pillars & Ceiling Framing
  const namazgahGreenWood = attachWorldSurfacePbr(
    THREE,
    new THREE.MeshPhysicalMaterial({
      name: 'namazgahGreenWood',
      color: 0x2e5848,
      roughness: 0.48,
      metalness: 0.05,
      clearcoat: 0.24,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.02,
      side: THREE.DoubleSide,
    }),
    {
      pbrTrio: towerBank.timberJoinery,
      tileMeters: [1.40, 2.80],
      albedoStrength: 0.68,
      normalStrength: 0.84,
      roughnessStrength: 0.86,
      aoStrength: 0.72,
      verticalGrain: true,
      enableRadialMist: false,
    }
  );

  // 6. Rich Carved Central-Asian Walnut Timber (Monumental Iwan Doors, Minbar, Panjara Screens, Coffers)
  const carvedWalnutWood = mkMosqueTri('carvedWalnutWood', 0x6c4b32, 0.58, 0.04, 0.96, THREE.DoubleSide, {
    pbrTrio: towerBank.timberJoinery,
    tileMeters: [1.50, 1.50],
    albedoStrength: 0.78,
    normalStrength: 0.96,
    roughnessStrength: 0.88,
    aoStrength: 0.78,
    verticalGrain: true,
  });

  // 7. Dressed Kashgar Limestone / Sandstone Plinths, Step Edges, Column Footings & Howz Coping
  const carvedStonePlinth = mkMosqueTri('carvedStonePlinth', 0xd2c7b1, 0.80, 0.02, 0.92, THREE.DoubleSide, {
    pbrTrio: floorBank.ashlarMasonry,
    tileMeters: [2.80, 2.60],
    albedoStrength: 0.84,
    normalStrength: 1.08,
    roughnessStrength: 0.90,
    aoStrength: 0.80,
  });

  // 8. Courtyard Kiln-Fired Buff Brick Pavers
  const courtyardPaver = mkMosqueTri('courtyardPaver', 0xc9beaa, 0.84, 0.01, 0.88, THREE.DoubleSide, {
    pbrTrio: towerBank.courtyardPaver,
    tileMeters: [2.20, 2.20],
    secondaryScaleRatio: 0.31,
    albedoStrength: 0.82,
    normalStrength: 1.04,
    roughnessStrength: 0.90,
    aoStrength: 0.76,
  });

  // 9. Hammered Brass Crescents (Hilal) & Hanging Sanctuary Lanterns (`0` emissive!)
  const brassCrescent = mkMosqueTri('brassCrescent', 0xb8944a, 0.34, 0.76, 1.32, THREE.DoubleSide, {
    pbrTrio: towerBank.hammeredBrass,
    tileMeters: [1.10, 1.10],
    albedoStrength: 0.58,
    normalStrength: 0.70,
    roughnessStrength: 0.84,
    aoStrength: 0.55,
  });

  // 10. Compacted Loam Roof Terraces & Rammed-Earth Footing Cores
  const roofTerraceEarth = mkMosqueTri('roofTerraceEarth', 0x9b8b72, 0.92, 0.01, 0.76, THREE.DoubleSide, {
    pbrTrio: floorBank.excavationEarth,
    tileMeters: [2.20, 2.20],
    secondaryScaleRatio: 0.29,
    albedoStrength: 0.86,
    normalStrength: 1.12,
    roughnessStrength: 0.92,
    aoStrength: 0.78,
  });

  // 11. Temporary Poplar Pole Falsework Scaffolds (`vanishSpan`)
  const woodTimberTemp = mkMosqueTri('woodTimberTemp', 0xb4a48b, 0.86, 0.00, 0.76, THREE.DoubleSide, {
    pbrTrio: towerBank.scaffoldPine,
    tileMeters: [2.40, 1.60],
    albedoStrength: 0.88,
    normalStrength: 1.02,
    roughnessStrength: 0.90,
    aoStrength: 0.78,
    verticalGrain: true,
  });

  // 12. Courtyard Poplar & Plane Tree Trunks / Foliage
  const poplarBark = mkMosqueTri('poplarBark', 0x706556, 0.90, 0.00, 0.78, THREE.DoubleSide, {
    pbrTrio: towerBank.scaffoldPine,
    tileMeters: [1.60, 2.20],
    albedoStrength: 0.84,
    normalStrength: 1.05,
    roughnessStrength: 0.90,
    aoStrength: 0.78,
    verticalGrain: true,
  });

  const poplarFoliage = mkMosqueTri('poplarFoliage', 0x5c724d, 0.84, 0.00, 0.84, THREE.DoubleSide, {
    pbrTrio: towerBank.foliageLeaf,
    tileMeters: [1.40, 1.40],
    albedoStrength: 0.78,
    normalStrength: 0.95,
    roughnessStrength: 0.88,
    aoStrength: 0.76,
  });

  // 13. Central Ablution Pool (`Howz`) Clear Jade-Slate Water
  const howzWater = new THREE.MeshPhysicalMaterial({
    name: 'howzWater',
    color: 0x3f6b6c,
    transparent: true,
    opacity: 0.84,
    roughness: 0.10,
    metalness: 0.06,
    ior: 1.33,
    reflectivity: 0.86,
    clearcoat: 0.78,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.40,
    normalMap: floorBank.waterRipple.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    side: THREE.DoubleSide,
  });
  howzWater.emissive.setHex(0x000000);
  howzWater.emissiveIntensity = 0.0;

  // 14. Clear Lead-Framed Glass (Gallery Clerestories & Hanging Sanctuary Lantern Globes)
  const glass1889 = new THREE.MeshPhysicalMaterial({
    name: 'glass1889',
    color: 0xcfd6d2,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
    metalness: 0.02,
    ior: 1.52,
    reflectivity: 0.72,
    clearcoat: 0.45,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.32,
    normalMap: towerBank.crownGlassWave.normalMap,
    normalScale: new THREE.Vector2(0.18, 0.18),
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  glass1889.emissive.setHex(0x000000);
  glass1889.emissiveIntensity = 0.0;

  // Compatibility aliases so existing perf/debug helpers resolve every key cleanly
  return {
    ochreBrick,
    turquoiseTile,
    cobaltTile,
    carvedPlaster,
    namazgahGreenWood,
    carvedWalnutWood,
    carvedStonePlinth,
    courtyardPaver,
    brassCrescent,
    roofTerraceEarth,
    woodTimberTemp,
    timberFalsework: woodTimberTemp,
    poplarBark,
    poplarFoliage,
    howzWater,
    glass1889,
    glassClear: glass1889,
    masonryAshlar: carvedStonePlinth,
    concreteSub: roofTerraceEarth,
    woodPavilion: carvedWalnutWood,
    oakDeckPlanks: carvedWalnutWood,
    goldAccent: brassCrescent,
    copperDome: turquoiseTile,
    ironPrimary: carvedStonePlinth,
    ironLattice: carvedWalnutWood,
    ironSecondary: ochreBrick,
    ironCast: brassCrescent,
    lampGlobe1889: glass1889,
    lampGlobe1889_glass: glass1889,
  };
}

export const createMaterialLibrary = createMaterials;

export function upgradeTowerMaterialsAndDecks(towerRootOrController, THREE, providedMaterials = null) {
  const root = towerRootOrController?.rootGroup || towerRootOrController;
  if (!root || !THREE) {
    return { deckMeshesUpgraded: 0, cabinMeshesUpgraded: 0, embossedPlaquesUpgraded: 0 };
  }

  const mats = providedMaterials || towerRootOrController?.materials || createMaterials(THREE);
  let canonicalMeshesSwapped = 0;

  root.traverse((obj) => {
    if (!obj.isMesh && !obj.isInstancedMesh) return;

    const curMatName = String(obj.material?.name || '');
    if (curMatName && mats[curMatName] && obj.material !== mats[curMatName]) {
      obj.material = mats[curMatName];
      if (obj.userData.__origMaterial !== undefined) {
        obj.userData.__origMaterial = mats[curMatName];
      }
      canonicalMeshesSwapped += 1;
    }

    const mList = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mList) {
      if (!m) continue;
      if (m.emissive) m.emissive.setHex(0x000000);
      m.emissiveIntensity = 0.0;
      m.emissiveMap = null;
      m.blending = THREE.NormalBlending;
      if (!m.transparent) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    }
  });

  if (towerRootOrController && typeof towerRootOrController === 'object' && 'materials' in towerRootOrController) {
    towerRootOrController.materials = mats;
  }

  return {
    deckMeshesUpgraded: 0,
    cabinMeshesUpgraded: 0,
    embossedPlaquesUpgraded: 0,
    canonicalMeshesSwapped,
  };
}

export function createOverrideMaterials(THREE) {
  const mkStd = (name, color, roughness = 0.85, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({
      name,
      color,
      roughness,
      metalness: 0.0,
      side: THREE.DoubleSide,
      ...extra,
    });
    m.emissive.setHex(0x000000);
    m.emissiveIntensity = 0.0;
    return m;
  };

  return {
    inkIron: mkStd('override_inkIron', 0x3b352c, 0.82),
    inkMasonry: mkStd('override_inkMasonry', 0xded9ce, 0.88),
    inkTemp: mkStd('override_inkTemp', 0x6e5536, 0.86),
    inkGlass: mkStd('override_inkGlass', 0x9aa4a2, 0.35, {
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
    inkLine: new THREE.LineBasicMaterial({
      name: 'override_inkLine',
      color: 0x1e1c19,
    }),
    xrayMesh: mkStd('override_xrayMesh', 0x8f907f, 0.55, {
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
    xrayLine: new THREE.LineBasicMaterial({
      name: 'override_xrayLine',
      color: 0x45433d,
      transparent: true,
      opacity: 0.55,
    }),
    silhouetteMesh: mkStd('override_silhouetteMesh', 0x141413, 1.0),
    silhouetteLine: new THREE.LineBasicMaterial({
      name: 'override_silhouetteLine',
      color: 0x141413,
    }),
  };
}

export function applyRenderModeToGroup(rootGroup, mode, overrides) {
  if (!rootGroup) return;
  rootGroup.traverse((obj) => {
    if (!obj.isMesh && !obj.isInstancedMesh && !obj.isLine && !obj.isLineSegments) return;
    if (obj.userData.__origMaterial === undefined) {
      obj.userData.__origMaterial = obj.material;
    }
    const orig = obj.userData.__origMaterial;
    if (mode === 'pbr' || !overrides) {
      obj.material = orig;
      return;
    }

    const isLineObj = obj.isLine || obj.isLineSegments;
    if (mode === 'silhouette') {
      obj.material = isLineObj ? overrides.silhouetteLine : overrides.silhouetteMesh;
      return;
    }
    if (mode === 'xray') {
      obj.material = isLineObj ? overrides.xrayLine : overrides.xrayMesh;
      return;
    }
    if (mode === 'ink') {
      if (isLineObj) {
        obj.material = overrides.inkLine;
        return;
      }
      const matName = Array.isArray(orig) ? (orig[0]?.name || '') : (orig?.name || '');
      if (matName.includes('glass') || matName.includes('Water')) {
        obj.material = overrides.inkGlass;
      } else if (matName.includes('Stone') || matName.includes('Plaster') || matName.includes('Paver') || matName.includes('ochre')) {
        obj.material = overrides.inkMasonry;
      } else if (matName.includes('woodTimberTemp')) {
        obj.material = overrides.inkTemp;
      } else {
        obj.material = overrides.inkIron;
      }
    }
  });
}
