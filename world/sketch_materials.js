/**
 * Kashgar Old City Archival & Pen-and-Ink Materials + Oasis Foliage (`world/sketch_materials.js`)
 *
 * Synthesizes offline, deterministic procedural PBR textures and geometries for the
 * surrounding Kashgar Old City context (`قەشقەر كونا شەھىرى`) grounded in an archival
 * warm earthen architectural palette:
 *   - Every surrounding-world color strictly obeys `srgbChroma <= 0.14` and `hsvSat <= 0.16`
 *     so the polychromatic Saffron-Ochre & Turquoise/Emerald-Green Id Kah Mosque shines cleanly.
 *   - `0` `emissive` / `emissiveMap` / unlit shaders (`fog: true` on 100% of materials).
 *   - `512x512` Kashgar Old City earthen adobe & wooden-gallery elevations (`map` + `normalMap` + `roughnessMap`).
 *   - `256x256` flagstone plaza gravel & ashlar masonry PBR maps.
 *   - `256x256` ribbed terracotta/earthen dome cupolas & tileable Tuman Canal water ripples.
 *   - Multi-branched oasis poplar/mulberry trunks + porous alpha-tested botanical foliage clusters.
 */

import { attachWorldSketchAndMistShader } from './distance_fog.js';

export const PARIS_SKETCH_WORLD_PALETTE = Object.freeze({
  esplanadeGravel: 0xd9d2c4,
  alleeGravel: 0xe0dad0,
  macadamStreet: 0xc9c2b6,
  excavationEarth: 0x7c7469,
  parterreMuted: 0x8d887e,
  dressedStone: 0xd3cab9,
  wallLight: 0xded7c9,
  wallMid: 0xc6beb0,
  masonryBand: 0xb7afa1,
  marble: 0xe6e0d5,
  weatheredTimber: 0x8f8679,
  treeSketchFoliage: 0x676359,
  treeTimberBark: 0x4e4942,
  roofSlate: 0x857e74,
  expoIron: 0x645e56,
  patinaDome: 0x767a73,
  antiqueBronze: 0x958c7e,
  basinWater: 0xaab0ab,
  seineWater: 0xb3b8b2,
  collodionGlass: 0xcfd4cf,
  opalineGlobe: 0xebe6dc,
  sketchEdgeInk: 0x383531,
  sketchEdgeDistant: 0x7a756d,
});

function hash2(x, y) {
  let n = (((x & 1023) * 374761393) ^ ((y & 1023) * 668265263)) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function configureMipmappedDataTexture(THREE, tex, repX = 1, repY = 1, isSrgb = false) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  if (isSrgb && THREE.SRGBColorSpace) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

function computeNormalBytesFromHeightField(hField, size, strength = 1.35) {
  const normalData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const ym = (y === 0 ? size - 1 : y - 1) * size;
    const yc = y * size;
    const yp = (y + 1 === size ? 0 : y + 1) * size;
    for (let x = 0; x < size; x++) {
      const xm = x === 0 ? size - 1 : x - 1;
      const xp = x + 1 === size ? 0 : x + 1;
      const dx = (hField[yc + xp] - hField[yc + xm]) * strength;
      const dy = (hField[yp + x] - hField[ym + x]) * strength;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + 1.0);
      const idx = (yc + x) << 2;
      normalData[idx] = Math.round((-dx * invLen * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((-dy * invLen * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round((invLen * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;
    }
  }
  return normalData;
}

function buildNormalFromHeightField(THREE, hField, size, strength = 1.35, repX = 1, repY = 1) {
  const normalData = computeNormalBytesFromHeightField(hField, size, strength);
  const tex = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  return configureMipmappedDataTexture(THREE, tex, repX, repY, false);
}

/**
 * 1. Compacted Loess & Sandstone Plaza Gravel (`256x256` `map` + `normalMap` + `roughnessMap`)
 */
function makeCollodionGravelPbrMaps(THREE, repX = 30, repY = 30) {
  const size = 256;
  const colorData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const hField = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fine = hash2(x, y);
      const med =
        0.25 *
        (hash2(x >> 1, y >> 1) +
          hash2((x + 1) >> 1, y >> 1) +
          hash2(x >> 1, (y + 1) >> 1) +
          hash2((x + 1) >> 1, (y + 1) >> 1));
      const coarse =
        0.25 *
        (hash2(x >> 3, y >> 3) +
          hash2((x + 4) >> 3, y >> 3) +
          hash2(x >> 3, (y + 4) >> 3) +
          hash2((x + 4) >> 3, (y + 4) >> 3));
      const rake = 0.5 + 0.5 * Math.sin((y / size) * Math.PI * 24.0 + med * 1.15);
      const h = 0.44 * fine + 0.28 * med + 0.18 * coarse + 0.10 * rake;
      hField[y * size + x] = h;

      const lum = Math.round(235 + (h - 0.5) * 34);
      const warm = Math.round((coarse - 0.5) * 6);
      const idx = (y * size + x) * 4;
      colorData[idx] = clampByte(lum + warm);
      colorData[idx + 1] = clampByte(lum);
      colorData[idx + 2] = clampByte(lum - 3);
      colorData[idx + 3] = 255;

      const rVal = clampByte(Math.round(234 - (h - 0.5) * 30));
      roughData[idx] = rVal;
      roughData[idx + 1] = rVal;
      roughData[idx + 2] = rVal;
      roughData[idx + 3] = 255;
    }
  }

  const colorMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat),
    repX,
    repY,
    true
  );
  const roughnessMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat),
    repX,
    repY,
    false
  );
  const normalMap = buildNormalFromHeightField(THREE, hField, size, 1.45, repX, repY);
  return { colorMap, normalMap, roughnessMap };
}

