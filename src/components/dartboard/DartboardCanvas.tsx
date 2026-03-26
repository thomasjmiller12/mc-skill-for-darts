"use client";

import { useEffect, useRef, useCallback } from "react";
import { BOARD_RADIUS } from "./dartboard-constants";

interface DartPoint {
  x: number; // board coordinates (mm)
  y: number;
  color?: string;
  radius?: number;
  opacity?: number;
}

interface DartboardCanvasProps {
  size: number;
  points?: DartPoint[];
  gaussianCenter?: { x: number; y: number; sigma: number };
  sigmaRing?: { x: number; y: number; sigma: number; color?: string; dashed?: boolean };
  className?: string;
  onDraw?: (ctx: CanvasRenderingContext2D, scale: number, cx: number, cy: number) => void;
}

export default function DartboardCanvas({
  size,
  points,
  gaussianCenter,
  sigmaRing,
  className = "",
  onDraw,
}: DartboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = size / (2 * BOARD_RADIUS + 40);
  const cx = size / 2;
  const cy = size / 2;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Draw Gaussian cloud
    if (gaussianCenter) {
      const { x, y, sigma } = gaussianCenter;
      const svgX = cx + x * scale;
      const svgY = cy - y * scale;
      const r = sigma * scale;

      const gradient = ctx.createRadialGradient(svgX, svgY, 0, svgX, svgY, r * 2);
      gradient.addColorStop(0, "rgba(74, 124, 155, 0.15)");
      gradient.addColorStop(0.5, "rgba(74, 124, 155, 0.08)");
      gradient.addColorStop(1, "rgba(74, 124, 155, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw sigma ring
    if (sigmaRing) {
      const { x, y, sigma, color = "#4A7C9B", dashed = true } = sigmaRing;
      const svgX = cx + x * scale;
      const svgY = cy - y * scale;
      const r = sigma * scale;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(svgX, svgY, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Draw points
    if (points) {
      for (const pt of points) {
        const svgX = cx + pt.x * scale;
        const svgY = cy - pt.y * scale;
        const r = (pt.radius || 2.5) * (scale > 0.8 ? 1 : 0.8);

        ctx.globalAlpha = pt.opacity ?? 0.8;
        ctx.fillStyle = pt.color || "#1A1A1A";
        ctx.beginPath();
        ctx.arc(svgX, svgY, r, 0, 2 * Math.PI);
        ctx.fill();

        // Subtle shadow
        ctx.globalAlpha = (pt.opacity ?? 0.8) * 0.3;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.arc(svgX + 0.5, svgY + 0.5, r, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Custom draw callback
    if (onDraw) {
      onDraw(ctx, scale, cx, cy);
    }
  }, [size, points, gaussianCenter, sigmaRing, scale, cx, cy, onDraw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
