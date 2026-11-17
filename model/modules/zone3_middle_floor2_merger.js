/**
 * Zone 3 — Monumental Saffron-Ochre East Gatehouse (Derwaza), Pointed Iwan Portal,
 * Glazed Kashi Tilework, Flanking Two-Tier Colonnades, Octagonal Naqara-Khana Pavilion,
 * and Lower-to-Mid Twin Tapering Brick Minarets
 * (`model/modules/zone3_middle_floor2_merger.js`)
 *
 * Step Span: `4.20 -> 7.20` (Calibrated Stops: Stop 04 `5.50`, Stop 05 `7.20`)
 */

import {
  PieceBuilder,
  addPointedArchBay,
  addRibbedDome,
  addCrescentFinial,
  addCrenellationRow,
} from './z2_geom_helpers.js';

export function buildZone({ THREE, materials }) {
  if (!THREE) throw new Error('zone3_middle_floor2_merger.buildZone requires ctx.THREE');

  const group = new THREE.Group();
  group.name = 'zone3_middle_floor2_merger';

  const built = [];
  const pushPiece = (pb, meta) => {
    const res = pb.finalize(THREE, meta);
    group.add(res.piece.object3D);
    built.push(res.piece);
  };

  // 1. Flanking Gatehouse Wing Galleries (X = ±7.2 .. ±24.0, Z = 20.6 .. 26.2, step 4.20 -> 4.95)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const roofB = pb.bucket(materials.roofTerraceEarth);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const cobaltB = pb.bucket(materials.cobaltTile);
    const greenWoodB = pb.bucket(materials.namazgahGreenWood);

    for (const side of [-1, +1]) {
      const xNear = side * 7.2;
      const xFar = side * 24.0;
      const xMin = Math.min(xNear, xFar);
      const xMax = Math.max(xNear, xFar);
      const wingCenter = (xMin + xMax) * 0.5;
      const wingLen = xMax - xMin; // 16.8 m

      // Solid masonry body behind lower ground niches + upper blind gallery
      brickB.addBoxBounds(xMin, xMax, 0.44, 6.20, 21.0, 25.0);

      // 3 lower front street-facing pointed blind niches (`Z = +25.4`)
      const nBays = 3;
      const bayW = wingLen / nBays;
      for (let i = 0; i < nBays; i++) {
        const bx = xMin + (i + 0.5) * bayW;
        addPointedArchBay(brickB, plasterB, {
          cx: bx,
          cz: 25.65,
          yBase: 0.44,
          yTop: 6.20,
          bayWidth: bayW,
          archWidth: 3.35,
          ySpring: 2.55,
          yCrown: 4.55,
          depth: 0.85,
          axis: 'x',
          segments: 8,
        });
        // Deep plaster tympanum & glazed cobalt/turquoise diamond medallions
        plasterB.addBox(bx, 2.55, 25.12, 3.25, 4.10, 0.25);
        cobaltB.addBox(bx, 5.10, 26.10, 1.35, 0.55, 0.14);
        turquoiseB.addBox(bx, 5.10, 26.14, 0.72, 0.28, 0.14);

        // Courtyard-facing open arcade bay on Z = 20.6
        addPointedArchBay(brickB, plasterB, {
          cx: bx,
          cz: 20.55,
          yBase: 0.44,
          yTop: 5.85,
          bayWidth: bayW,
          archWidth: 3.45,
          ySpring: 2.40,
          yCrown: 4.30,
          depth: 0.65,
          axis: 'x',
          segments: 8,
        });
      }

      // Upper cornice frieze & painted timber gallery beams
      turquoiseB.addBox(wingCenter, 5.75, 26.08, wingLen, 0.28, 0.16);
      greenWoodB.addBox(wingCenter, 5.95, 20.45, wingLen, 0.22, 0.28);
      roofB.addBox(wingCenter, 6.12, 23.0, wingLen + 0.3, 0.34, 5.4);

      addCrenellationRow(brickB, plasterB, {
        x0: xMin,
        x1: xMax,
        z0: 25.85,
        z1: 25.85,
        yBase: 6.20,
        height: 0.85,
        thick: 0.38,
        count: 8,
        axis: 'x',
      });
    }

    pushPiece(pb, {
      id: 'z3_gatehouse_wing_colonnades',
      label: 'Gatehouse Flanking Galleries & Street Colonnades',
      phase: 3,
      span: [4.2, 4.95],
    });
  }

  // 2. Monumental Saffron-Ochre Central Iwan Portal (Pishtaqs, X = -7.2 .. +7.2, Y = 0.44 .. 13.80, step 4.65 -> 5.48)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const cobaltB = pb.bucket(materials.cobaltTile);
    const woodB = pb.bucket(materials.carvedWalnutWood);
    const brassB = pb.bucket(materials.brassCrescent);
    const roofB = pb.bucket(materials.roofTerraceEarth);

    // Massive flanking pishtaq piers (`X = ±4.5..±7.2, Z = 21.6..27.4, Y = 0.44..13.80`)
    brickB.addBoxBounds(-7.2, -4.5, 0.44, 13.8, 21.6, 27.4);
    brickB.addBoxBounds(4.5, 7.2, 0.44, 13.8, 21.6, 27.4);

    // Vaulted outer Pishtaq Pointed Iwan arch framing the entry bay (`Z = +26.85`)
    addPointedArchBay(brickB, plasterB, {
      cx: 0,
      cz: 26.85,
      yBase: 0.44,
      yTop: 13.8,
      bayWidth: 14.4,
      archWidth: 8.8,
      ySpring: 6.3,
      yCrown: 11.4,
      depth: 1.15,
      axis: 'x',
      segments: 14,
    });

    // Inner recessed entry wall with double-arch shadow gallery (`Z = +23.25`)
    addPointedArchBay(brickB, plasterB, {
      cx: 0,
      cz: 23.25,
      yBase: 0.44,
      yTop: 11.8,
      bayWidth: 9.2,
      archWidth: 5.2,
      ySpring: 4.1,
      yCrown: 6.9,
      depth: 0.9,
      axis: 'x',
      segments: 12,
    });

    // Deep coffered plaster Muqarnas soffit & side recessed niches inside the Iwan bay
    for (const side of [-1, +1]) {
      brickB.addBox(side * 4.45, 5.8, 25.0, 0.45, 9.6, 3.6);
      plasterB.addBox(side * 4.18, 3.2, 25.0, 0.16, 4.4, 2.2);
      turquoiseB.addBox(side * 4.14, 5.7, 25.0, 0.14, 0.42, 2.5);
    }
    // Stepped Muqarnas honeycomb hood vault inside the Iwan crown (`Y = 8.4..11.2, Z = 23.8..26.5`)
    for (let tier = 0; tier < 5; tier++) {
      const f = tier / 4;
      const yT = 8.6 + f * 2.5;
      const wT = 8.4 - f * 2.4;
      const zT = 23.6 + f * 2.4;
      plasterB.addBox(0, yT, zT, wT, 0.46, 0.72);
    }

    // Glazed Turquoise & Cobalt Kashi Mosaic Tilework framing the Pishtaq Face (`Z = +27.45`)
    // Vertical flanking mosaic pilasters (`guldasta` frame)
    for (const side of [-1, +1]) {
      cobaltB.addBox(side * 6.85, 7.1, 27.46, 0.56, 13.1, 0.14);
      turquoiseB.addBox(side * 6.25, 7.1, 27.44, 0.34, 13.1, 0.12);
      // Flanking chamfered corner slender Brick-and-Tile corner engaged shafts (`Guldasta`)
      brickB.addCylinderPrism(side * 7.22, 0.44, 14.3, 27.32, 0.46, 0.42, 10);
      turquoiseB.addCylinderPrism(side * 7.22, 13.8, 14.55, 27.32, 0.48, 0.45, 10);
    }
    // Horizontal calligraphic Kashi frieze across top of Gatehouse Iwan (`Y = 12.15..13.55`)
    cobaltB.addBox(0, 12.85, 27.46, 13.4, 1.15, 0.14);
    turquoiseB.addBox(0, 12.85, 27.51, 12.6, 0.44, 0.12);
    plasterB.addBox(0, 12.15, 27.48, 13.6, 0.24, 0.16);
    // Pointed arch glazed tympanum rosettes above portal opening
    turquoiseB.addBox(-3.6, 10.6, 27.45, 1.4, 1.1, 0.14);
    turquoiseB.addBox(3.6, 10.6, 27.45, 1.4, 1.1, 0.14);
    cobaltB.addBox(0, 11.75, 27.46, 1.2, 0.7, 0.14);

    // Grand Carved Walnut Ceremonial Double Doors (`X = -2.6..+2.6, Y = 0.44..4.85, Z = 23.25`)
    woodB.addBox(-1.26, 2.65, 23.28, 2.42, 4.35, 0.24);
    woodB.addBox(1.26, 2.65, 23.28, 2.42, 4.35, 0.24);
    // Raised moulded stiles & brass door bosses/knockers
    for (const sx of [-1, +1]) {
      woodB.addBox(sx * 1.26, 3.3, 23.42, 1.7, 1.7, 0.08);
      woodB.addBox(sx * 1.26, 1.5, 23.42, 1.7, 1.4, 0.08);
      brassB.addCylinderPrism(sx * 0.35, 2.15, 2.35, 23.48, 0.14, 0.14, 10);
    }

    // Courtyard-side Pishtaq Gatehouse Rear Archway (`Z = +21.6`)
    addPointedArchBay(brickB, plasterB, {
      cx: 0,
      cz: 21.6,
      yBase: 0.44,
      yTop: 12.6,
      bayWidth: 14.0,
      archWidth: 5.6,
      ySpring: 4.2,
      yCrown: 7.4,
      depth: 0.85,
      axis: 'x',
      segments: 10,
    });

    // Gatehouse terrace slab & top parapet merlons
    roofB.addBox(0, 13.68, 24.5, 14.4, 0.36, 5.8);
    addCrenellationRow(brickB, plasterB, {
      x0: -7.1,
      x1: 7.1,
      z0: 27.22,
      z1: 27.22,
      yBase: 13.8,
      height: 0.92,
      thick: 0.42,
      count: 9,
      axis: 'x',
    });

    pushPiece(pb, {
      id: 'z3_east_gatehouse_iwan_portal',
      label: 'Monumental Saffron-Ochre East Iwan Portal & Walnut Doors',
      phase: 3,
      span: [4.65, 5.48],
    });
  }

  // 3. Rooftop Octagonal Drum Pavilion (Naqara-Khana) & Cupola (Y = 13.80 .. 19.80, step 5.60 -> 6.45)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const greenWoodB = pb.bucket(materials.namazgahGreenWood);
    const brassB = pb.bucket(materials.brassCrescent);

    const pavCx = 0;
    const pavCz = 24.5;
    const yBase = 13.80;

    // Octagonal moulded plinth base
    brickB.addCylinderPrism(pavCx, yBase, yBase + 0.55, pavCz, 3.65, 3.55, 8, Math.PI / 8, true);

    // 8 Corner Piers & Pointed Lattice Openings of Naqara-Khana (`Y = 14.35 .. 17.65`)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const px = pavCx + Math.cos(a) * 3.15;
      const pz = pavCz + Math.sin(a) * 3.15;
      brickB.addBox(px, yBase + 2.15, pz, 0.52, 3.25, 0.52);
      turquoiseB.addBox(px, yBase + 3.45, pz, 0.58, 0.35, 0.58);
      // Green painted wooden balustrade rails between octagonal piers
      const aNext = ((k + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      const nx = pavCx + Math.cos(aNext) * 3.15;
      const nz = pavCz + Math.sin(aNext) * 3.15;
      greenWoodB.addBeam([px, yBase + 1.15, pz], [nx, yBase + 1.15, nz], 0.14, 0.16);
      plasterB.addBeam([px, yBase + 3.62, pz], [nx, yBase + 3.62, nz], 0.42, 0.48);
    }

    // Upper octagonal collar drum & ribbed turquoise cupola + brass finial (`Y = 17.65 .. 21.2`)
    turquoiseB.addCylinderPrism(pavCx, yBase + 3.70, yBase + 4.35, pavCz, 3.35, 3.25, 8, Math.PI / 8, true);
    addRibbedDome(turquoiseB, plasterB, {
      cx: pavCx,
      cz: pavCz,
      yBase: yBase + 4.35,
      radius: 2.95,
      height: 2.45,
      sides: 16,
      ribs: 8,
    });
    addCrescentFinial(brassB, {
      cx: pavCx,
      cz: pavCz,
      yBase: yBase + 6.72,
      height: 1.65,
      facingAxis: 'z',
    });

    pushPiece(pb, {
      id: 'z3_naqara_khana_pavilion',
      label: 'Rooftop Octagonal Drum Pavilion (Naqara-Khana) & Cupola',
      phase: 3,
      span: [5.6, 6.45],
    });
  }

  // 4. Lower & Mid Twin Tapering Brick Minarets (X = ±16.8, Z = +25.4, Y = 0.95 .. 14.55, step 6.05 -> 7.18)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const cobaltB = pb.bucket(materials.cobaltTile);

    for (const sx of [-1, +1]) {
      const mx = sx * 16.8;
      const mz = 25.4;

      // Tapering saffron-ochre cylindrical brick shaft (`Y = 0.95 .. 14.55`, R = 2.08 -> 1.46 m)
      brickB.addCylinderPrism(mx, 0.95, 5.4, mz, 2.08, 1.92, 20, 0, true);
      brickB.addCylinderPrism(mx, 5.4, 10.0, mz, 1.92, 1.68, 20, 0, true);
      brickB.addCylinderPrism(mx, 10.0, 14.55, mz, 1.68, 1.46, 20, 0, true);

      // Decorative glazed Kashi ceramic belly bands (signature Id Kah minaret rhythm!)
      const bandLevels = [
        [2.45, 2.95, 2.06, 'turquoise'],
        [5.25, 5.75, 1.96, 'cobalt'],
        [8.15, 8.60, 1.82, 'turquoise'],
        [11.05, 11.45, 1.66, 'cobalt'],
        [13.45, 13.85, 1.54, 'plaster'],
      ];
      for (const [y0, y1, rBand, kind] of bandLevels) {
        const target =
          kind === 'turquoise' ? turquoiseB : kind === 'cobalt' ? cobaltB : plasterB;
        target.addCylinderPrism(mx, y0, y1, mz, rBand, rBand - 0.02, 20, 0, false);
      }

      // Stepped brick Muqarnas corbel neck flaring outward toward sherefe balcony (`Y = 13.85 .. 14.55`)
      brickB.addCylinderPrism(mx, 13.85, 14.22, mz, 1.49, 1.74, 16, 0, false);
      plasterB.addCylinderPrism(mx, 14.22, 14.55, mz, 1.74, 2.02, 16, 0, false);
    }

    pushPiece(pb, {
      id: 'z3_twin_minarets_shafts',
      label: 'Twin Tapering Brick Minaret Shafts & Kashi Glazed Bands',
      phase: 3,
      span: [6.05, 7.18],
    });
  }

  return {
    zoneId: 'zone3_middle_floor2_merger',
    group,
    pieces: built,
  };
}

export default buildZone;
