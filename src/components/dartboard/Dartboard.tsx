"use client";

import { useMemo } from "react";
import {
  BOARD_RADIUS,
  DOUBLE_OUTER,
  DOUBLE_INNER,
  TRIPLE_OUTER,
  TRIPLE_INNER,
  OUTER_BULL,
  INNER_BULL,
  WEDGE_ORDER,
  WEDGE_ANGLE,
  type RegionType,
} from "./dartboard-constants";
import { arcPath, getRegionColor, wedgeStartAngle } from "./dartboard-utils";

interface DartboardProps {
  size?: number;
  className?: string;
  showNumbers?: boolean;
  highlightRegions?: Set<number>;
  onBoardClick?: (x: number, y: number) => void;
  children?: React.ReactNode;
}

export default function Dartboard({
  size = 400,
  className = "",
  showNumbers = true,
  highlightRegions,
  onBoardClick,
  children,
}: DartboardProps) {
  const scale = size / (2 * BOARD_RADIUS + 40);
  const cx = size / 2;
  const cy = size / 2;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onBoardClick) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;
    // Convert to board coordinates
    const boardX = (svgX - cx) / scale;
    const boardY = (cy - svgY) / scale;
    onBoardClick(boardX, boardY);
  };

  const regions = useMemo(() => {
    const paths: JSX.Element[] = [];

    // Ring definitions: [innerR, outerR, regionType]
    const rings: [number, number, string][] = [
      [DOUBLE_INNER, DOUBLE_OUTER, "double"],
      [TRIPLE_OUTER, DOUBLE_INNER, "single_outer"],
      [TRIPLE_INNER, TRIPLE_OUTER, "triple"],
      [OUTER_BULL, TRIPLE_INNER, "single_inner"],
    ];

    for (const [innerR, outerR, regionType] of rings) {
      for (let i = 0; i < 20; i++) {
        const startAngle = wedgeStartAngle(i);
        const endAngle = startAngle + WEDGE_ANGLE;
        const color = getRegionColor(i, regionType as RegionType);
        const d = arcPath(startAngle, endAngle, innerR, outerR);

        const isHighlighted =
          highlightRegions &&
          highlightRegions.has(
            WEDGE_ORDER[i] *
              (regionType === "double" ? 2 : regionType === "triple" ? 3 : 1)
          );

        paths.push(
          <path
            key={`${regionType}-${i}`}
            d={d}
            fill={color}
            stroke="#888888"
            strokeWidth={0.5 / scale}
            opacity={
              highlightRegions
                ? isHighlighted
                  ? 1
                  : 0.3
                : 1
            }
            className="transition-opacity duration-300"
          />
        );
      }
    }

    return paths;
  }, [scale, highlightRegions]);

  const numbers = useMemo(() => {
    if (!showNumbers) return null;
    return WEDGE_ORDER.map((num, i) => {
      const angle = i * WEDGE_ANGLE;
      const r = BOARD_RADIUS + 14;
      const x = r * Math.sin(angle);
      const y = -r * Math.cos(angle);
      return (
        <text
          key={`num-${num}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1A1A1A"
          fontSize={10}
          fontFamily="var(--font-inter), sans-serif"
          fontWeight={600}
        >
          {num}
        </text>
      );
    });
  }, [showNumbers]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className} ${onBoardClick ? "cursor-crosshair" : ""}`}
      onClick={handleClick}
    >
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        {/* Board background circle */}
        <circle r={BOARD_RADIUS} fill="#2C2C2C" />

        {/* Scoring regions */}
        {regions}

        {/* Outer bull */}
        <circle
          r={OUTER_BULL}
          fill="#5B9F6E"
          stroke="#888888"
          strokeWidth={0.5 / scale}
        />

        {/* Inner bull (bullseye) */}
        <circle
          r={INNER_BULL}
          fill="#D4645C"
          stroke="#888888"
          strokeWidth={0.5 / scale}
        />

        {/* Wire ring overlays for visual definition */}
        {[DOUBLE_OUTER, DOUBLE_INNER, TRIPLE_OUTER, TRIPLE_INNER].map(
          (r) => (
            <circle
              key={`wire-${r}`}
              r={r}
              fill="none"
              stroke="#888888"
              strokeWidth={0.3 / scale}
            />
          )
        )}

        {/* Numbers */}
        {numbers}

        {/* Children (crosshair, dots, etc.) rendered in board coordinate space */}
        {children}
      </g>
    </svg>
  );
}
