/**
 * Zone 4 — Grand Namazgah Prayer Hall (140 Emerald-Green Fluted Pillars & Coffered Ceiling),
 * Winter Sanctuary Walls & Carved Walnut Panjara Lattice, Qibla Mihrab & Stepped Minbar,
 * Upper Minaret Sherefe Balconies, Ribbed Domes & Brass Hilal Crescents
 * (`model/modules/zone4_upper_shaft_summit.js`)
 *
 * Step Span: `7.20 -> 10.80` (Calibrated Stops: Stop 06 `8.80`, Stop 07 `10.00`, Stop 08 `11.00`)
 */

import {
  GeomBuilder,
  PieceBuilder,
  addPointedArchBay,
  addRibbedDome,
  addCrescentFinial,
  addCrenellationRow,
  addPanjaraScreen,
} from './z2_geom_helpers.js';

export function buildZone({ THREE, materials }) {
  if (!THREE) throw new Error('zone4_upper_shaft_summit.buildZone requires ctx.THREE');

  const group = new THREE.Group();
  group.name = 'zone4_upper_shaft_summit';

  const built = [];
  const pushPiece = (pb, meta) => {
    const res = pb.finalize(THREE, meta);
    group.add(res.piece.object3D);
    built.push(res.piece);
  };

  // Compute exact 140 pillar positions matching Zone 1 octagonal stone pedestals
  const pillarCoords = [];
  for (let ix = 0; ix < 18; ix++) {
    const px = -42.5 + ix * 5.0; // [-42.5 .. +42.5]
    for (let iz = 0; iz < 8; iz++) {
      const pz = -83.5 + iz * 4.8; // [-83.5 .. -49.9]
      if (Math.abs(px) < 3.0 && pz < -78.0) continue; // Clear Qibla Mihrab bay (144 - 4 = 140)
      pillarCoords.push([px, pz]);
    }
  }

  // 1. 140 Emerald-Green Fluted Timber Pillars & Carved Corbel Capitals (`InstancedMesh`, step 7.25 -> 8.15)
  {
    const pillarGroup = new THREE.Group();
    pillarGroup.name = 'z4_namazgah_green_pillars';

    // Single tapering octagonal/12-sided fluted timber column geometry (`Y = 0 .. 5.29 m`, seated at Y = 1.06 m pedestal top)
    const shaftGB = new GeomBuilder(256, 512);
    shaftGB.addLatheProfile(
      0,
      0,
      [
        [0.24, 0.0],
        [0.27, 0.14],
        [0.23, 0.28],
        [0.215, 2.6],
        [0.185, 4.9],
        [0.23, 5.05],
        [0.27, 5.29],
      ],
      12,
      0,
      true,
      true
    );
    const shaftGeom = shaftGB.toBufferGeometry(THREE);
    const shaftInst = new THREE.InstancedMesh(
      shaftGeom,
      materials.namazgahGreenWood,
      pillarCoords.length
    );
    shaftInst.name = 'z4_namazgah_140_pillar_shafts';
    shaftInst.castShadow = true;
    shaftInst.receiveShadow = true;

    // Carved Uyghur stepped wooden corbel capital (`Y = 5.29 .. 5.79 m`, relative to Y = 1.06 m => Y_world = 6.35 .. 6.85 m)
    const corbelGB = new GeomBuilder(128, 256);
    corbelGB.addBox(0, 5.40, 0, 0.72, 0.22, 0.72);
    corbelGB.addBox(0, 5.62, 0, 1.38, 0.24, 0.62);
    corbelGB.addBox(0, 5.62, 0, 0.62, 0.24, 1.38);
    const corbelGeom = corbelGB.toBufferGeometry(THREE);
    const corbelInst = new THREE.InstancedMesh(
      corbelGeom,
      materials.carvedWalnutWood,
      pillarCoords.length
    );
    corbelInst.name = 'z4_namazgah_140_pillar_corbels';
    corbelInst.castShadow = true;
    corbelInst.receiveShadow = true;

    const dummyMat = new THREE.Matrix4();
    for (let i = 0; i < pillarCoords.length; i++) {
      const [px, pz] = pillarCoords[i];
      dummyMat.makeTranslation(px, 1.06, pz);
      shaftInst.setMatrixAt(i, dummyMat);
      corbelInst.setMatrixAt(i, dummyMat);
    }
    shaftInst.instanceMatrix.needsUpdate = true;
    corbelInst.instanceMatrix.needsUpdate = true;
    shaftInst.computeBoundingSphere();
    corbelInst.computeBoundingSphere();

    pillarGroup.add(shaftInst);
    pillarGroup.add(corbelInst);
    group.add(pillarGroup);

    built.push({
      id: 'z4_namazgah_green_pillars',
      label: '140 Fluted Emerald-Green Namazgah Timber Pillars & Corbels',
      phase: 4,
      span: [7.25, 8.15],
      category: 'permanent',
      yMin: 1.06,
      yMax: 6.85,
      object3D: pillarGroup,
    });
  }

  // 2. Coffered Timber Ceiling Beams (`Torus`), Terrace Roof & Parapet Merlons (step 7.85 -> 8.72)
  {
    const pb = new PieceBuilder();
    const greenWoodB = pb.bucket(materials.namazgahGreenWood);
    const walnutB = pb.bucket(materials.carvedWalnutWood);
    const roofB = pb.bucket(materials.roofTerraceEarth);
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);

    // Longitudinal primary beams along Z (`18` column lines X = -42.5 .. +42.5)
    for (let ix = 0; ix < 18; ix++) {
      const px = -42.5 + ix * 5.0;
      greenWoodB.addBox(px, 6.62, -67.2, 0.30, 0.36, 39.2);
    }
    // Transverse secondary joists along X (`9` bays from Z = -86.5 .. -48.0)
    for (let iz = 0; iz <= 16; iz++) {
      const pz = -85.8 + iz * 2.4;
      walnutB.addBox(0, 6.82, pz, 94.0, 0.18, 0.22);
    }

    // Main rammed-loess earthen terrace roof deck (`X = -47.5..+47.5, Z = -87.0..-47.6, Y = 6.90..7.28`)
    roofB.addBoxBounds(-47.6, 47.6, 6.90, 7.28, -87.0, -47.6);
    // Decorative green timber eaves fascia beam along courtyard veranda edge (`Z = -47.6`)
    greenWoodB.addBox(0, 6.72, -47.65, 95.4, 0.42, 0.34);

    // Perimeter rooftop parapet crenellations facing courtyard along Z = -47.75
    addCrenellationRow(brickB, plasterB, {
      x0: -47.2,
      x1: 47.2,
      z0: -47.75,
      z1: -47.75,
      yBase: 7.28,
      height: 0.72,
      thick: 0.36,
      count: 34,
      axis: 'x',
    });

    pushPiece(pb, {
      id: 'z4_namazgah_coffered_roof',
      label: 'Namazgah Coffered Timber Ceiling & Earthen Terrace Roof',
      phase: 4,
      span: [7.85, 8.72],
    });
  }

  // 3. Winter Sanctuary Enclosure Walls & Carved Walnut Panjara Lattice Screens (step 8.45 -> 9.35)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const walnutB = pb.bucket(materials.carvedWalnutWood);
    const greenWoodB = pb.bucket(materials.namazgahGreenWood);
    const turquoiseB = pb.bucket(materials.turquoiseTile);

    // West Qibla Wall (`Z = -86.4, X = -47.5..+47.5, Y = 0.72..7.28`)
    brickB.addBoxBounds(-47.5, 47.5, 0.72, 7.28, -86.9, -86.1);
    plasterB.addBoxBounds(-46.8, 46.8, 1.0, 6.45, -86.1, -85.92);

    // North & South Enclosure Walls (`X = ±47.1, Z = -86.5..-48.0`)
    for (const side of [-1, +1]) {
      brickB.addBox(side * 47.1, 4.0, -67.25, 0.72, 6.56, 38.5);
      // Recessed courtyard-facing wall arches along outer Summer Veranda aisles
      for (let j = 0; j < 6; j++) {
        const cz = -83.5 + j * 5.8;
        plasterB.addBox(side * 46.65, 3.35, cz, 0.16, 4.1, 3.6);
      }
    }

    // Divider Wall (`Z = -63.5`) separating Open Summer Veranda (`Z in [-63.5, -48]`) from Winter Sanctuary (`Z in [-86.1, -63.5]`)
    // Composed of green timber framing, brick piers, pointed arch central entry, and 14 carved walnut Panjara lattice screens!
    const divZ = -63.5;
    for (let ix = 0; ix < 17; ix++) {
      const bayCx = -40.0 + ix * 5.0; // centered between columns (-42.5 + ix*5 .. -42.5 + (ix+1)*5)
      if (ix === 8) {
        // Central grand ceremonial portal between Summer Veranda & Winter Sanctuary (`X = -2.5..+2.5`)
        addPointedArchBay(brickB, plasterB, {
          cx: 0,
          cz: divZ,
          yBase: 0.72,
          yTop: 6.45,
          bayWidth: 5.0,
          archWidth: 3.6,
          ySpring: 3.6,
          yCrown: 5.55,
          depth: 0.56,
          axis: 'x',
          segments: 10,
        });
        turquoiseB.addBox(0, 5.95, divZ + 0.30, 3.6, 0.34, 0.12);
      } else {
        // Brick dado bench wall (`Y = 0.72 .. 1.65`) + upper painted lintel transom (`Y = 5.45 .. 6.45`)
        brickB.addBox(bayCx, 1.18, divZ, 4.45, 0.92, 0.38);
        plasterB.addBox(bayCx, 5.95, divZ, 4.45, 1.0, 0.32);
        // Carved walnut Panjara openwork geometric lattice screens (`Y = 1.65 .. 5.45`)
        addPanjaraScreen(walnutB, greenWoodB, {
          cx: bayCx,
          cz: divZ,
          yBase: 1.65,
          yTop: 5.45,
          width: 4.35,
          depth: 0.18,
          axis: 'x',
          cols: 6,
          rows: 5,
        });
      }
    }

    pushPiece(pb, {
      id: 'z4_winter_sanctuary_panjara',
      label: 'Winter Prayer Sanctuary Walls & Carved Walnut Panjara Screens',
      phase: 4,
      span: [8.45, 9.35],
    });
  }

  // 4. Sacred Qibla Mihrab Niche, Stepped Carved Minbar & Brass Lanterns (step 9.15 -> 9.95)
  {
    const pb = new PieceBuilder();
    const plasterB = pb.bucket(materials.carvedPlaster);
    const cobaltB = pb.bucket(materials.cobaltTile);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const walnutB = pb.bucket(materials.carvedWalnutWood);
    const brassB = pb.bucket(materials.brassCrescent);
    const glassB = pb.bucket(materials.glass1889);

    // Qibla Mihrab Prayer Niche centered at (0, Y = 0.72..6.10, Z = -85.85) facing +Z
    addPointedArchBay(cobaltB, plasterB, {
      cx: 0,
      cz: -85.75,
      yBase: 0.72,
      yTop: 6.10,
      bayWidth: 5.6,
      archWidth: 3.1,
      ySpring: 3.15,
      yCrown: 5.15,
      depth: 0.65,
      axis: 'x',
      segments: 12,
    });
    // Glazed Kashi outer frame & calligraphic plaque
    turquoiseB.addBox(0, 5.72, -85.38, 4.8, 0.42, 0.14);
    plasterB.addBox(0, 2.85, -86.05, 3.0, 4.2, 0.18);

    // Stepped Carved Walnut Minbar Pulpit flanking right of Mihrab (`X = 3.65, Z = -83.8..-79.8`)
    for (let st = 0; st < 7; st++) {
      const yStep = 0.72 + (st + 1) * 0.34;
      const zStep = -79.8 - st * 0.52;
      walnutB.addBox(3.65, yStep * 0.5 + 0.36, zStep, 1.35, yStep - 0.72, 0.54);
    }
    // Minbar canopy kiosk & pyramidal spire (`X = 3.65, Z = -83.45, Y = 3.10..5.20`)
    walnutB.addBox(3.02, 4.15, -83.45, 0.14, 2.1, 0.14);
    walnutB.addBox(4.28, 4.15, -83.45, 0.14, 2.1, 0.14);
    walnutB.addBox(3.65, 5.15, -83.45, 1.5, 0.32, 1.4);
    brassB.addCylinderPrism(3.65, 5.31, 6.05, -83.45, 0.38, 0.04, 8, 0, true);

    // Suspended hammered-brass mosque sanctuary lanterns (Summer Veranda + Central Iwan + Sanctuary)
    const lanternPositions = [
      [-15, 4.9, -54.5],
      [-5, 4.9, -54.5],
      [5, 4.9, -54.5],
      [15, 4.9, -54.5],
      [0, 5.2, -74.5],
      [0, 8.6, 25.0],
    ];
    for (const [lx, ly, lz] of lanternPositions) {
      brassB.addCylinderPrism(lx, ly + 0.35, ly + 1.45, lz, 0.025, 0.025, 6);
      brassB.addCylinderPrism(lx, ly + 0.22, ly + 0.38, lz, 0.32, 0.12, 8);
      glassB.addCylinderPrism(lx, ly - 0.18, ly + 0.22, lz, 0.24, 0.28, 8);
      brassB.addCylinderPrism(lx, ly - 0.32, ly - 0.18, lz, 0.08, 0.24, 8);
    }

    pushPiece(pb, {
      id: 'z4_qibla_mihrab_minbar_lanterns',
      label: 'Qibla Mihrab Niche, Carved Walnut Minbar & Sanctuary Lanterns',
      phase: 4,
      span: [9.15, 9.95],
    });
  }

  // 5. Twin Minaret Sherefe Balconies, Lantern Drums, Ribbed Domes & Brass Hilal Crescents (step 9.40 -> 10.60)
  {
    const pb = new PieceBuilder();
    const brickB = pb.bucket(materials.ochreBrick);
    const plasterB = pb.bucket(materials.carvedPlaster);
    const turquoiseB = pb.bucket(materials.turquoiseTile);
    const greenWoodB = pb.bucket(materials.namazgahGreenWood);
    const brassB = pb.bucket(materials.brassCrescent);

    for (const sx of [-1, +1]) {
      const mx = sx * 16.8;
      const mz = 25.4;

      // Cantilevered Sherefe call-to-prayer balcony deck (`Y = 14.55 .. 14.88, r = 2.18 m`)
      plasterB.addCylinderPrism(mx, 14.55, 14.88, mz, 2.02, 2.22, 16, 0, true);
      // Balcony carved balustrade posts & green railing (`Y = 14.88 .. 15.72`)
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const bx = mx + Math.cos(a) * 2.04;
        const bz = mz + Math.sin(a) * 2.04;
        greenWoodB.addBox(bx, 15.30, bz, 0.16, 0.84, 0.16);
      }
      greenWoodB.addCylinderPrism(mx, 15.62, 15.74, mz, 2.12, 2.12, 16, 0, false);

      // Upper octagonal lantern arcade drum (`Y = 14.88 .. 17.25`)
      brickB.addCylinderPrism(mx, 14.88, 16.95, mz, 1.24, 1.18, 8, Math.PI / 8, true);
      turquoiseB.addCylinderPrism(mx, 16.95, 17.35, mz, 1.32, 1.28, 8, Math.PI / 8, true);

      // Ribbed turquoise & plaster melon dome (`Y = 17.35 .. 18.85`)
      addRibbedDome(turquoiseB, plasterB, {
        cx: mx,
        cz: mz,
        yBase: 17.35,
        radius: 1.22,
        height: 1.52,
        sides: 16,
        ribs: 8,
      });

      // Hammered Brass Mast, Three Alem Spheres & Crescent Moon (`Y = 18.85 .. 20.85 m`)
      addCrescentFinial(brassB, {
        cx: mx,
        cz: mz,
        yBase: 18.80,
        height: 2.05,
        facingAxis: 'z',
      });
    }

    pushPiece(pb, {
      id: 'z4_minaret_crowns_sherefe_crescents',
      label: 'Twin Minaret Sherefe Balconies, Ribbed Domes & Brass Crescents',
      phase: 4,
      span: [9.4, 10.6],
    });
  }

  return {
    zoneId: 'zone4_upper_shaft_summit',
    group,
    pieces: built,
  };
}

export default buildZone;
