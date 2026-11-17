/**
 * Smooth Time-to-Construction-Step Trajectory for Kashgar Id Kah Mosque Walkthrough
 * (`model/walkthrough_pacing.js`)
 *
 * Maps normalized continuous Beat-B flight progress `u in [0, 1]` directly into smoothed
 * architectural steps along the 8 calibrated exhibition milestones:
 *   1.20 -> 2.60 -> 4.00 -> 5.50 -> 7.20 -> 8.80 -> 10.00 -> 11.00
 */

export const WALKTHROUGH_MILESTONES = Object.freeze([
  1.2, 2.6, 4.0, 5.5, 7.2, 8.8, 10.0, 11.0,
]);

export function clamp01(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function easeInOutQuintic(t) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function sampleConstructionStepAtProgress(
  startStep = 1.2,
  endStep = 11.0,
  normalizedProgress = 0
) {
  const s0 = Number.isFinite(Number(startStep)) ? Number(startStep) : 1.2;
  const s1 = Number.isFinite(Number(endStep)) ? Number(endStep) : 11.0;
  const u = clamp01(Number(normalizedProgress) || 0);
  return s0 + (s1 - s0) * easeInOutQuintic(u);
}

export class WalkthroughPacingCurve {
  constructor(milestones = WALKTHROUGH_MILESTONES) {
    this.milestones = Array.isArray(milestones) && milestones.length > 0
      ? milestones
      : WALKTHROUGH_MILESTONES;
  }

  getStepForSegment(fromIdx, toIdx, u) {
    const a = this.milestones[Math.max(0, Math.min(this.milestones.length - 1, fromIdx))] ?? 1.2;
    const b = this.milestones[Math.max(0, Math.min(this.milestones.length - 1, toIdx))] ?? 11.0;
    return sampleConstructionStepAtProgress(a, b, u);
  }
}

export function applyStage2BuildPacing(walkthrough, _opts = {}) {
  return walkthrough || null;
}

