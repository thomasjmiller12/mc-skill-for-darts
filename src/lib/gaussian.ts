/**
 * Generate a pair of standard normal random variables using Box-Muller transform.
 */
export function boxMuller(): [number, number] {
  let u1: number;
  do {
    u1 = Math.random();
  } while (u1 === 0); // Avoid log(0)
  const u2 = Math.random();

  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0 = mag * Math.cos(2 * Math.PI * u2);
  const z1 = mag * Math.sin(2 * Math.PI * u2);
  return [z0, z1];
}

/**
 * Sample a single 2D point from N(mu, sigma^2 * I).
 */
export function sampleGaussian2D(
  muX: number,
  muY: number,
  sigma: number
): [number, number] {
  const [z0, z1] = boxMuller();
  return [muX + sigma * z0, muY + sigma * z1];
}

/**
 * Sample N points from N(mu, sigma^2 * I).
 */
export function sampleGaussian2DBatch(
  muX: number,
  muY: number,
  sigma: number,
  n: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    points.push(sampleGaussian2D(muX, muY, sigma));
  }
  return points;
}
