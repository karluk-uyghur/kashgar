/**
 * Kashgar Old City Adobe Courtyard Neighbourhoods, Covered Bazaar Lanes &
 * Oasis Avenues surrounding Id Kah Mosque (`world/w_champ_de_mars.js`).
 *
 * Features:
 *   - Strict Clear Sightline Reserve for Id Kah Mosque (`X in [-62, +62], Z in [-98, +32]`),
 *     Id Kah Square (`X in [-54, +54], Z in [28, +106]`), and East Approach Avenue
 *     (`|X| < 38, Z in [102, +175]`) so all Gatehouse & Minaret camera angles stay clear.
 *   - Procedural 1–2 storey flat-roofed adobe courtyard blocks (`R_xz <= 580 m`) with
 *     earthen parapet silhouettes and Silk Road covered bazaar cupolas (`|X| = 74..98`).
 *   - Continuous earth/street skirts extending out to `±1700 m` so 100% mist closure
 *     (`620 m`) conceals all edges seamlessly.
 */

import { createHaussmannBlockGeometry } from './sketch_materials.js';

function hash01(a, b) {
  let n = (a * 374761393 + b * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function buildChampDeMars(ctx) {
  const { THREE, pal, box, cyl, dome, instanced, lineSeg, archCurve, addHaussmannSketch } = ctx;
  const group = new THREE.Group();
  group.name = 'champ_de_mars_paris';

  const gardensGroup = new THREE.Group();
  gardensGroup.name = 'cdm_parterre_gardens';
  const fountainGroup = new THREE.Group();
  fountainGroup.name = 'cdm_fontaine_coutan';
  const awningGroup = new THREE.Group();
  awningGroup.name = 'cdm_promenade_awnings';
  const palaisWingsGroup = new THREE.Group();
  palaisWingsGroup.name = 'cdm_palais_wings';
  const expoGrandGroup = new THREE.Group();
  expoGrandGroup.name = 'cdm_dome_central_machines';
  group.add(
    gardensGroup,
    fountainGroup,
    awningGroup,
    palaisWingsGroup,
    expoGrandGroup
  );

  // 1. East Ceremonial Approach Lane & Id Kah Square Foreground Terrace (Z in [+102, +175])
  box(group, pal.allee, 0, 0.01, 138, 42, 0.06, 74, 0, { noSketchEdges: true });
  for (const sx of [-1, 1]) {
    box(gardensGroup, pal.stone, sx * 28, 0.06, 136, 12, 0.10, 48);
    box(gardensGroup, pal.lawn, sx * 28, 0.10, 136, 10.6, 0.08, 46.5, 0, { noSketchEdges: true });
    ctx.addTree(sx * 24, 0, 114, 0.94);
    ctx.addTree(sx * 24, 0, 136, 0.92);
    ctx.addTree(sx * 24, 0, 158, 0.90);
  }

  // Ornamental Silk Road Stone Arch Pavilion Gateway at Southern Plaza Approach (|X| = 21, Z = 152)
  for (const sx of [-1, 1]) {
    box(fountainGroup, pal.stone, sx * 21, 3.6, 152, 4.2, 7.2, 4.2);
    dome(fountainGroup, pal.copper, sx * 21, 7.2, 152, 2.0, 2.2, 12, { ribs: 8 });
  }

  // 2. Covered Kashgar Old City Chorsu Bazaar Lanes flanking Id Kah Square (|X| = 74..100, Z = 24..108)
  for (const sx of [-1, 1]) {
    const bx = sx * 84;
    box(palaisWingsGroup, pal.cream, bx, 3.8, 66, 22, 7.6, 82);
    box(palaisWingsGroup, pal.expoBrick, bx, 7.8, 66, 22.4, 0.7, 82.4);
    for (let z = 34; z <= 98; z += 16) {
      archCurve(palaisWingsGroup, bx - sx * 11.1, 2.8, z, 3.6, 2.8, 'z', 0, 8);
      dome(palaisWingsGroup, pal.slate, bx, 8.1, z, 4.8, 2.8, 12, { ribs: 8 });
    }
    // Timber Arcade Shade Canopies along Old City Street Front
    box(awningGroup, pal.wood, bx - sx * 13.0, 3.6, 66, 4.2, 0.28, 78);
    for (let z = 30; z <= 102; z += 12) {
      box(awningGroup, pal.wood, bx - sx * 14.6, 1.8, z, 0.22, 3.6, 0.22);
      lineSeg(awningGroup, bx - sx * 11.0, 3.6, z, bx - sx * 15.0, 3.6, z);
    }
  }

  // 3. Distant Landmarks: Historic Old City Covered Bazar Rotunda & Afaq-style Domed Shrine (horizon framing)
  // Placed well away from camera corridors: X = +185, Z = +175 & X = -195, Z = +145
  for (const [lx, lz, sc] of [
    [185, 175, 1.0],
    [-195, 145, 0.88],
  ]) {
    box(expoGrandGroup, pal.cream, lx, 6.5 * sc, lz, 28 * sc, 13.0 * sc, 28 * sc);
    cyl(expoGrandGroup, pal.expoBrick, lx, 14.5 * sc, lz, 9.2 * sc, 9.6 * sc, 3.6 * sc, 16, {
      pilasters: 8,
    });
    dome(expoGrandGroup, pal.copper, lx, 16.3 * sc, lz, 9.4 * sc, 8.8 * sc, 18, { ribs: 12 });
    cyl(expoGrandGroup, pal.gold, lx, 25.4 * sc, lz, 0.22, 0.45, 1.4, 8);
  }

  // 4. Continuous Kashgar Earthen/Macadam Ground Skirts out to +-1700 m
  box(group, pal.street, 940, -0.18, 862, 1520, 0.24, 1676, 0, { noSketchEdges: true });
  box(group, pal.street, -940, -0.18, 862, 1520, 0.24, 1676, 0, { noSketchEdges: true });
  box(group, pal.street, 0, -0.20, 938, 360, 0.24, 1524, 0, { noSketchEdges: true });

  // 5. Dense Low-Rise Kashgar Old City Adobe Courtyard Fabric (`R_xz <= 580 m`)
  const wallA = [];
  const wallB = [];
  const roofs = [];
  const maxBlockR = 575.0;

  const pushOldCityDistrict = (x0, x1, z0, z1, stepX, stepZ, yGround = 0) => {
    for (let x = x0; x <= x1; x += stepX) {
      for (let z = z0; z <= z1; z += stepZ) {
        const r1 = hash01(x, z);
        const r2 = hash01(z + 19, x - 29);
        const cx = x + (r1 - 0.5) * 8;
        const cz = z + (r2 - 0.5) * 8;
        const radXZ = Math.hypot(cx, cz);
        if (radXZ > maxBlockR) continue;

        // Keep Mosque Compound & Id Kah Square & Approach Corridor strictly clear!
        if (Math.abs(cx) < 66 && cz > -104 && cz < 108) continue;
        if (Math.abs(cx) < 42 && cz >= 100 && cz < 185) continue;
        // Keep Chorsu Bazaar Wings & Tuman Canal clear
        if (Math.abs(cx) > 64 && Math.abs(cx) < 108 && cz > 16 && cz < 114) continue;
        if (cz < -118 && cz > -196) continue;
        // Keep North Madrasa & Distant Landmark plazas clear
        if (Math.abs(cx) < 48 && cz < -230 && cz > -305) continue;
        if (Math.hypot(cx - 185, cz - 175) < 32) continue;
        if (Math.hypot(cx + 195, cz - 145) < 32) continue;

        const h = 4.6 + r1 * 5.2; // Authentic 1–2 storey adobe courtyard height (~5–10 m)
        const wx = 18 + r2 * 14;
        const wz = 15 + (1 - r2) * 12;
        const yaw = (Math.floor(r1 * 4) * 0.14 - 0.21) + (r2 - 0.5) * 0.08;
        (r1 > 0.48 ? wallA : wallB).push([cx, yGround + h * 0.5, cz, wx, h, wz, yaw]);
        // Low flat earthen roof parapet rim (zero pitched Haussmann mansard!)
        roofs.push([cx, yGround + h + 0.35, cz, wx * 0.94, 0.70, wz * 0.94, yaw]);
        if (radXZ < 460) {
          addHaussmannSketch(group, cx, yGround, cz, wx, h, wz, yaw);
        }
        if (r2 > 0.70 && radXZ < 420) {
          ctx.addTree(cx + (cx > 0 ? -1 : 1) * (wx * 0.60), yGround, cz, 0.78);
        }
      }
    }
  };

  // East & West flank districts
  pushOldCityDistrict(72, 540, -112, 460, 40, 36, 0);
  pushOldCityDistrict(-540, -72, -112, 460, 40, 36, 0);
  // South & Southeast approach neighborhoods beyond Id Kah Square
  pushOldCityDistrict(-240, 240, 188, 520, 42, 38, 0);
  // Behind Tuman Canal / North Bank districts
  pushOldCityDistrict(-480, 480, -520, -205, 44, 40, 0);

  const blockGeo = createHaussmannBlockGeometry(THREE);
  const parapetGeo = new THREE.BoxGeometry(1, 1, 1);
  instanced(group, blockGeo, pal.cityWall, wallA);
  instanced(group, blockGeo, pal.cityWallWarm, wallB);
  instanced(group, parapetGeo, pal.slate, roofs);

  return {
    group,
    setStep(step) {
      gardensGroup.visible = step >= 7.5;
      fountainGroup.visible = step >= 8.5;
      awningGroup.visible = step >= 8.0;
      palaisWingsGroup.visible = step >= 7.5;
      expoGrandGroup.visible = step >= 7.0;
    },
  };
}