/**
 * 2. Dressed Sandstone Ashlar Masonry (`256x256` `map` + `normalMap` + `roughnessMap`)
 */
function makeAshlarStonePbrMaps(THREE, repX = 4, repY = 2) {
  const size = 256;
  const colorData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const hField = new Float32Array(size * size);

  const courseH = 32;
  const blockW = 64;

  for (let y = 0; y < size; y++) {
    const course = Math.floor(y / courseH);
    const yInCourse = y % courseH;
    const stagger = (course & 1) * (blockW >> 1);
    for (let x = 0; x < size; x++) {
      const xs = (x + stagger) % size;
      const block = Math.floor(xs / blockW);
      const xInBlock = xs % blockW;

      const isJoint = yInCourse < 2 || xInBlock < 2;
      const blockTone = (hash2(block * 13 + course * 7, course * 29) - 0.5) * 0.14;
      const grain = (hash2(x, y) - 0.5) * 0.08;
      const h = isJoint ? 0.18 : 0.72 + blockTone + grain;
      hField[y * size + x] = h;

      const baseLum = isJoint ? 202 : Math.round(238 + blockTone * 55 + grain * 26);
      const idx = (y * size + x) * 4;
      colorData[idx] = clampByte(baseLum + 2);
      colorData[idx + 1] = clampByte(baseLum);
      colorData[idx + 2] = clampByte(baseLum - 3);
      colorData[idx + 3] = 255;

      const rVal = clampByte(isJoint ? 245 : Math.round(218 - blockTone * 24));
      roughData[idx] = rVal;
      roughData[idx + 1] = rVal;
      roughData[idx + 2] = rVal;
      roughData[idx + 3] = 255;
    }
  }

  const colorMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat),
    repX,
    repY,
    true
  );
  const roughnessMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat),
    repX,
    repY,
    false
  );
  const normalMap = buildNormalFromHeightField(THREE, hField, size, 1.55, repX, repY);
  return { colorMap, normalMap, roughnessMap };
}

function synthesizeRibbedRoofRaw() {
  const size = 256;
  const colorData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const hField = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const brickRow = y % 16;
    const lapShadow = brickRow === 0 ? -0.18 : brickRow === 1 ? -0.07 : 0.0;
    for (let x = 0; x < size; x++) {
      const seamPhase = x % 16;
      const rib = seamPhase === 0 || seamPhase === 1 ? 0.30 : seamPhase === 2 ? -0.10 : 0.0;
      const patina = (hash2(x >> 1, y >> 1) - 0.5) * 0.09;
      const h = 0.55 + rib + lapShadow + patina;
      hField[y * size + x] = h;

      const lum = Math.round(228 + rib * 40 + lapShadow * 55 + patina * 34);
      const idx = (y * size + x) * 4;
      colorData[idx] = clampByte(lum + 1);
      colorData[idx + 1] = clampByte(lum);
      colorData[idx + 2] = clampByte(lum - 2);
      colorData[idx + 3] = 255;

      const rVal = clampByte(Math.round(196 - rib * 38 + patina * 28));
      roughData[idx] = rVal;
      roughData[idx + 1] = rVal;
      roughData[idx + 2] = rVal;
      roughData[idx + 3] = 255;
    }
  }

  const normalData = computeNormalBytesFromHeightField(hField, size, 1.85);
  return { size, colorData, roughData, normalData };
}

function wrapRibbedRoofMaps(THREE, raw, repX = 8, repY = 3) {
  const { size, colorData, roughData, normalData } = raw;
  return {
    colorMap: configureMipmappedDataTexture(
      THREE,
      new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat),
      repX,
      repY,
      true
    ),
    roughnessMap: configureMipmappedDataTexture(
      THREE,
      new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat),
      repX,
      repY,
      false
    ),
    normalMap: configureMipmappedDataTexture(
      THREE,
      new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat),
      repX,
      repY,
      false
    ),
  };
}

/**
 * Kashgar Old City Adobe & Timber Courtyard Elevation (`512x512`)
 * Preserves function name `synthesizeLithographicHaussmannRaw` for Worker compatibility.
 */
