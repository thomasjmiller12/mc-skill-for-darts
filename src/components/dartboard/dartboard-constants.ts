// Standard dartboard dimensions (in mm from center)
export const BOARD_RADIUS = 170; // Outer edge (double ring outer)
export const DOUBLE_OUTER = 170;
export const DOUBLE_INNER = 162;
export const TRIPLE_OUTER = 107;
export const TRIPLE_INNER = 99;
export const OUTER_BULL = 15.9;
export const INNER_BULL = 6.35;

// Wedge order clockwise from top (12 o'clock position)
export const WEDGE_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

// Each wedge spans 18 degrees
export const WEDGE_ANGLE = (2 * Math.PI) / 20; // 18 degrees in radians

// Scoring region types
export type RegionType =
  | "double"
  | "triple"
  | "single_outer"
  | "single_inner"
  | "outer_bull"
  | "inner_bull"
  | "miss";

export interface ScoringRegion {
  type: RegionType;
  score: number;
  multiplier: number;
  wedgeIndex?: number;
}

// Colors for rendering
export const REGION_COLORS: Record<string, string> = {
  single_dark: "#2C2C2C",
  single_light: "#F5E6C8",
  double_dark: "#5B9F6E",
  double_light: "#D4645C",
  triple_dark: "#5B9F6E",
  triple_light: "#D4645C",
  outer_bull: "#5B9F6E",
  inner_bull: "#D4645C",
};
