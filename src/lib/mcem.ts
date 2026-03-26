import { sampleGaussian2DBatch } from "./gaussian";
import { score } from "./scoring";

export interface MCEMIterationResult {
  iteration: number;
  sigmaEstimate: number;
  mcSamples?: [number, number][];
  expectedDistances?: Map<number, number>;
}

export interface MCEMResult {
  iterations: MCEMIterationResult[];
  finalSigma: number;
}

/**
 * Run the Monte Carlo EM algorithm for dart skill estimation.
 *
 * Given observed scores from throws aimed at (muX, muY),
 * estimate the true sigma (skill parameter).
 *
 * @param observedScores - Array of scores from actual throws
 * @param muX - Target x coordinate (mm from center)
 * @param muY - Target y coordinate (mm from center)
 * @param initialSigma - Starting sigma estimate
 * @param numIterations - Number of EM iterations
 * @param numMCSamples - Number of MC samples per iteration
 * @param keepSamples - Whether to store MC samples in results (for visualization)
 */
export function runMCEM(
  observedScores: number[],
  muX: number,
  muY: number,
  initialSigma: number = 50,
  numIterations: number = 10,
  numMCSamples: number = 5000,
  keepSamples: boolean = false
): MCEMResult {
  const iterations: MCEMIterationResult[] = [];
  let currentSigma = initialSigma;

  iterations.push({
    iteration: 0,
    sigmaEstimate: currentSigma,
  });

  for (let iter = 1; iter <= numIterations; iter++) {
    // E-step: Generate MC samples from N(mu, currentSigma^2 * I)
    const samples = sampleGaussian2DBatch(
      muX,
      muY,
      currentSigma,
      numMCSamples
    );

    // Group samples by their score
    const samplesByScore = new Map<number, [number, number][]>();
    for (const [x, y] of samples) {
      const s = score(x, y);
      if (!samplesByScore.has(s)) {
        samplesByScore.set(s, []);
      }
      samplesByScore.get(s)!.push([x, y]);
    }

    // For each observed score, compute expected squared distance
    // m_k = (1/l) * sum_{y_j in s_k} |mu - y_j|^2
    const expectedDistances = new Map<number, number>();
    let totalExpectedDist = 0;

    for (const obsScore of observedScores) {
      const matchingSamples = samplesByScore.get(obsScore);

      if (matchingSamples && matchingSamples.length > 0) {
        let sumSqDist = 0;
        for (const [x, y] of matchingSamples) {
          const dx = x - muX;
          const dy = y - muY;
          sumSqDist += dx * dx + dy * dy;
        }
        const mk = sumSqDist / matchingSamples.length;
        expectedDistances.set(obsScore, mk);
        totalExpectedDist += mk;
      } else {
        // No MC samples landed in this score region — use previous estimate
        totalExpectedDist += 2 * currentSigma * currentSigma;
      }
    }

    // M-step: sigma_{t+1}^2 = sum(d_i) / (2n)
    const newSigmaSq = totalExpectedDist / (2 * observedScores.length);
    currentSigma = Math.sqrt(Math.max(newSigmaSq, 1)); // Floor at 1 to avoid collapse

    const result: MCEMIterationResult = {
      iteration: iter,
      sigmaEstimate: currentSigma,
    };

    if (keepSamples) {
      result.mcSamples = samples;
      result.expectedDistances = expectedDistances;
    }

    iterations.push(result);
  }

  return {
    iterations,
    finalSigma: currentSigma,
  };
}

/**
 * Run a single MCEM iteration and return detailed results for visualization.
 */
export function mcemStep(
  observedScores: number[],
  muX: number,
  muY: number,
  currentSigma: number,
  numMCSamples: number = 5000
): {
  newSigma: number;
  samples: [number, number][];
  sampleScores: number[];
  expectedDistances: Map<number, number>;
} {
  const samples = sampleGaussian2DBatch(muX, muY, currentSigma, numMCSamples);
  const sampleScores = samples.map(([x, y]) => score(x, y));

  // Group by score
  const samplesByScore = new Map<number, [number, number][]>();
  for (let i = 0; i < samples.length; i++) {
    const s = sampleScores[i];
    if (!samplesByScore.has(s)) {
      samplesByScore.set(s, []);
    }
    samplesByScore.get(s)!.push(samples[i]);
  }

  // Compute expected distances
  const expectedDistances = new Map<number, number>();
  let totalExpectedDist = 0;

  for (const obsScore of observedScores) {
    const matchingSamples = samplesByScore.get(obsScore);
    if (matchingSamples && matchingSamples.length > 0) {
      let sumSqDist = 0;
      for (const [x, y] of matchingSamples) {
        const dx = x - muX;
        const dy = y - muY;
        sumSqDist += dx * dx + dy * dy;
      }
      const mk = sumSqDist / matchingSamples.length;
      expectedDistances.set(obsScore, mk);
      totalExpectedDist += mk;
    } else {
      totalExpectedDist += 2 * currentSigma * currentSigma;
    }
  }

  const newSigmaSq = totalExpectedDist / (2 * observedScores.length);
  const newSigma = Math.sqrt(Math.max(newSigmaSq, 1));

  return { newSigma, samples, sampleScores, expectedDistances };
}
