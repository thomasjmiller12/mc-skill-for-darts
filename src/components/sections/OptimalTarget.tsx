"use client";

import { useRef, useEffect, useState, forwardRef } from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Callout from "@/components/ui/Callout";
import Equation from "@/components/math/Equation";
import { BOARD_RADIUS } from "@/components/dartboard/dartboard-constants";
import { expectedEntropy } from "@/lib/entropy";
import { getRegionCenter } from "@/components/dartboard/dartboard-utils";

function EntropyHeatmapViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [sigma] = useState(40);
  const [isComputing, setIsComputing] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasComputed, setHasComputed] = useState(false);

  const gridSize = 21;
  const size = 400;

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || hasComputed) return;
    setHasComputed(true);
    setIsComputing(true);

    // Compute in chunks to avoid blocking UI
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const extent = BOARD_RADIUS;
    const step = (2 * extent) / (gridSize - 1);
    const cellW = size / gridSize;
    const cellH = size / gridSize;

    let row = 0;
    function computeRow() {
      if (!ctx) return;
      if (row >= gridSize) {
        // Draw optimal point marker (triple 11)
        const [optX, optY] = getRegionCenter(11, "triple");
        const px = ((optX + extent) / (2 * extent)) * size;
        const py = ((extent - optY) / (2 * extent)) * size;

        ctx.strokeStyle = "#D4A853";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px - 12, py);
        ctx.lineTo(px + 12, py);
        ctx.moveTo(px, py - 12);
        ctx.lineTo(px, py + 12);
        ctx.stroke();

        setIsComputing(false);
        return;
      }

      const y = extent - row * step;
      for (let j = 0; j < gridSize; j++) {
        const x = -extent + j * step;
        const r = Math.sqrt(x * x + y * y);

        if (r > extent) {
          row++;
          requestAnimationFrame(computeRow);
          return;
        }

        const entropy = expectedEntropy(x, y, sigma, 2000);
        // Map entropy to color: low = blue (good), high = coral (bad)
        const maxE = 4;
        const t = Math.min(entropy / maxE, 1);
        const red = Math.round(74 + t * (212 - 74));
        const green = Math.round(124 + t * (117 - 124));
        const blue = Math.round(155 + t * (106 - 155));

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.6)`;
        ctx.fillRect(j * cellW, row * cellH, cellW + 1, cellH + 1);
      }
      row++;
      requestAnimationFrame(computeRow);
    }

    requestAnimationFrame(computeRow);
  }, [isInView, sigma, hasComputed]);

  return (
    <div ref={viewRef} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, borderRadius: "50%" }}
          className="border border-gray-200"
        />
        {isComputing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
            <span className="text-sm text-muted animate-pulse">
              Computing entropy heatmap...
            </span>
          </div>
        )}
      </div>
      <p className="figure-caption">
        Figure 3: Entropy heatmap for &sigma; = {sigma}. Darker blue = less
        entropy (more information preserved). Gold crosshair marks the optimal
        target at triple 11.
      </p>
    </div>
  );
}

const OptimalTarget = forwardRef<HTMLElement>(function OptimalTarget(_props, ref) {
  return (
    <SectionWrapper id="optimal" ref={ref}>
      <ScrollReveal>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
          Where Should You Aim?
        </h2>
      </ScrollReveal>

      <ScrollReveal>
        <Callout>
          Due to the asymmetry of the scoring locations on the dartboard, there
          is potential for targets where the resulting scores give different
          amounts of information about a player&apos;s execution skill.
        </Callout>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-4 text-foreground leading-relaxed font-sans">
          <p>
            Some aiming points lose more information than others when converting
            a dart&apos;s landing location into a score. For example, aiming at
            double 20 on the edge means many darts miss the board entirely
            &mdash; useless data.
          </p>
          <p>
            We can quantify this information loss using <strong>entropy</strong>{" "}
            of the distance distribution within each scoring region. Lower
            entropy means the score tells us more about where the dart actually
            landed.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-4 my-8">
          <Equation
            math="e(s, \mu, \sigma) = -\sum_{b_i \in B} P(b_i | s, \mu, \sigma) \log P(b_i | s, \mu, \sigma)"
            annotation="Entropy of the distance distribution for a single score region."
          />
          <Equation
            math="E(\mu, \sigma) = \sum_{s \in S} e(s, \mu, \sigma) \cdot P(s | \mu, \sigma)"
            annotation="Expected entropy across all possible scores — the quantity we want to minimize."
          />
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <p className="text-foreground leading-relaxed font-sans mb-6">
          After computing this for every point on the board across 30 skill
          levels, the conclusion is striking:
        </p>
        <Callout>
          The single best aiming point lies directly in the center of the
          triple 11, to the left of the bullseye.
        </Callout>
      </ScrollReveal>

      <ScrollReveal className="my-10">
        <EntropyHeatmapViz />
      </ScrollReveal>
    </SectionWrapper>
  );
});

export default OptimalTarget;
