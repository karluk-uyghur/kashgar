/**
 * Id Kah Square (ھېيتگاھ مەيدانى), Reflecting Basin, Silk Road Bazaar Awnings,
 * Tuman Canal (Z in [-178, -128], Y = -2.40 m) & 3-Arch Stone Bridge (`world/w_parvis_seine.js`).
 */

export function buildParvisAndSeine(ctx) {
  const { THREE, pal, box, cyl, dome, lineSeg } = ctx;
  const group = new THREE.Group();
  group.name = 'parvis_seine_iena';

  // 1. Continuous Ground Plane Skirt around Mosque & Id Kah Square (Y = -0.14 m -> top at -0.02 m)
  // Mosque sits in X in [-52, +52], Z in [-88, +31]; Id Kah Square extends Z in [+29, +104].
  box(group, pal.gravel, 0, -0.14, -18, 250, 0.24, 240, 0, { noSketchEdges: true });

  const skirtMat = pal.gravelSkirt || pal.gravel;
  box(group, skirtMat, -912.5, -0.18, 24, 1575, 0.24, 304, 0, { noSketchEdges: true });
  box(group, skirtMat, 912.5, -0.18, 24, 1575, 0.24, 304, 0, { noSketchEdges: true });
  box(group, skirtMat, 0, -0.22, 901, 3400, 0.24, 1598, 0, { noSketchEdges: true });

  // 2. Dressed Sandstone Flagstone Plaza of Id Kah Square (Z in [30.6, 102], X in [-48, +48])
  const expoParvisGroup = new THREE.Group();
  expoParvisGroup.name = 'parvis_expo_1889';
  const soubCurbGroup = new THREE.Group();
  soubCurbGroup.name = 'parvis_soubassement_curbs';
  group.add(soubCurbGroup, expoParvisGroup);

  // Ceremonial Stone Apron (clear of Mosque front stair steps Z = 28..30.6)
  box(group, pal.stone, 0, -0.04, 66, 94, 0.12, 70, 0, { noSketchEdges: true });
  box(group, pal.allee, 0, 0.03, 66, 22, 0.06, 70, 0, { noSketchEdges: true });

  // Crisp ink paving borders around Id Kah Square
  for (const sx of [-1, 1]) {
    lineSeg(group, sx * 46, 0.04, 31, sx * 46, 0.04, 101);
    lineSeg(group, sx * 11, 0.07, 31, sx * 11, 0.07, 101);
  }
  lineSeg(group, -46, 0.04, 101, 46, 0.04, 101);

  // Perimeter stone curb edging around the compound flanks
  for (const sx of [-1, 1]) {
    box(soubCurbGroup, pal.stone, sx * 53.6, 0.12, -28, 1.2, 0.28, 122);
  }
  box(soubCurbGroup, pal.stone, 0, 0.12, -89.4, 108.4, 0.28, 1.2);

  // Id Kah Square Ceremonial Reflecting Basin (center at X=0, Z=+66 — keeps Gatehouse entrance unobstructed)
  box(expoParvisGroup, pal.stone, 0, 0.14, 66, 15.2, 0.28, 15.2);
  box(expoParvisGroup, pal.marble, 0, 0.34, 66, 13.8, 0.42, 13.8);
  box(expoParvisGroup, pal.water, 0, 0.46, 66, 12.2, 0.14, 12.2, 0, { noSketchEdges: true });
  cyl(expoParvisGroup, pal.stone, 0, 0.92, 66, 1.25, 1.55, 0.95, 8, { pilasters: 8 });
  dome(expoParvisGroup, pal.marble, 0, 1.40, 66, 0.95, 0.72, 12, { ribs: 8 });
  cyl(expoParvisGroup, pal.gold, 0, 2.25, 66, 0.10, 0.22, 0.45, 8);

  // Flanking Bazaar Pavilion Stalls & Tree Planters framing East & West edges of Id Kah Square
  for (const sx of [-1, 1]) {
    for (const pz of [44, 88]) {
      box(expoParvisGroup, pal.stone, sx * 36.0, 0.14, pz, 7.2, 0.28, 7.2);
      box(expoParvisGroup, pal.cream, sx * 36.0, 0.26, pz, 5.8, 0.20, 5.8, 0, { noSketchEdges: true });
    }
    // Traditional Kashgar Bazaar Stalls & Lanterns along Square Edges (|X| = 47)
    box(expoParvisGroup, pal.cream, sx * 54, 3.2, 66, 8.5, 6.4, 58);
    box(expoParvisGroup, pal.wood, sx * 49.4, 4.1, 66, 3.2, 0.35, 58);
    for (let z = 40; z <= 92; z += 13) {
      box(expoParvisGroup, pal.wood, sx * 48.2, 2.0, z, 0.24, 4.0, 0.24);
      ctx.addLamp(sx * 43.0, 0.04, z, 0.92, true);
    }
    // Perimeter Oasis Plane Trees framing the square (kept outside |X| < 34 sightline)
    for (const zt of [38, 56, 74, 92]) {
      ctx.addTree(sx * 40.5, 0.04, zt, 0.92 + ((zt % 3) * 0.06));
    }
  }

  // Front approach plaza avenues south-east of Id Kah Square (Z = 102..165)
  box(group, pal.allee, 0, 0.02, 134, 32, 0.06, 66, 0, { noSketchEdges: true });
  for (const sx of [-1, 1]) {
    ctx.addLamp(sx * 14.5, 0.02, 108, 0.96, false);
    ctx.addLamp(sx * 14.5, 0.02, 132, 0.96, false);
    ctx.addLamp(sx * 14.5, 0.02, 156, 0.96, false);
  }

  // 3. Tuman Canal (mesh name `seine_river_pbr` preserved; Z in [-178, -128], Y = -2.40 m)
  box(group, pal.earth, 0, -4.1, -153, 3400, 0.3, 56, 0, { noSketchEdges: true });
  const seineGeo = new THREE.PlaneGeometry(3400, 50, 48, 8);
  seineGeo.rotateX(-Math.PI * 0.5);
  const seineMesh = new THREE.Mesh(seineGeo, pal.seineWater);
  seineMesh.name = 'seine_river_pbr';
  seineMesh.position.set(0, -2.40, -153);
  seineMesh.receiveShadow = true;
  group.add(seineMesh);

  let lastExplicitUpdateNow = -1e9;
  const advanceWaterRipples = (tSec) => {
    if (pal.seineNormalMap) {
      pal.seineNormalMap.offset.x = (tSec * 0.012) % 1.0;
      pal.seineNormalMap.offset.y = Math.sin(tSec * 0.16) * 0.015;
    }
    if (pal.basinNormalMap) {
      pal.basinNormalMap.offset.x = Math.cos(tSec * 0.22) * 0.022;
      pal.basinNormalMap.offset.y = Math.sin(tSec * 0.26) * 0.022;
    }
  };

  seineMesh.onBeforeRender = () => {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;
    if (nowMs - lastExplicitUpdateNow > 160) {
      advanceWaterRipples(nowMs * 0.001);
    }
  };

  // Dressed Stone Canal Embankments (Z = -128 & Z = -178)
  for (const [qz, sign] of [
    [-128, -1],
    [-178, 1],
  ]) {
    box(group, pal.stone, 0, -1.9, qz - sign * 1.1, 3400, 4.0, 2.4);
    box(group, pal.stone, 0, 0.10, qz - sign * 1.0, 3400, 0.18, 2.6);
    lineSeg(group, -650, -2.30, qz + sign * 0.12, 650, -2.30, qz + sign * 0.12);
    lineSeg(group, -650, 0.18, qz + sign * 0.24, 650, 0.18, qz + sign * 0.24);

    for (const sx of [-1, 1]) {
      box(group, pal.stone, sx * 860, 0.52, qz + sign * 0.1, 1700, 0.84, 0.48);
      for (let x = 26; x <= 320; x += 26) {
        ctx.addTree(sx * x, 0, qz - sign * 7.2, 0.88 + ((x % 3) * 0.06));
        if (x <= 180) ctx.addLamp(sx * x, 0, qz - sign * 2.2, 0.92, false);
      }
    }
  }

  // Moored Wooden Silk Road Canal Barges
  for (const [bx, bz] of [
    [62, -148],
    [-74, -158],
  ]) {
    box(group, pal.wood, bx, -2.18, bz, 16, 0.85, 3.6);
    box(group, pal.cream, bx, -1.55, bz, 10, 0.9, 3.0);
  }

  // 4. Three-Arch Silk Road Stone Footbridge over Tuman Canal (X in [-7.5, +7.5], Z in [-178, -128])
  box(group, pal.allee, 0, -0.08, -153, 12.6, 0.42, 51.0);
  for (const sx of [-1, 1]) {
    box(group, pal.stone, sx * 6.8, 0.58, -153, 0.48, 0.84, 51.0);
  }
  const pierZs = [-129.0, -145.0, -161.0, -177.0];
  for (let i = 0; i < pierZs.length; i++) {
    const pz = pierZs[i];
    box(group, pal.stone, 0, -2.0, pz, 14.2, 4.0, 2.2);
    if (i > 0 && i < 3) {
      for (const sx of [-1, 1]) {
        cyl(group, pal.stone, sx * 7.1, -2.0, pz, 0.95, 1.15, 4.0, 10);
      }
      ctx.addLamp(-6.8, 0.95, pz, 0.82, false);
      ctx.addLamp(6.8, 0.95, pz, 0.82, false);
    }
  }
  for (let a = 0; a < 3; a++) {
    const zStart = pierZs[a] - 1.1;
    const zEnd = pierZs[a + 1] + 1.1;
    const span = Math.abs(zEnd - zStart);
    const zMid = 0.5 * (zStart + zEnd);
    for (let s = 0; s < 8; s++) {
      const um = ((s + 0.5) / 8) * 2 - 1;
      const archY = -0.35 - 1.65 * um * um;
      const hSp = Math.max(0.36, 0.06 - archY);
      box(group, pal.stone, 0, archY + hSp * 0.5, zMid - um * span * 0.5, 14.0, hSp, span / 8 + 0.14, 0, {
        noSketchEdges: true,
      });
    }
    for (const sx of [-1, 1]) {
      const faceX = sx * 7.05;
      const segs = 12;
      for (let s = 0; s < segs; s++) {
        const u0 = (s / segs) * 2 - 1;
        const u1 = ((s + 1) / segs) * 2 - 1;
        const z0 = zMid - u0 * span * 0.5;
        const z1 = zMid - u1 * span * 0.5;
        const y0 = -0.35 - 1.65 * u0 * u0;
        const y1 = -0.35 - 1.65 * u1 * u1;
        lineSeg(group, faceX, y0, z0, faceX, y1, z1);
        lineSeg(group, faceX, y0 + 0.34, z0, faceX, y1 + 0.34, z1);
      }
    }
  }

  return {
    group,
    seineMesh,
    setStep(step) {
      soubCurbGroup.visible = step >= 2.2;
      expoParvisGroup.visible = step >= 8.5;
    },
    update(dt, elapsedSec) {
      lastExplicitUpdateNow = typeof performance !== 'undefined' ? performance.now() : 0;
      advanceWaterRipples(elapsedSec);
    },
  };
}
