/**
 * Northern Tuman Bank, Caravanserai & Madrasa Terraces (`world/w_trocadero.js`).
 *
 * Replaces Chaillot/Trocadéro behind the Tuman Canal (`Z <= -178 m`) with a terraced
 * Kashgar earthen ridge (`±1700 m` continuous ground skirt) and a Silk Road domed
 * caravanserai / madrasa courtyard complex (`Z ≈ -275 m`) framed by poplar avenues.
 */

export function buildTrocadero(ctx) {
  const { THREE, pal, box, cyl, dome, archCurve } = ctx;
  const group = new THREE.Group();
  group.name = 'trocadero_chaillot';
  const expoPavGroup = new THREE.Group();
  expoPavGroup.name = 'trocadero_expo_pavilions';
  group.add(expoPavGroup);

  // 1. North Embankment Terrace (Z in [-178, -320], Y = 0) & Gentle Oasis Ridge (Z = -320..-1700)
  box(group, pal.gravel, 0, -0.14, -249, 3400, 0.24, 142, 0, { noSketchEdges: true });
  box(group, pal.allee, 0, 0.02, -225, 28, 0.08, 94, 0, { noSketchEdges: true });

  const ridgeSteps = 8;
  for (let i = 0; i < ridgeSteps; i++) {
    const z0 = -320 - i * 24;
    const z1 = z0 - 24.4;
    const topY = (i + 1) * 1.45;
    box(group, pal.parterreMuted || pal.lawn, 0, topY * 0.5 - 0.1, 0.5 * (z0 + z1), 360, topY + 0.2, 24.8, 0, {
      noSketchEdges: i % 2 === 1,
    });
    box(group, pal.gravelSkirt || pal.gravel, -1030, topY * 0.42 - 0.1, 0.5 * (z0 + z1), 1700, topY * 0.84 + 0.3, 25.0, 0, {
      noSketchEdges: true,
    });
    box(group, pal.gravelSkirt || pal.gravel, 1030, topY * 0.42 - 0.1, 0.5 * (z0 + z1), 1700, topY * 0.84 + 0.3, 25.0, 0, {
      noSketchEdges: true,
    });
  }

  // Far northern plateau out to Z = -1700 m (disappears into distance fog at ~620 m)
  box(group, pal.gravelSkirt || pal.gravel, 0, 5.6, -1106, 3400, 11.4, 1188, 0, {
    noSketchEdges: true,
  });

  // 2. Historic Silk Road Caravanserai & Madrasa Complex (X = 0, Z = -268)
  box(expoPavGroup, pal.cream, 0, 4.6, -268, 72, 9.2, 46);
  // Courtyard cutout illusion via recessed inner roof terraces & flanking arched colonnades
  for (const sx of [-1, 1]) {
    box(expoPavGroup, pal.expoBrick, sx * 30, 5.2, -268, 12, 10.4, 48);
    for (let z = -286; z <= -250; z += 12) {
      archCurve(expoPavGroup, sx * 23.8, 3.2, z, 4.0, 3.0, 'z', 0, 8);
    }
    // Corner corner-guldasta Brick Turrets
    cyl(expoPavGroup, pal.expoBrick, sx * 36.2, 6.2, -245, 2.2, 2.5, 12.4, 10, { pilasters: 6 });
    dome(expoPavGroup, pal.patinaDome ? pal.copper : pal.slate, sx * 36.2, 12.4, -245, 2.2, 2.4, 12, { ribs: 8 });
  }
  // Central Pishtaq Portal facing Tuman Canal & Id Kah Bridge
  box(expoPavGroup, pal.stone, 0, 7.4, -244.5, 18, 14.8, 4.2);
  archCurve(expoPavGroup, 0, 6.8, -242.2, 5.2, 4.4, 'x', 0, 12);
  // Central Ribbed Cupola over Caravanserai Hall
  cyl(expoPavGroup, pal.cream, 0, 10.8, -268, 10.2, 10.8, 3.8, 16, { pilasters: 8 });
  dome(expoPavGroup, pal.copper, 0, 12.7, -268, 10.4, 8.6, 18, { ribs: 14 });
  cyl(expoPavGroup, pal.gold, 0, 21.8, -268, 0.25, 0.45, 1.4, 8);

  // Canal-bank poplar avenues
  for (const sx of [-1, 1]) {
    for (let z = -310; z <= -195; z += 22) {
      ctx.addTree(sx * 22, 0, z, 0.90);
      if (z >= -290) ctx.addTree(sx * 48, 0, z + 8, 0.88);
    }
  }

  return {
    group,
    setStep(step) {
      expoPavGroup.visible = step >= 7.5;
    },
  };
}
