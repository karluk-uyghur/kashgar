/**
 * Zone 1 — Mosque Compound Foundations, Dressed Sandstone Plinths, Howz Basin Shell & Column Footings
 * (`model/modules/zone1_foundations_piers1.js`)
 *
 * Step Span: `0.00 -> 2.40` (Calibrated Stop 01 rest at `step = 1.20`)
 * Coordinate Footprint: `X in [-52, +52] m`, `Z in [-88, +28] m`
 */

import { PieceBuilder } from './z2_geom_helpers.js';

export function buildZone({ THREE, materials }) {
  if (!THREE) throw new Error('zone1_foundations_piers1.buildZone requires ctx.THREE');

  const group = new THREE.Group();
  group.name = 'zone1_foundations_piers1';

  const built = [];
  const pushPiece = (pb, meta) => {
    const res = pb.finalize(THREE, meta);
    group.add(res.piece.object3D);
    built.push(res.piece);
  };

  // 1. Substructure Rammed Loess Earth Platform & Trench Embankment (step 0.00 -> 0.58)
  {
    const pb = new PieceBuilder();
    const earthB = pb.bucket(materials.roofTerraceEarth);
    // Main stepped earth foundation pad across courtyard + prayer hall + gatehouse
    earthB.addBox(0, -0.18, -30, 106, 0.36, 118);
    // Excavated Howz pool outer earthen berm
    earthB.addBoxBounds(-10.5, 10.5, -1.25, -0.35, -26.5, -5.5);
    pushPiece(pb, {
      id: 'z1_rammed_earth_platform',
      label: 'Rammed Loess Earth Foundation Pad',
      phase: 1,
      span: [0.0, 0.58],
    });
  }

  // 2. Monumental East Gatehouse & Minaret Sandstone Podium (step 0.35 -> 0.98)
  {
    const pb = new PieceBuilder();
    const stoneB = pb.bucket(materials.carvedStonePlinth);
    // Raised East Gatehouse stone plinth (`Z = +19.5..+28.5, X = -25..+25, Y = 0..0.44`)
    stoneB.addBoxBounds(-25.2, 25.2, 0.0, 0.44, 19.4, 28.6);
    // Front entry approach steps facing Id Kah Square (`Z = +28.6..+30.8`)
    stoneB.addBoxBounds(-9.0, 9.0, 0.0, 0.28, 28.6, 29.7);
    stoneB.addBoxBounds(-9.8, 9.8, 0.0, 0.14, 29.7, 30.8);
    // Octagonal dressed-stone plinth foundations beneath Twin Minarets (`X = ±16.8, Z = +25.4`)
    for (const sx of [-1, +1]) {
      stoneB.addCylinderPrism(sx * 16.8, 0.0, 0.95, 25.4, 2.75, 2.55, 8, Math.PI / 8, true);
    }
    // Flanking courtyard wing stone plinth strips (`X = ±25..±51, Z = +20..+24.2`)
    stoneB.addBoxBounds(-51.0, -25.0, 0.0, 0.32, 19.8, 24.2);
    stoneB.addBoxBounds(25.0, 51.0, 0.0, 0.32, 19.8, 24.2);
    pushPiece(pb, {
      id: 'z1_gatehouse_stone_plinth',
      label: 'East Gatehouse & Minaret Sandstone Podium',
      phase: 1,
      span: [0.35, 0.98],
    });
  }

  // 3. Central Courtyard Perimeter Stone Kerbs & Howz Ablution Basin Walls (step 0.65 -> 1.18)
  {
    const pb = new PieceBuilder();
    const stoneB = pb.bucket(materials.carvedStonePlinth);
    const tileB = pb.bucket(materials.turquoiseTile);

    // North & South Riwaq gallery stone plinth strips (`|X| = 42.5..51.0, Z = -48.5..+20.5`)
    stoneB.addBoxBounds(-51.0, -42.5, 0.0, 0.32, -48.5, 20.5);
    stoneB.addBoxBounds(42.5, 51.0, 0.0, 0.32, -48.5, 20.5);

    // Central Howz ablution basin at (0, 0, -16): 15.6m × 15.6m stone basin perimeter walls
    stoneB.addBoxBounds(-8.4, 8.4, -1.15, -0.78, -24.4, -7.6); // bottom masonry floor
    tileB.addBoxBounds(-7.6, 7.6, -0.78, -0.68, -23.6, -8.4);  // glazed turquoise pool bed
    // Four dressed sandstone coping walls around Howz (`Y = -0.8 .. +0.62`)
    stoneB.addBoxBounds(-8.5, 8.5, -0.80, 0.62, -24.5, -23.5);
    stoneB.addBoxBounds(-8.5, 8.5, -0.80, 0.62, -8.5, -7.5);
    stoneB.addBoxBounds(-8.5, -7.5, -0.80, 0.62, -23.5, -8.5);
    stoneB.addBoxBounds(7.5, 8.5, -0.80, 0.62, -23.5, -8.5);
    // Low chamfered ablution sitting curb ledges (`Z` & `X` flanks)
    stoneB.addBoxBounds(-9.3, 9.3, 0.0, 0.32, -25.3, -24.5);
    stoneB.addBoxBounds(-9.3, 9.3, 0.0, 0.32, -7.5, -6.7);
    stoneB.addBoxBounds(-9.3, -8.5, 0.0, 0.32, -24.5, -7.5);
    stoneB.addBoxBounds(8.5, 9.3, 0.0, 0.32, -24.5, -7.5);

    pushPiece(pb, {
      id: 'z1_howz_basin_plinth',
      label: 'Central Howz Ablution Basin & Courtyard Kerbs',
      phase: 1,
      span: [0.65, 1.18],
    });
  }

  // 4. Grand Namazgah Stepped Sandstone Sanctuary Podium (step 1.24 -> 1.88)
  {
    const pb = new PieceBuilder();
    const stoneB = pb.bucket(materials.carvedStonePlinth);
    // Main elevated floor podium of the Grand Prayer Hall (`X = -48..+48, Z = -87..-48, Y = 0..0.72`)
    stoneB.addBoxBounds(-48.4, 48.4, 0.0, 0.72, -87.4, -48.0);
    // Two long carved limestone tread steps descending into courtyard along Z = -48..-46.4
    stoneB.addBoxBounds(-48.4, 48.4, 0.0, 0.48, -48.0, -47.2);
    stoneB.addBoxBounds(-48.4, 48.4, 0.0, 0.28, -47.2, -46.4);
    pushPiece(pb, {
      id: 'z1_namazgah_podium',
      label: 'Namazgah Stepped Prayer Hall Stone Podium',
      phase: 1,
      span: [1.24, 1.88],
    });
  }

  // 5. Carved Octagonal Stone Column Footing Pedestals (`140` bases for Zone 4 green columns, step 1.68 -> 2.35)
  {
    const pb = new PieceBuilder();
    const stoneB = pb.bucket(materials.carvedStonePlinth);
    const colsX = 18;
    const rowsZ = 8;
    for (let ix = 0; ix < colsX; ix++) {
      const px = -42.5 + ix * 5.0; // [-42.5 .. +42.5] step 5.0 m
      for (let iz = 0; iz < rowsZ; iz++) {
        const pz = -83.5 + iz * 4.8; // [-83.5 .. -49.9] step 4.8 m
        // Skip 4 bases directly inside the central Mihrab sanctuary axis (`|x| < 3 && z < -78`) -> 144 - 4 = 140 pedestals!
        if (Math.abs(px) < 3.0 && pz < -78.0) continue;
        stoneB.addCylinderPrism(px, 0.72, 1.06, pz, 0.36, 0.30, 8, Math.PI / 8, true);
      }
    }
    pushPiece(pb, {
      id: 'z1_column_stone_footings',
      label: '140 Octagonal Stone Column Pedestals',
      phase: 1,
      span: [1.68, 2.35],
    });
  }

  return {
    zoneId: 'zone1_foundations_piers1',
    group,
    pieces: built,
  };
}
