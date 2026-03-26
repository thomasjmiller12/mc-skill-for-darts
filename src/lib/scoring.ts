import { getRegion } from "@/components/dartboard/dartboard-utils";
import type { ScoringRegion } from "@/components/dartboard/dartboard-constants";

/**
 * Get the score for a dart landing at (x, y) in board coordinates (mm from center).
 */
export function score(x: number, y: number): number {
  return getRegion(x, y).score;
}

/**
 * Get the full region info for a dart landing at (x, y).
 */
export function getScoreRegion(x: number, y: number): ScoringRegion {
  return getRegion(x, y);
}

/**
 * Score a batch of throws, returning scores and regions.
 */
export function scoreBatch(
  points: [number, number][]
): { score: number; region: ScoringRegion; point: [number, number] }[] {
  return points.map(([x, y]) => ({
    score: score(x, y),
    region: getRegion(x, y),
    point: [x, y],
  }));
}

/**
 * Compute MLE sigma from known positions and targets.
 * sigma^2 = (1/2n) * sum(|mu_i - x_i|^2)
 */
export function mleSigma(
  throws: [number, number][],
  muX: number,
  muY: number
): number {
  const n = throws.length;
  if (n === 0) return 0;

  let sumSqDist = 0;
  for (const [x, y] of throws) {
    const dx = x - muX;
    const dy = y - muY;
    sumSqDist += dx * dx + dy * dy;
  }

  return Math.sqrt(sumSqDist / (2 * n));
}
