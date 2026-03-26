import { sampleGaussian2DBatch } from "./gaussian";
import { score } from "./scoring";
import { BOARD_RADIUS } from "@/components/dartboard/dartboard-constants";

/**
 * Compute the entropy of the distance distribution for a given score,
 * target, and skill level.
 *
 * e(s, mu, sigma) = -sum P(b_i|s,mu,sigma) * log P(b_i|s,mu,sigma)
 *
 * We discretize distances into bins and compute entropy over the bin distribution.
 */
export function scoreEntropy(
  samples: [number, number][],
  sampleScores: number[],
  targetScore: number,
  muX: number,
  muY: number,
  numBins: number = 20
): number {
  // Collect distances for samples matching the target score
  const distances: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    if (sampleScores[i] === targetScore) {
      const dx = samples[i][0] - muX;
      const dy = samples[i][1] - muY;
      distances.push(Math.sqrt(dx * dx + dy * dy));
    }
  }

  if (distances.length < 2) return 0;

  // Create histogram
  const maxDist = Math.max(...distances);
  const binWidth = maxDist / numBins;
  const bins = new Float64Array(numBins);

  for (const d of distances) {
    const bin = Math.min(Math.floor(d / binWidth), numBins - 1);
    bins[bin]++;
  }

  // Compute entropy
  const total = distances.length;
  let entropy = 0;
  for (let i = 0; i < numBins; i++) {
    if (bins[i] > 0) {
      const p = bins[i] / total;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Compute the overall expected entropy E(mu, sigma) for a target location and skill level.
 *
 * E(mu, sigma) = sum_s e(s, mu, sigma) * P(s | mu, sigma)
 */
export function expectedEntropy(
  muX: number,
  muY: number,
  sigma: number,
  numSamples: number = 10000
): number {
  const samples = sampleGaussian2DBatch(muX, muY, sigma, numSamples);
  const sampleScores = samples.map(([x, y]) => score(x, y));

  // Count score frequencies
  const scoreCounts = new Map<number, number>();
  for (const s of sampleScores) {
    scoreCounts.set(s, (scoreCounts.get(s) || 0) + 1);
  }

  let totalEntropy = 0;

  for (const [s, count] of Array.from(scoreCounts.entries())) {
    const probS = count / numSamples;
    const e = scoreEntropy(samples, sampleScores, s, muX, muY);
    totalEntropy += e * probS;
  }

  return totalEntropy;
}

/**
 * Compute an entropy heatmap over a grid of target locations.
 * Returns a flat array of entropy values for a grid of points.
 */
export function computeEntropyGrid(
  sigma: number,
  gridSize: number = 25,
  numSamples: number = 5000
): { grid: number[][]; extent: number } {
  const extent = BOARD_RADIUS;
  const step = (2 * extent) / (gridSize - 1);
  const grid: number[][] = [];

  for (let i = 0; i < gridSize; i++) {
    const row: number[] = [];
    const y = extent - i * step;
    for (let j = 0; j < gridSize; j++) {
      const x = -extent + j * step;

      // Only compute for points near the board
      const r = Math.sqrt(x * x + y * y);
      if (r > extent * 1.1) {
        row.push(0);
        continue;
      }

      row.push(expectedEntropy(x, y, sigma, numSamples));
    }
    grid.push(row);
  }

  return { grid, extent };
}