function synthesizeLithographicHaussmannRaw(opts = {}) {
  const size = 512;
  const cols = opts.cols || 6;
  const storeys = opts.storeys || 2;
  const wallLum = opts.wallLum || 226;
  const winLum = opts.winLum || 104;
  const inkLum = opts.inkLum || 74;

  const colorData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const hField = new Float32Array(size * size);

  const colW = Math.floor(size / cols);
  const groundArcadeY = Math.floor(size * 0.44);
  const parapetBotY = Math.floor(size * 0.88);
  const upperSpan = parapetBotY - groundArcadeY;
  const floorH = Math.floor(upperSpan / Math.max(1, storeys - 1));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = (hash2(x, y) - 0.5) * 9.0;
      const mudCourse = (y % 18) < 2 ? -10 : 0;
      const colIdx = Math.floor(x / colW);
      const uCol = (x % colW) / colW;

      let lum = wallLum + grain + mudCourse * 0.4;
      let h = 0.70 + (grain / 255) * 0.5 + (mudCourse ? -0.10 : 0.0);
      let rough = 236;

      if (y >= parapetBotY) {
        // Adobe roof parapet & projecting poplar ceiling beam ends
        const py = (y - parapetBotY) / Math.max(1, size - parapetBotY);
        const beamSpacing = x % 32 < 7;
        if (py < 0.25 && beamSpacing) {
          lum = inkLum + 10;
          h = 0.94;
          rough = 200;
        } else if (py < 0.34) {
          lum = wallLum - 28;
          h = 0.85;
        } else {
          // Mud parapet coping with stepped notch detail
          const crenel = (x % 48) < 12;
          lum = wallLum + (crenel ? -14 : 6) + grain * 0.5;
          h = crenel ? 0.42 : 0.84;
        }
      } else if (y < groundArcadeY) {
        // Ground-level adobe arches & carved timber doors / shopfront stalls
        const ay = y / groundArcadeY;
        const dx = (uCol - 0.5) / 0.30;
        const dy = Math.max(0, (ay - 0.54) / 0.32);
        // Pointed Uyghur iwan-arch shape
        const archShape = Math.abs(dx) * 0.85 + dy * 0.72 <= 1.0 && ay > 0.03;
        if (ay > 0.90) {
          // Timber tie-beam lintel
          lum = inkLum + 26;
          h = 0.88;
        } else if (archShape) {
          const isLattice = ((x % 8) < 2 || (y % 8) < 2) && ay > 0.48;
          lum = isLattice ? inkLum + 22 : winLum - 6 + (colIdx % 2) * 6;
          h = isLattice ? 0.45 : 0.18;
          rough = isLattice ? 210 : 120;
        } else if (ay < 0.16) {
          // Cobble masonry plinth course
          lum = wallLum - 26 + grain;
          h = 0.82;
        }
      } else {
        // Upper Aywan timber gallery & lattice windows
        const relY = y - groundArcadeY;
        const st = Math.min(Math.max(0, storeys - 2), Math.floor(relY / Math.max(1, floorH)));
        const vFloor = (relY - st * floorH) / Math.max(1, floorH);

        const inWinX = Math.abs(uCol - 0.5) < 0.28;
        const inWinY = vFloor > 0.14 && vFloor < 0.80;
        if (vFloor < 0.12) {
          // Carved wooden balustrade rail
          const spindle = (x % 6) < 2 || vFloor > 0.09;
          lum = spindle ? inkLum + 24 : wallLum - 18;
          h = spindle ? 0.86 : 0.40;
        } else if (inWinX && inWinY) {
          const panjara = (x % 9) < 2 || (y % 9) < 2;
          lum = panjara ? wallLum - 32 : winLum + 8;
          h = panjara ? 0.52 : 0.18;
          rough = panjara ? 205 : 110;
        } else if (Math.abs(Math.abs(uCol - 0.5) - 0.30) < 0.045) {
          // Timber post / carved stucco pier frame
          lum = inkLum + 32;
          h = 0.84;
        }
      }

      hField[y * size + x] = h;
      const idx = (y * size + x) * 4;
      colorData[idx] = clampByte(lum + 2);
      colorData[idx + 1] = clampByte(lum);
      colorData[idx + 2] = clampByte(lum - 3);
      colorData[idx + 3] = 255;

      roughData[idx] = rough;
      roughData[idx + 1] = rough;
      roughData[idx + 2] = rough;
      roughData[idx + 3] = 255;
    }
  }

  const normalData = computeNormalBytesFromHeightField(hField, size, 1.65);
  return { size, colorData, roughData, normalData, repX: opts.repX || 2 };
}

function wrapLithographicHaussmannMaps(THREE, raw) {
  const { size, colorData, roughData, normalData, repX } = raw;
  const colorMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat),
    repX,
    1,
    true
  );
  colorMap.wrapT = THREE.ClampToEdgeWrapping;

  const roughnessMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat),
    repX,
    1,
    false
  );
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;

  const normalMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat),
    repX,
    1,
    false
  );
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return { colorMap, normalMap, roughnessMap };
}

