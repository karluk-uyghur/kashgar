/**
 * Zone 2 — Courtyard Brick Paving, Howz Pool Water Fill, Courtyard Wall & 28 Pointed Riwaq Arcades
 * (`model/modules/zone2_arches_floor1.js`)
 *
 * Step Span: `2.00 -> 4.55` (Calibrated Stops: Stop 02 `2.60`, Stop 03 `4.00`)
 */

import {
  PieceBuilder,
  addPointedArchBay,
  addCrenellationRow,
} from './z2_geom_helpers.js';

export function buildZone({ THREE, materials }) {
  if (!THREE) throw new Error('zone2_arches_floor1.buildZone requires ctx.THREE');

  const group = new THREE.Group();
  group.name = 'zone2_arches_floor1';

  const built = [];
  const pushPiece = (pb, meta) => {
    const res = pb.finalize(THREE, meta);
    group.add(res.piece.object3D);
    built.push(res.piece);
  };

  // 1. Kiln-Fired Brick Courtyard Paving Slabs & Axial Walkways (step 2.00 -> 2.55)
  {
    const pb = new PieceBuilder();
    const paverB = pb.bucket(materials.courtyardPaver);
    const stoneB = pb.bucket(materials.carvedStonePlinth);

    // 4 quadrant brick courtyard slabs framed around central Howz pool (`X in [-9.3, +9.3], Z in [-25.3, -6.7]`)
    paverB.addBoxBounds(-43.0, 43.0, 0.0, 0.20, -46.4, -25.3);  // West-central bay toward Namazgah
    paverB.addBoxBounds(-43.0, 43.0, 0.0, 0.20, -6.7, 19.6);    // East-central bay inside Gatehouse
    paverB.addBoxBounds(-43.0, -9.3, 0.0, 0.20, -25.3, -6.7);   // North flanking Howz apron
    paverB.addBoxBounds(9.3, 43.0, 0.0, 0.20, -25.3, -6.7);     // South flanking Howz apron

    // Raised stone ceremonial walkway bands linking East Gate -> Howz -> Namazgah
    stoneB.addBoxBounds(-3.2, 3.2, 0.16, 0.24, -6.7, 19.6);
    stoneB.addBoxBounds(-3.8, 3.8, 0.16, 0.24, -46.4, -25.3);
    // Transverse North-South stone walk ribs
    stoneB.addBoxBounds(-42.5, -9.3, 0.16, 0.24, -18.2, -13.8);
    stoneB.addBoxBounds(9.3, 42.5, 0.16, 0.24, -18.2, -13.8);

    // Planted tree-bed stone curbs framing 4 quiet courtyard oasis plots
    for (const sx of [-1, +1]) {
      for (const cz of [-35.5, 6.5]) {
        const bx = sx * 27.0;
        stoneB.addBoxBounds(bx - 5.2, bx + 5.2, 0.18, 0.44, cz - 5.2, cz - 4.7);
        stoneB.addBoxBounds(bx - 5.2, bx + 5.2, 0.18, 0.44, cz + 4.7, cz + 5.2);
        stoneB.addBoxBounds(bx - 5.2, bx - 4.7, 0.18, 0.44, cz - 4.7, cz + 4.7);
        stoneB.addBoxBounds(bx + 4.7, bx + 5.2, 0.18, 0.44, cz - 4.7, cz + 4.7);
      }
    }

    pushPiece(pb, {
      id: 'z2_courtyard_pavers_paths',
      label: 'Courtyard Kiln-Fired Brick Paving & Stone Walkways',
      phase: 2,
      span: [2.0, 2.55],
    });
  }

  // 2. Central Howz Ablution Pool Turquoise-Jade Water Surface (step 2.38 -> 2.59)
  {
    const pb = new PieceBuilder();
    const waterB = pb.bucket(materials.howzWater);
    waterB.addBoxBounds(-7.52, 7.52, 0.34, 0.44, -23.52, -8.48);
    pushPiece(pb, {
      id: 'z2_howz_pool_water_fill',
      label: 'Howz Central Ablution Pool Water Fill',
      phase: 2,
      span: [2.38, 2.59],
    });
  }

  // 3. North & South Courtyard Covered Riwaq Pointed-Arch Galleries (step 2.75 -> 3.92)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const roofB = pb.bucket(materials.roofTerraceEarth);
    const woodB = pb.bucket(materials.carvedWalnutWood);

    const nBays = 12; // Z from -46.0 to +20.0 -> bay width = 5.5 m
    const bayW = 5.5;
    const zStart = -46.0;

    for (const side of [-1, +1]) {
      const innerFaceX = side * 43.2;
      const outerWallX = side * 49.8;
      const midRoofX = (innerFaceX + outerWallX) * 0.5;
      const arcadeDepth = 0.72;

      // Solid outer perimeter courtyard brick wall (`Y = 0.32..4.65`)
      brickB.addBoxBounds(
        Math.min(outerWallX - 0.35, outerWallX + 0.35),
        Math.max(outerWallX - 0.35, outerWallX + 0.35),
        0.32,
        4.65,
        -48.0,
        24.0
      );

      // Gallery rear niches & pointed arcade bays facing courtyard (`axis = 'z'`)
      for (let i = 0; i < nBays; i++) {
        const cz = zStart + (i + 0.5) * bayW;
        addPointedArchBay(brickB, plasterB, {
          cx: innerFaceX,
          cz,
          yBase: 0.32,
          yTop: 4.55,
          bayWidth: bayW,
          archWidth: 3.45,
          ySpring: 2.35,
          yCrown: 3.95,
          depth: arcadeDepth,
          axis: 'z',
          segments: 8,
        });

        // Carved plaster backing panel & walnut study-cell doors inside every second Riwaq bay
        if (i % 2 === 1) {
          plasterB.addBox(side * 49.35, 2.05, cz, 0.16, 2.60, 2.10);
          woodB.addBox(side * 49.26, 1.75, cz, 0.14, 2.15, 1.35);
        }
      }

      // Earthen terrace roof deck & timber roof edge beams spanning between inner arcade and outer wall
      roofB.addBox(midRoofX, 4.48, -13.0, Math.abs(outerWallX - innerFaceX) + 0.4, 0.34, 68.0);
      woodB.addBox(innerFaceX, 4.18, -13.0, 0.28, 0.24, 66.5);

      // Courtyard-facing saffron-ochre parapet crenellations
      addCrenellationRow(brickB, plasterB, {
        x0: innerFaceX,
        x1: innerFaceX,
        z0: -46.0,
        z1: 20.0,
        yBase: 4.55,
        height: 0.65,
        thick: 0.38,
        count: 24,
        axis: 'z',
      });
    }

    pushPiece(pb, {
      id: 'z2_riwaq_north_south_arcades',
      label: 'North & South Pointed-Arch Riwaq Courtyard Galleries',
      phase: 2,
      span: [2.75, 3.92],
    });
  }

  // 4. East Perimeter Flanking Arcade Wings Joining Gatehouse to Corners (step 3.65 -> 4.45)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const roofB = pb.bucket(materials.roofTerraceEarth);
    const turquoiseB = pb.bucket(materials.turquoiseTile);

    for (const side of [-1, +1]) {
      const xMin = side < 0 ? -49.8 : 24.0;
      const xMax = side < 0 ? -24.0 : 49.8;
      const midX = (xMin + xMax) * 0.5;
      const wingSpan = 25.8;
      const nWingBays = 5;
      const bayW = wingSpan / nWingBays;

      // Exterior street-facing wing facade along `Z = +24.0` (flanking Gatehouse toward Id Kah Square!)
      for (let i = 0; i < nWingBays; i++) {
        const bx = xMin + (i + 0.5) * bayW;
        addPointedArchBay(brickB, plasterB, {
          cx: bx,
          cz: 23.65,
          yBase: 0.32,
          yTop: 5.05,
          bayWidth: bayW,
          archWidth: 3.15,
          ySpring: 2.30,
          yCrown: 3.95,
          depth: 0.68,
          axis: 'x',
          segments: 8,
        });
        // Recessed pale plaster blind niche inside each street-facing bay
        plasterB.addBox(bx, 2.25, 22.85, 3.05, 3.55, 0.25);
        // Glazed turquoise ceramic spandrel keystone diamond
        turquoiseB.addBox(bx, 4.35, 24.02, 0.85, 0.45, 0.14);
      }

      // Courtyard-facing rear facade of East wing (`Z = +20.2`)
      brickB.addBox(midX, 2.65, 20.15, wingSpan, 4.65, 0.60);
      roofB.addBox(midX, 4.92, 21.9, wingSpan, 0.32, 3.8);

      // Stepped front crenellations along Id Kah Square
      addCrenellationRow(brickB, plasterB, {
        x0: xMin,
        x1: xMax,
        z0: 23.82,
        z1: 23.82,
        yBase: 5.05,
        height: 0.72,
        thick: 0.36,
        count: 10,
        axis: 'x',
      });
    }

    pushPiece(pb, {
      id: 'z2_east_perimeter_wings',
      label: 'East Flanking Perimeter Walls & Street Arcades',
      phase: 2,
      span: [3.65, 4.45],
    });
  }

  return {
    zoneId: 'zone2_arches_floor1',
    group,
    pieces: built,
  };
}
