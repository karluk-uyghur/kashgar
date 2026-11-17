/**
 * Zone 5 — Reversible Uyghur Poplar Timber Scaffolding (`step 4.2..10.3`, dismantled cleanly)
 * and Mature Kashgar Oasis Poplar & Plane Courtyard Trees (`step 8.6..10.9`, permanent)
 * (`model/modules/zone5_elevators_cranes_falsework.js`)
 */

import { PieceBuilder } from './z2_geom_helpers.js';

export function buildZone({ THREE, materials }) {
  if (!THREE) throw new Error('zone5_elevators_cranes_falsework.buildZone requires ctx.THREE');

  const group = new THREE.Group();
  group.name = 'zone5_elevators_cranes_falsework';

  const built = [];
  const pushPiece = (pb, meta) => {
    const res = pb.finalize(THREE, meta);
    group.add(res.piece.object3D);
    built.push(res.piece);
  };

  // 1. Temporary Poplar Pole Scaffolding around East Gatehouse & Twin Minarets (vanishes 9.45 -> 10.25)
  {
    const pb = new PieceBuilder();
    const pineB = pb.bucket(materials.woodTimberTemp);

    const addScaffoldGrid = (cx, cz, width, depth, yBot, yTop, levels) => {
      const hw = width * 0.5;
      const hd = depth * 0.5;
      const xs = [-hw, 0, hw];
      const zs = [-hd, hd];
      for (const x of xs) {
        for (const z of zs) {
          pineB.addCylinderPrism(cx + x, yBot, yTop, cz + z, 0.08, 0.06, 6);
        }
      }
      for (let lv = 1; lv <= levels; lv++) {
        const y = yBot + (lv / levels) * (yTop - yBot);
        for (const z of zs) {
          pineB.addBeam([cx - hw, y, cz + z], [cx + hw, y, cz + z], 0.10, 0.12);
        }
        for (const x of xs) {
          pineB.addBeam([cx + x, y, cz - hd], [cx + x, y, cz + hd], 0.10, 0.12);
        }
        // Planked mason catwalk deck
        pineB.addBox(cx, y + 0.08, cz, width * 0.96, 0.09, depth * 0.75);
      }
      // Diagonal wind braces
      pineB.addBeam([cx - hw, yBot, cz + hd], [cx + hw, yTop, cz + hd], 0.07, 0.07);
      pineB.addBeam([cx + hw, yBot, cz + hd], [cx - hw, yTop, cz + hd], 0.07, 0.07);
    };

    // East Gatehouse Iwan front construction falsework
    addScaffoldGrid(0, 28.4, 13.8, 1.9, 0.25, 13.4, 5);
    // Twin Minaret wrapping timber scaffold cages (`X = ±16.8, Z = +25.4`)
    for (const sx of [-1, +1]) {
      addScaffoldGrid(sx * 16.8, 25.4, 5.4, 5.4, 0.45, 16.5, 6);
    }

    pushPiece(pb, {
      id: 'z5_gatehouse_minaret_scaffold',
      label: 'Poplar Timber Scaffolding around Gatehouse & Twin Minarets',
      phase: 5,
      span: [4.25, 5.2],
      vanishSpan: [9.45, 10.25],
      category: 'temporary',
    });
  }

  // 2. Temporary Timber Hoist Gin-Poles for Raising 140 Namazgah Pillars (vanishes 8.60 -> 9.40)
  {
    const pb = new PieceBuilder();
    const pineB = pb.bucket(materials.woodTimberTemp);

    for (const gx of [-32, -12, 12, 32]) {
      // A-frame poplar gin-pole lifting rig at edge of Summer Veranda
      const gz = -46.2;
      pineB.addBeam([gx - 1.6, 0.2, gz], [gx, 8.6, gz + 0.6], 0.14, 0.14);
      pineB.addBeam([gx + 1.6, 0.2, gz], [gx, 8.6, gz + 0.6], 0.14, 0.14);
      pineB.addBeam([gx - 1.3, 3.8, gz + 0.2], [gx + 1.3, 3.8, gz + 0.2], 0.11, 0.11);
      pineB.addCylinderPrism(gx, 0.2, 8.2, gz + 1.8, 0.06, 0.05, 6);
    }

    pushPiece(pb, {
      id: 'z5_namazgah_timber_ginpoles',
      label: 'Timber Gin-Poles for Raising 140 Namazgah Columns',
      phase: 5,
      span: [7.1, 7.65],
      vanishSpan: [8.6, 9.35],
      category: 'temporary',
    });
  }

  // 3. Mature Kashgar Oasis Courtyard Poplar & Plane Trees (Permanent Architectural Landscape, step 8.65 -> 10.85)
  {
    const pb = new PieceBuilder();
    const barkB = pb.bucket(materials.poplarBark);
    const leafB = pb.bucket(materials.poplarFoliage);

    const addOasisTree = (tx, tz, height, crownRadius, seed) => {
      // Slightly winding trunk + primary forked branches
      const trunkTop = height * 0.48;
      barkB.addCylinderPrism(tx, 0.2, trunkTop, tz, 0.34, 0.22, 8);
      for (let b = 0; b < 4; b++) {
        const ang = seed * 1.7 + (b / 4) * Math.PI * 2;
        const bx = tx + Math.cos(ang) * (crownRadius * 0.48);
        const bz = tz + Math.sin(ang) * (crownRadius * 0.48);
        const by = height * (0.64 + (b % 2) * 0.11);
        barkB.addBeam([tx, trunkTop * 0.92, tz], [bx, by, bz], 0.16, 0.16);
      }

      // Layered multi-tier organic canopy clusters (matte, zero emissive)
      const clusterOffsets = [
        [0, height * 0.78, 0, 1.0],
        [-0.52, height * 0.66, 0.36, 0.78],
        [0.54, height * 0.68, -0.32, 0.75],
        [-0.28, height * 0.62, -0.52, 0.72],
        [0.34, height * 0.70, 0.48, 0.74],
        [0, height * 0.92, 0, 0.68],
      ];
      for (let c = 0; c < clusterOffsets.length; c++) {
        const [ox, cy, oz, rScale] = clusterOffsets[c];
        const cx = tx + ox * crownRadius;
        const cz = tz + oz * crownRadius;
        const r = crownRadius * rScale;
        const h = r * 1.15;
        leafB.addLatheProfile(
          cx,
          cz,
          [
            [r * 0.12, cy - h * 0.45],
            [r * 0.85, cy - h * 0.22],
            [r, cy],
            [r * 0.82, cy + h * 0.28],
            [r * 0.42, cy + h * 0.48],
            [0.05, cy + h * 0.56],
          ],
          10,
          seed + c * 0.4,
          true,
          true
        );
      }
    };

    // 4 primary ancient courtyard oasis beds planted inside Zone 2 stone curbs (`X = ±27, Z = -35.5 / +6.5`)
    const treeSpecs = [
      [-27.0, -35.5, 13.5, 3.8, 0.3],
      [27.0, -35.5, 14.2, 4.0, 1.1],
      [-27.0, 6.5, 12.8, 3.6, 2.2],
      [27.0, 6.5, 13.6, 3.8, 3.4],
      // Secondary slender white poplars (`Aq Terek`) framing inner north/south Riwaq walks
      [-34.5, -16.0, 11.4, 2.9, 4.1],
      [34.5, -16.0, 11.8, 3.0, 5.2],
      [-17.5, -36.5, 10.6, 2.7, 6.0],
      [17.5, -36.5, 11.0, 2.8, 6.8],
      // Flanking tall poplars beside Id Kah Square plaza approach
      [-31.5, 29.5, 12.2, 3.1, 7.5],
      [31.5, 29.5, 12.5, 3.2, 8.3],
    ];
    for (const [tx, tz, h, cr, sd] of treeSpecs) {
      addOasisTree(tx, tz, h, cr, sd);
    }

    pushPiece(pb, {
      id: 'z5_courtyard_oasis_poplar_trees',
      label: 'Mature Kashgar Oasis Courtyard Poplar & Plane Trees',
      phase: 5,
      span: [8.65, 10.85],
      category: 'permanent',
    });
  }

  return {
    zoneId: 'zone5_elevators_cranes_falsework',
    group,
    pieces: built,
    setConstructionState() {
      // Piece visibility & scaffold removal governed centrally by BuildKinematicsEngine
    },
  };
}

export default buildZone;