function makeLithographicHaussmannMaps(THREE, opts = {}) {
  return wrapLithographicHaussmannMaps(THREE, synthesizeLithographicHaussmannRaw(opts));
}

/**
 * Tileable Multi-Wave Tuman Canal & Reflecting Basin Ripple Normal Map (`256x256`)
 */
export function makeSeineWaterRippleNormalMap(THREE, repX = 46, repY = 5.2) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const tau = Math.PI * 2.0;

  for (let y = 0; y < size; y++) {
    const v = (y / size) * tau;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * tau;
      const dx =
        0.38 * Math.cos(u * 2.0 + v * 1.0) +
        0.28 * Math.cos(u * 3.0 - v * 2.0 + 1.3) +
        0.18 * Math.cos(u * 5.0 + v * 3.0 + 2.4) +
        0.10 * Math.cos(u * 8.0 - v * 4.0 + 0.7) +
        0.06 * Math.cos(u * 13.0 + v * 5.0 + 1.9);
      const dy =
        0.38 * Math.sin(u * 1.0 + v * 2.0) +
        0.28 * Math.sin(u * 2.0 - v * 3.0 + 0.8) +
        0.18 * Math.sin(u * 3.0 + v * 5.0 + 2.1) +
        0.10 * Math.sin(u * 4.0 - v * 7.0 + 1.4) +
        0.06 * Math.sin(u * 5.0 + v * 11.0 + 2.8);

      const nx = Math.max(-1, Math.min(1, dx * 0.34));
      const ny = Math.max(-1, Math.min(1, dy * 0.34));
      const nz = Math.sqrt(Math.max(0.25, 1.0 - nx * nx - ny * ny));
      const idx = (y * size + x) * 4;
      data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  return configureMipmappedDataTexture(THREE, tex, repX, repY, false);
}

function synthesizeBotanicalFoliageRaw() {
  const size = 256;
  const rgba = new Uint8Array(size * size * 4);
  const hField = new Float32Array(size * size);

  const lobes = [
    [0.50, 0.74, 0.24],
    [0.32, 0.58, 0.22],
    [0.68, 0.57, 0.22],
    [0.24, 0.38, 0.19],
    [0.50, 0.44, 0.23],
    [0.76, 0.39, 0.19],
    [0.37, 0.26, 0.17],
    [0.63, 0.25, 0.17],
    [0.50, 0.86, 0.16],
  ];

  const twigs = [
    [0.50, 0.08, 0.50, 0.68, 0.014],
    [0.50, 0.20, 0.27, 0.54, 0.011],
    [0.50, 0.22, 0.73, 0.53, 0.011],
    [0.37, 0.38, 0.21, 0.39, 0.008],
    [0.63, 0.38, 0.79, 0.40, 0.008],
    [0.50, 0.46, 0.36, 0.72, 0.009],
    [0.50, 0.46, 0.65, 0.71, 0.009],
  ];

  const distToSegSq = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const len2 = Math.max(1e-6, vx * vx + vy * vy);
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
    const dx = px - (ax + t * vx);
    const dy = py - (ay + t * vy);
    return dx * dx + dy * dy;
  };

  for (let y = 0; y < size; y++) {
    const ny = y / (size - 1);
    for (let x = 0; x < size; x++) {
      const nx = x / (size - 1);

      const nFine = hash2(x, y);
      const nClust =
        0.25 *
        (hash2(x >> 2, y >> 2) +
          hash2((x + 2) >> 2, y >> 2) +
          hash2(x >> 2, (y + 2) >> 2) +
          hash2((x + 2) >> 2, (y + 2) >> 2));
      const nMacro =
        0.25 *
        (hash2(x >> 4, y >> 4) +
          hash2((x + 8) >> 4, y >> 4) +
          hash2(x >> 4, (y + 8) >> 4) +
          hash2((x + 8) >> 4, (y + 8) >> 4));

      let maxLobe = 0.0;
      for (let i = 0; i < lobes.length; i++) {
        const [lx, ly, lr] = lobes[i];
        const dx = nx - lx;
        const dy = (ny - ly) * 1.04;
        const d = Math.sqrt(dx * dx + dy * dy) / lr;
        const val = Math.max(0.0, 1.0 - d);
        if (val > maxLobe) maxLobe = val;
      }

      const leafTuft = 0.56 * nClust + 0.28 * nMacro + 0.16 * nFine;
      const skyGap =
        nMacro < 0.26 && maxLobe < 0.52 ? -0.35 : nClust < 0.22 && maxLobe < 0.36 ? -0.28 : 0.0;
      let density = maxLobe * 1.48 + (leafTuft - 0.45) * 0.72 + skyGap;

      let onTwig = false;
      for (let i = 0; i < twigs.length; i++) {
        const [ax, ay, bx, by, rad] = twigs[i];
        if (distToSegSq(nx, ny, ax, ay, bx, by) < rad * rad) {
          onTwig = true;
          density = Math.max(density, 0.78);
          break;
        }
      }

      const alpha = density > 0.44 ? clampByte(Math.round(Math.min(1.0, density * 1.35) * 255)) : 0;
      const hatchLine = 0.5 + 0.5 * Math.sin((nx + ny) * Math.PI * 56.0);
      let lum = Math.round(
        186 + ny * 42 + (leafTuft - 0.5) * 52 - (1.0 - ny) * (1.0 - hatchLine) * 22
      );
      if (onTwig) lum = 96;

      hField[y * size + x] = alpha > 0 ? 0.35 + leafTuft * 0.6 : 0.0;
      const idx = (y * size + x) * 4;
      rgba[idx] = clampByte(lum + 1);
      rgba[idx + 1] = clampByte(lum);
      rgba[idx + 2] = clampByte(lum - 2);
      rgba[idx + 3] = alpha;
    }
  }

  const normalData = computeNormalBytesFromHeightField(hField, size, 1.15);
  return { size, rgba, normalData };
}

