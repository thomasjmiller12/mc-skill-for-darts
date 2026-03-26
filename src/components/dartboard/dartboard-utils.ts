import {
  DOUBLE_OUTER,
  DOUBLE_INNER,
  TRIPLE_OUTER,
  TRIPLE_INNER,
  OUTER_BULL,
  INNER_BULL,
  WEDGE_ORDER,
  WEDGE_ANGLE,
  type RegionType,
  type ScoringRegion,
} from "./dartboard-constants";

/**
 * Get the angle for a given wedge index (0 = top/20).
 * Angles measured clockwise from top (negative y-axis).
 */
export function wedgeStartAngle(wedgeIndex: number): number {
  // Each wedge is centered on its position, so start is position - half wedge
  return wedgeIndex * WEDGE_ANGLE - WEDGE_ANGLE / 2;
}

/**
 * Convert board coordinates (mm from center) to SVG/canvas coordinates.
 * Board: center is (0,0), positive y is up.
 * SVG: center is (cx,cy), positive y is down.
 */
export function boardToSvg(
  x: number,
  y: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  return [cx + x * scale, cy - y * scale];
}

/**
 * Convert SVG/canvas coordinates to board coordinates (mm from center).
 */
export function svgToBoard(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  return [(sx - cx) / scale, (cy - sy) / scale];
}

/**
 * Determine which scoring region a point (in board mm coordinates) falls in.
 */
export function getRegion(x: number, y: number): ScoringRegion {
  const r = Math.sqrt(x * x + y * y);

  // Miss - outside the board
  if (r > DOUBLE_OUTER) {
    return { type: "miss", score: 0, multiplier: 0 };
  }

  // Inner bull (bullseye)
  if (r <= INNER_BULL) {
    return { type: "inner_bull", score: 50, multiplier: 1 };
  }

  // Outer bull
  if (r <= OUTER_BULL) {
    return { type: "outer_bull", score: 25, multiplier: 1 };
  }

  // Determine wedge - angle from positive y-axis (top), clockwise
  // atan2 gives angle from positive x-axis, counter-clockwise
  // We need angle from top (negative y in standard), clockwise
  let angle = Math.atan2(x, y); // Note: atan2(x, y) not atan2(y, x) — gives angle from +y axis
  if (angle < 0) angle += 2 * Math.PI;

  // Determine wedge index
  const wedgeIndex =
    Math.floor((angle + WEDGE_ANGLE / 2) / WEDGE_ANGLE) % 20;
  const wedgeScore = WEDGE_ORDER[wedgeIndex];

  // Determine ring
  let type: RegionType;
  let multiplier: number;

  if (r <= TRIPLE_INNER) {
    type = "single_inner";
    multiplier = 1;
  } else if (r <= TRIPLE_OUTER) {
    type = "triple";
    multiplier = 3;
  } else if (r <= DOUBLE_INNER) {
    type = "single_outer";
    multiplier = 1;
  } else {
    type = "double";
    multiplier = 2;
  }

  return {
    type,
    score: wedgeScore * multiplier,
    multiplier,
    wedgeIndex,
  };
}

/**
 * Get the score for a point on the board.
 */
export function scorePoint(x: number, y: number): number {
  return getRegion(x, y).score;
}

/**
 * Generate SVG arc path for a ring segment (wedge-shaped).
 * startAngle and endAngle in radians from top, clockwise.
 * innerR and outerR in board mm.
 */
export function arcPath(
  startAngle: number,
  endAngle: number,
  innerR: number,
  outerR: number
): string {
  // Convert angles to SVG coordinates (from top, clockwise)
  // In SVG, positive y is down, so we flip
  const toSvgCoord = (angle: number, r: number): [number, number] => {
    return [r * Math.sin(angle), -r * Math.cos(angle)];
  };

  const [ox1, oy1] = toSvgCoord(startAngle, outerR);
  const [ox2, oy2] = toSvgCoord(endAngle, outerR);
  const [ix1, iy1] = toSvgCoord(endAngle, innerR);
  const [ix2, iy2] = toSvgCoord(startAngle, innerR);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ");
}

/**
 * Get the color for a wedge segment based on wedge index and region type.
 * Even-indexed wedges use dark colors, odd use light.
 */
export function getRegionColor(
  wedgeIndex: number,
  regionType: RegionType
): string {
  if (regionType === "inner_bull") return "#D4645C";
  if (regionType === "outer_bull") return "#5B9F6E";

  const isEven = wedgeIndex % 2 === 0;

  switch (regionType) {
    case "double":
    case "triple":
      return isEven ? "#D4645C" : "#5B9F6E";
    case "single_outer":
    case "single_inner":
      return isEven ? "#2C2C2C" : "#F5E6C8";
    default:
      return "#F5E6C8";
  }
}

/**
 * Get the center coordinates of a specific scoring region for aiming presets.
 */
export function getRegionCenter(
  wedgeScore: number,
  regionType: "single" | "double" | "triple" | "bull" | "outer_bull"
): [number, number] {
  if (regionType === "bull") return [0, 0];
  if (regionType === "outer_bull") return [0, OUTER_BULL * 0.7];

  const wedgeIndex = WEDGE_ORDER.indexOf(wedgeScore);
  if (wedgeIndex === -1) return [0, 0];

  const angle = wedgeIndex * WEDGE_ANGLE;

  let r: number;
  switch (regionType) {
    case "triple":
      r = (TRIPLE_INNER + TRIPLE_OUTER) / 2;
      break;
    case "double":
      r = (DOUBLE_INNER + DOUBLE_OUTER) / 2;
      break;
    default:
      r = (TRIPLE_OUTER + DOUBLE_INNER) / 2;
      break;
  }

  return [r * Math.sin(angle), r * Math.cos(angle)];
}
