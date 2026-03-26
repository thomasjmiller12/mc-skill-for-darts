"use client";

import { useEffect, useRef, useCallback, forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BOARD_RADIUS } from "@/components/dartboard/dartboard-constants";
import { sampleGaussian2D } from "@/lib/gaussian";

const Hero = forwardRef<HTMLElement>(function Hero(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<
    { x: number; y: number; age: number; scale: number }[]
  >([]);
  const rafRef = useRef<number>(0);
  const shouldReduceMotion = useReducedMotion();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const size = Math.min(w, h);
    const boardScale = size / (2 * BOARD_RADIUS + 60);
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Draw minimalist board outline
    ctx.strokeStyle = "rgba(26, 26, 26, 0.06)";
    ctx.lineWidth = 1;
    for (const r of [170, 162, 107, 99, 15.9, 6.35]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * boardScale, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw wire lines
    for (let i = 0; i < 20; i++) {
      const angle = (i * 18 - 9) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(
        cx + 15.9 * boardScale * Math.sin(angle),
        cy - 15.9 * boardScale * Math.cos(angle)
      );
      ctx.lineTo(
        cx + 170 * boardScale * Math.sin(angle),
        cy - 170 * boardScale * Math.cos(angle)
      );
      ctx.stroke();
    }

    // Add new point occasionally
    if (Math.random() < 0.08 && pointsRef.current.length < 200) {
      const [px, py] = sampleGaussian2D(0, 0, 55);
      pointsRef.current.push({ x: px, y: py, age: 0, scale: 0 });
    }

    // Draw points
    for (const pt of pointsRef.current) {
      pt.age += 1;
      if (pt.scale < 1) {
        pt.scale = Math.min(1, pt.scale + 0.08);
      }

      const svgX = cx + pt.x * boardScale;
      const svgY = cy - pt.y * boardScale;
      const displayScale = Math.min(pt.scale, 1);
      const alpha = Math.min(pt.age / 30, 0.35);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#4A7C9B";
      ctx.beginPath();
      ctx.arc(svgX, svgY, 2.5 * displayScale, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, shouldReduceMotion]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {!shouldReduceMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-3xl mx-auto px-6"
      >
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
          Monte Carlo Skill Estimation for Darts
        </h1>
        <p className="font-serif text-xl md:text-2xl text-muted leading-relaxed mb-8 italic">
          How to measure what you can&apos;t see &mdash; estimating a dart
          player&apos;s precision from scores alone
        </p>
        <p className="text-sm text-muted font-sans">
          Based on the paper by Thomas Miller &amp; Christopher Archibald, BYU
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 z-10 animate-bounce"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B6B6B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </motion.div>
    </section>
  );
});

export default Hero;