function wrapBotanicalFoliageMaps(THREE, raw) {
  const { size, rgba, normalData } = raw;
  const colorMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(rgba, size, size, THREE.RGBAFormat),
    1,
    1,
    true
  );
  colorMap.wrapS = colorMap.wrapT = THREE.ClampToEdgeWrapping;

  const normalMap = configureMipmappedDataTexture(
    THREE,
    new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat),
    1,
    1,
    false
  );
  normalMap.wrapS = normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return { colorMap, normalMap };
}

function makeBotanicalEtchingFoliageMaps(THREE) {
  return wrapBotanicalFoliageMaps(THREE, synthesizeBotanicalFoliageRaw());
}

/**
 * Worker-compatible pure-JS synthesizer for world PBR maps
 * (`roof`, `haussA`, `haussB`, `foliage` — zero `THREE` dependency).
 */
export function synthesizeSketchWorldRawMaps() {
  return {
    roof: synthesizeRibbedRoofRaw(),
    haussA: synthesizeLithographicHaussmannRaw({
      cols: 6,
      storeys: 2,
      wallLum: 230,
      winLum: 108,
      inkLum: 72,
      repX: 2,
    }),
    haussB: synthesizeLithographicHaussmannRaw({
      cols: 5,
      storeys: 2,
      wallLum: 218,
      winLum: 98,
      inkLum: 66,
      repX: 2,
    }),
    foliage: synthesizeBotanicalFoliageRaw(),
  };
}

/**
 * Custom `1x1x1` Kashgar Adobe Courtyard Block `BufferGeometry` where vertical walls
 * map `[0..1]` bottom-to-top to the Kashgar elevation texture and the flat earthen
 * terrace roof cap maps to a neutral parapet corner `(0.01, 0.99)`.
 */
export function createHaussmannBlockGeometry(THREE) {
  const pos = [
    -0.5, -0.5, 0.5,   0.5, -0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
     0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,  0.5, 0.5, -0.5,
     0.5, -0.5, 0.5,   0.5, -0.5, -0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5, -0.5,
    -0.5, 0.5, 0.5,    0.5, 0.5, 0.5,    0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ];
  const nrm = [
    0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
   -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
  ];
  const uvs = [
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 0.72, 0, 0.72, 1, 0, 1,
    0, 0, 0.72, 0, 0.72, 1, 0, 1,
    0.01, 0.985, 0.03, 0.985, 0.03, 0.995, 0.01, 0.995,
  ];
  const idx = [];
  for (let f = 0; f < 5; f++) {
    const b = f * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Multi-branched oasis poplar/plane timber trunk + upward boughs `BufferGeometry`
 * (`y = 0 .. 7.4 m` in unit-scale tree space) for `InstancedMesh` rendering.
 */
export function createSkeletalTreeTrunkGeometry(THREE) {
  const parts = [];
  const pushLimb = (ax, ay, az, bx, by, bz, rBot, rTop, seg = 5) => {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    const cyl = new THREE.CylinderGeometry(rTop, rBot, len, seg, 1, false);
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const mat4 = new THREE.Matrix4().compose(
      new THREE.Vector3(0.5 * (ax + bx), 0.5 * (ay + by), 0.5 * (az + bz)),
      quat,
      new THREE.Vector3(1, 1, 1)
    );
    cyl.applyMatrix4(mat4);
    parts.push(cyl);
  };

  pushLimb(0.0, 0.0, 0.0, 0.04, 3.2, -0.02, 0.24, 0.15, 6);
  pushLimb(0.04, 3.15, -0.02, 0.0, 5.8, 0.03, 0.14, 0.075, 5);
  pushLimb(0.03, 2.85, 0.0, 1.15, 5.65, 0.38, 0.10, 0.042, 5);
  pushLimb(0.03, 2.95, 0.0, -1.10, 5.75, 0.45, 0.10, 0.042, 5);
  pushLimb(0.02, 3.15, -0.02, 0.32, 6.05, -1.15, 0.095, 0.04, 5);
  pushLimb(0.02, 3.25, -0.02, -0.72, 5.95, -0.95, 0.095, 0.04, 5);
  pushLimb(0.0, 4.55, 0.02, 0.48, 7.15, 0.38, 0.07, 0.03, 4);
  pushLimb(0.0, 4.65, 0.02, -0.46, 7.25, -0.32, 0.07, 0.03, 4);

  let vTotal = 0;
  let iTotal = 0;
  for (const g of parts) {
    vTotal += g.attributes.position.count;
    iTotal += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vTotal * 3);
  const nrm = new Float32Array(vTotal * 3);
  const uvs = new Float32Array(vTotal * 2);
  const idx = new Uint16Array(iTotal);
  let vOff = 0;
  let iOff = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, vOff * 3);
    nrm.set(g.attributes.normal.array, vOff * 3);
    uvs.set(g.attributes.uv.array, vOff * 2);
    const gIdx = g.index.array;
    for (let k = 0; k < gIdx.length; k++) idx[iOff + k] = gIdx[k] + vOff;
    vOff += g.attributes.position.count;
    iOff += gIdx.length;
    g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(idx, 1));
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Porous 4-card botanical crown cluster (`y = 2.6 .. 9.1 m`) with hemispherical normals.
 */
export function createBotanicalCrownClusterGeometry(THREE) {
  const pos = [];
  const nrm = [];
  const uvs = [];
  const idx = [];

  const crownCenterY = 5.85;
  const cards = [
    { yaw: 0.0, tiltX: 0.06, cy: 5.75, w: 5.6, h: 6.4, bowZ: 0.42 },
    { yaw: Math.PI / 3, tiltX: -0.07, cy: 5.85, w: 5.5, h: 6.3, bowZ: -0.40 },
    { yaw: (2 * Math.PI) / 3, tiltX: 0.05, cy: 5.80, w: 5.6, h: 6.2, bowZ: 0.38 },
    { yaw: 0.4, tiltX: 1.08, cy: 6.55, w: 4.9, h: 4.8, bowZ: 0.34 },
  ];

  const vTmp = new THREE.Vector3();
  const fNorm = new THREE.Vector3();
  const sNorm = new THREE.Vector3();
  const qYaw = new THREE.Quaternion();
  const qTilt = new THREE.Quaternion();
  const qTot = new THREE.Quaternion();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const yAxis = new THREE.Vector3(0, 1, 0);

  for (const c of cards) {
    qYaw.setFromAxisAngle(yAxis, c.yaw);
    qTilt.setFromAxisAngle(xAxis, c.tiltX);
    qTot.multiplyQuaternions(qYaw, qTilt);

    const baseV = pos.length / 3;
    for (let iy = 0; iy <= 2; iy++) {
      const v = iy / 2;
      const ly = (v - 0.5) * c.h;
      for (let ix = 0; ix <= 2; ix++) {
        const u = ix / 2;
        const lx = (u - 0.5) * c.w;
        const arch = (1.0 - 4.0 * (u - 0.5) * (u - 0.5)) * (1.0 - 2.0 * Math.abs(v - 0.5) * 0.5);
        const lz = c.bowZ * arch;

        vTmp.set(lx, ly, lz).applyQuaternion(qTot);
        vTmp.y += c.cy;
        pos.push(vTmp.x, vTmp.y, vTmp.z);
        uvs.push(u, v);

        fNorm.set(0, 0, 1).applyQuaternion(qTot);
        sNorm.set(vTmp.x, (vTmp.y - crownCenterY) * 1.15 + 0.85, vTmp.z).normalize();
        sNorm.lerp(fNorm, 0.18).normalize();
        nrm.push(sNorm.x, sNorm.y, sNorm.z);
      }
    }

    for (let iy = 0; iy < 2; iy++) {
      for (let ix = 0; ix < 2; ix++) {
        const a = baseV + iy * 3 + ix;
        const b = a + 1;
        const d = a + 3;
        const e = d + 1;
        idx.push(a, b, e, a, e, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

const EMPTY_MAP_TRIO = Object.freeze({ colorMap: null, normalMap: null, roughnessMap: null });

export function createSketchWorldMaterials(THREE, mistUniforms, {
  skipOverwrittenFloorMaps = false,
  rawWorldMaps = null,
} = {}) {
  const P = PARIS_SKETCH_WORLD_PALETTE;

  const gravelMaps = skipOverwrittenFloorMaps ? EMPTY_MAP_TRIO : makeCollodionGravelPbrMaps(THREE, 24, 24);
  const gravelSkirtMaps = skipOverwrittenFloorMaps ? EMPTY_MAP_TRIO : makeCollodionGravelPbrMaps(THREE, 360, 200);
  const alleeMaps = skipOverwrittenFloorMaps ? EMPTY_MAP_TRIO : makeCollodionGravelPbrMaps(THREE, 26, 90);
  const ashlarMaps = skipOverwrittenFloorMaps ? EMPTY_MAP_TRIO : makeAshlarStonePbrMaps(THREE, 4, 2);

  const roofRaw = rawWorldMaps?.roof || synthesizeRibbedRoofRaw();
  const roofMaps = wrapRibbedRoofMaps(THREE, roofRaw, 10, 3);
  const domeMaps = wrapRibbedRoofMaps(THREE, roofRaw, 14, 4);

  const haussAMaps = rawWorldMaps?.haussA
    ? wrapLithographicHaussmannMaps(THREE, rawWorldMaps.haussA)
    : makeLithographicHaussmannMaps(THREE, {
        cols: 6,
        storeys: 2,
        wallLum: 230,
        winLum: 108,
        inkLum: 72,
        repX: 2,
      });
  const haussBMaps = rawWorldMaps?.haussB
    ? wrapLithographicHaussmannMaps(THREE, rawWorldMaps.haussB)
    : makeLithographicHaussmannMaps(THREE, {
        cols: 5,
        storeys: 2,
        wallLum: 218,
        winLum: 98,
        inkLum: 66,
        repX: 2,
      });

  const seineNormalMap = skipOverwrittenFloorMaps ? null : makeSeineWaterRippleNormalMap(THREE, 48, 5.4);
  const basinNormalMap = skipOverwrittenFloorMaps ? null : makeSeineWaterRippleNormalMap(THREE, 9, 9);
  const foliageMaps = rawWorldMaps?.foliage
    ? wrapBotanicalFoliageMaps(THREE, rawWorldMaps.foliage)
    : makeBotanicalEtchingFoliageMaps(THREE);

  const std = (name, color, roughness, metalness, matOpts = {}, shaderOpts = {}) =>
    attachWorldSketchAndMistShader(
      THREE,
      new THREE.MeshStandardMaterial({
        name,
        color,
        roughness,
        metalness,
        ...matOpts,
      }),
      mistUniforms,
      shaderOpts
    );

  const foliageDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: foliageMaps.colorMap,
    alphaTest: 0.44,
  });

  return {
    seineNormalMap,
    basinNormalMap,
    foliageDepthMaterial,

    gravel: std(
      'world_gravel',
      P.esplanadeGravel,
      0.92,
      0.0,
      {
        map: gravelMaps.colorMap,
        normalMap: gravelMaps.normalMap,
        roughnessMap: gravelMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.56, 0.56),
      },
      { hatchStrength: 0.08, contactAoStrength: 0.0, printGrainStrength: 0.022 }
    ),

    gravelSkirt: std(
      'world_gravel_skirt',
      P.esplanadeGravel,
      0.92,
      0.0,
      {
        map: gravelSkirtMaps.colorMap,
        normalMap: gravelSkirtMaps.normalMap,
        roughnessMap: gravelSkirtMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.48, 0.48),
      },
      { hatchStrength: 0.07, contactAoStrength: 0.0, printGrainStrength: 0.020 }
    ),

    allee: std(
      'world_allee',
      P.alleeGravel,
      0.90,
      0.0,
      {
        map: alleeMaps.colorMap,
        normalMap: alleeMaps.normalMap,
        roughnessMap: alleeMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.42, 0.42),
      },
      { hatchStrength: 0.07, contactAoStrength: 0.0, printGrainStrength: 0.020 }
    ),

    street: std(
      'world_street',
      P.macadamStreet,
      0.93,
      0.0,
      {
        normalMap: gravelMaps.normalMap,
        normalScale: new THREE.Vector2(0.32, 0.32),
      },
      { hatchStrength: 0.09, contactAoStrength: 0.0, printGrainStrength: 0.022 }
    ),

    earth: std(
      'world_earth',
      P.excavationEarth,
      0.93,
      0.0,
      {
        normalMap: gravelMaps.normalMap,
        normalScale: new THREE.Vector2(0.65, 0.65),
      },
      { hatchStrength: 0.18, hatchScale: 2.8, contactAoStrength: 0.12, printGrainStrength: 0.024 }
    ),

    lawn: std(
      'world_parterre_muted',
      P.parterreMuted,
      0.95,
      0.0,
      {
        map: alleeMaps.colorMap,
        normalMap: alleeMaps.normalMap,
        normalScale: new THREE.Vector2(0.36, 0.36),
      },
      { hatchStrength: 0.10, contactAoStrength: 0.0, printGrainStrength: 0.020 }
    ),

    stone: std(
      'world_stone',
      P.dressedStone,
      0.86,
      0.02,
      {
        map: ashlarMaps.colorMap,
        normalMap: ashlarMaps.normalMap,
        roughnessMap: ashlarMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.48, 0.48),
      },
      { hatchStrength: 0.18, hatchScale: 2.4, contactAoStrength: 0.16 }
    ),

    cream: std(
      'world_wall_light',
      P.wallLight,
      0.89,
      0.01,
      {
        map: ashlarMaps.colorMap,
        normalMap: ashlarMaps.normalMap,
        normalScale: new THREE.Vector2(0.34, 0.34),
      },
      { hatchStrength: 0.19, hatchScale: 2.35, contactAoStrength: 0.16 }
    ),

    terracottaBand: std(
      'world_masonry_band',
      P.masonryBand,
      0.88,
      0.01,
      {},
      { hatchStrength: 0.18, hatchScale: 2.5, contactAoStrength: 0.12 }
    ),

    marble: std(
      'world_marble',
      P.marble,
      0.72,
      0.02,
      {},
      { hatchStrength: 0.13, hatchScale: 2.6, contactAoStrength: 0.10 }
    ),

    expoBrick: std(
      'world_wall_mid',
      P.wallMid,
      0.90,
      0.01,
      {
        map: ashlarMaps.colorMap,
        normalMap: ashlarMaps.normalMap,
        normalScale: new THREE.Vector2(0.38, 0.38),
      },
      { hatchStrength: 0.20, hatchScale: 2.45, contactAoStrength: 0.16 }
    ),

    wood: std(
      'world_wood',
      P.weatheredTimber,
      0.89,
      0.0,
      {},
      { hatchStrength: 0.18, hatchScale: 3.1, contactAoStrength: 0.12 }
    ),

    foliage: std(
      'world_tree_sketch',
      P.treeSketchFoliage,
      0.93,
      0.0,
      {
        map: foliageMaps.colorMap,
        normalMap: foliageMaps.normalMap,
        normalScale: new THREE.Vector2(0.38, 0.38),
        alphaTest: 0.44,
        side: THREE.DoubleSide,
      },
      { hatchStrength: 0.16, hatchScale: 2.9, contactAoStrength: 0.04, printGrainStrength: 0.012 }
    ),

    bark: std(
      'world_bark',
      P.treeTimberBark,
      0.92,
      0.0,
      {},
      { hatchStrength: 0.18, hatchScale: 3.4, contactAoStrength: 0.18, printGrainStrength: 0.01 }
    ),

    slate: std(
      'world_roof_slate',
      P.roofSlate,
      0.78,
      0.04,
      {
        map: roofMaps.colorMap,
        normalMap: roofMaps.normalMap,
        roughnessMap: roofMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
      },
      { hatchStrength: 0.20, hatchScale: 2.6, contactAoStrength: 0.06 }
    ),

    expoIron: std(
      'world_expo_iron',
      P.expoIron,
      0.58,
      0.48,
      {},
      { hatchStrength: 0.16, hatchScale: 2.8, contactAoStrength: 0.12 }
    ),

    copper: std(
      'world_patina_dome',
      P.patinaDome,
      0.62,
      0.34,
      {
        map: domeMaps.colorMap,
        normalMap: domeMaps.normalMap,
        roughnessMap: domeMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.68, 0.68),
      },
      { hatchStrength: 0.19, hatchScale: 2.5, contactAoStrength: 0.05 }
    ),

    gold: std(
      'world_antique_bronze',
      P.antiqueBronze,
      0.46,
      0.56,
      {},
      { hatchStrength: 0.12, hatchScale: 2.8, contactAoStrength: 0.06 }
    ),

    water: std(
      'world_basin_water',
      P.basinWater,
      0.18,
      0.06,
      {
        envMapIntensity: 1.12,
        normalMap: basinNormalMap,
        normalScale: new THREE.Vector2(0.18, 0.18),
      },
      { hatchStrength: 0.0, contactAoStrength: 0.0, printGrainStrength: 0.008 }
    ),

    seineWater: std(
      'seineCollodionPBR',
      P.seineWater,
      0.16,
      0.06,
      {
        envMapIntensity: 1.18,
        normalMap: seineNormalMap,
        normalScale: new THREE.Vector2(0.24, 0.24),
      },
      { hatchStrength: 0.0, contactAoStrength: 0.0, printGrainStrength: 0.008, isRiverWater: true }
    ),

    glass: std(
      'world_collodion_glass',
      P.collodionGlass,
      0.24,
      0.08,
      { envMapIntensity: 1.05 },
      { hatchStrength: 0.08, hatchScale: 2.9, contactAoStrength: 0.04 }
    ),

    cityWall: std(
      'world_city_wall_a',
      P.wallLight,
      0.88,
      0.02,
      {
        map: haussAMaps.colorMap,
        normalMap: haussAMaps.normalMap,
        roughnessMap: haussAMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.52, 0.52),
      },
      { hatchStrength: 0.18, hatchScale: 2.2, contactAoStrength: 0.18 }
    ),

    cityWallWarm: std(
      'world_city_wall_b',
      P.wallMid,
      0.89,
      0.02,
      {
        map: haussBMaps.colorMap,
        normalMap: haussBMaps.normalMap,
        roughnessMap: haussBMaps.roughnessMap,
        normalScale: new THREE.Vector2(0.52, 0.52),
      },
      { hatchStrength: 0.19, hatchScale: 2.2, contactAoStrength: 0.18 }
    ),

    gasGlobe: std(
      'world_opaline_globe',
      P.opalineGlobe,
      0.34,
      0.0,
      { envMapIntensity: 0.95 },
      { hatchStrength: 0.04, contactAoStrength: 0.0, printGrainStrength: 0.0 }
    ),
  };
}
