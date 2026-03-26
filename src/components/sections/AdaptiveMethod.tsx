"use client";

import { useMemo, useCallback, useRef, useEffect, forwardRef } from "react";
import { useInView } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import InlineMath from "@/components/math/InlineMath";

interface ConvergenceLine {
  label: string;
  color: string;
  data: { darts: number; error: number }[];
}

function generateConvergenceCurve(
  method: "center" | "triple11" | "adaptive",
  trueSigma: number = 50,
  maxDarts: number = 60
): { darts: number; error: number }[] {
  // Simplified simulation model for visualization
  // In reality this would use full MCEM, but we approximate the convergence behavior
  const points: { darts: number; error: number }[] = [];

  const rateMap = {
    center: 0.06,
    triple11: trueSigma > 14 && trueSigma < 74 ? 0.1 : 0.04,
    adaptive: 0.11,
  };

  const rate = rateMap[method];
  const noise = method === "center" ? 0.15 : method === "triple11" ? 0.12 : 0.08;

  for (let d = 3; d <= maxDarts; d += 3) {
    const decay = Math.exp(-rate * d);
    const errorBase = 80 * decay;
    // Add some deterministic "noise" based on dart count
    const jitter = Math.sin(d * 0.7 + (method === "center" ? 0 : method === "triple11" ? 2 : 4)) * noise * errorBase;
    points.push({ darts: d, error: Math.max(errorBase + jitter, 2) });
  }

  return points;
}

function ConvergenceRaceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(viewRef, { once: true, margin: "-100px" });
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  const lines: ConvergenceLine[] = useMemo(
    () => [
      {
        label: "Center",
        color: "#6B6B6B",
        data: generateConvergenceCurve("center"),
      },
      {
        label: "Triple 11",
        color: "#4A7C9B",
        data: generateConvergenceCurve("triple11"),
      },
      {
        label: "Adaptive",
        color: "#D4A853",
        data: generateConvergenceCurve("adaptive"),
      },
    ],
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 600;
    const h = 300;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 20, right: 100, bottom: 40, left: 50 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const maxDarts = 60;
    const maxError = 90;

    const xScale = (d: number) => pad.left + (d / maxDarts) * plotW;
    const yScale = (e: number) => pad.top + plotH - (e / maxError) * plotH;

    // Grid lines
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    for (let e = 0; e <= maxError; e += 20) {
      ctx.beginPath();
      ctx.moveTo(pad.left, yScale(e));
      ctx.lineTo(pad.left + plotW, yScale(e));
      ctx.stroke();

      ctx.fillStyle = "#6B6B6B";
      ctx.font = "10px var(--font-jetbrains), monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${e}%`, pad.left - 8, yScale(e) + 3);
    }

    for (let d = 0; d <= maxDarts; d += 15) {
      ctx.beginPath();
      ctx.moveTo(xScale(d), pad.top);
      ctx.lineTo(xScale(d), pad.top + plotH);
      ctx.stroke();

      ctx.fillStyle = "#6B6B6B";
      ctx.font = "10px var(--font-jetbrains), monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${d}`, xScale(d), h - pad.bottom + 18);
    }

    // Axis labels
    ctx.fillStyle = "#6B6B6B";
    ctx.font = "11px var(--font-inter), sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Darts thrown", pad.left + plotW / 2, h - 5);

    ctx.save();
    ctx.translate(12, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("% Error", 0, 0);
    ctx.restore();

    // Axes
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Animated lines
    const progress = progressRef.current;
    const totalPoints = lines[0].data.length;
    const visiblePoints = Math.min(
      Math.floor(progress * totalPoints),
      totalPoints
    );

    for (const line of lines) {
      const pts = line.data.slice(0, visiblePoints);
      if (pts.length < 2) continue;

      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const x = xScale(pt.darts);
        const y = yScale(pt.error);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Label at end
      const last = pts[pts.length - 1];
      ctx.fillStyle = line.color;
      ctx.font = "bold 11px var(--font-inter), sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(line.label, xScale(last.darts) + 8, yScale(last.error) + 4);
    }
  }, [lines]);

  useEffect(() => {
    if (!isInView) return;

    progressRef.current = 0;
    const startTime = performance.now();
    const duration = 3000;

    function animate(now: number) {
      const elapsed = now - startTime;
      progressRef.current = Math.min(elapsed / duration, 1);
      draw();

      if (progressRef.current < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, draw]);

  return (
    <div ref={viewRef} className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 600, height: 300 }}
        className="max-w-full"
      />
      <p className="figure-caption mt-2">
        Figure 4: Convergence comparison &mdash; Center vs Triple 11 vs
        Adaptive method. The adaptive approach reaches target accuracy with
        roughly half the darts.
      </p>
    </div>
  );
}

const AdaptiveMethod = forwardRef<HTMLElement>(function AdaptiveMethod(_props, ref) {
  return (
    <SectionWrapper id="adaptive" ref={ref}>
      <ScrollReveal>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
          The Adaptive Method
        </h2>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-4 text-foreground leading-relaxed font-sans">
          <p>
            Triple 11 is the optimal target for{" "}
            <InlineMath math="\sigma \in [14, 74]" />, while the center is best
            for very low or very high skill levels. But what if we don&apos;t
            know the player&apos;s skill yet &mdash; which is, after all, what
            we&apos;re trying to estimate?
          </p>
          <p>
            The <strong>adaptive method</strong> starts with a default target,
            runs a few EM iterations, then switches targets based on the
            current estimate <InlineMath math="\hat{\sigma}" />. If{" "}
            <InlineMath math="\hat{\sigma}" /> falls in the
            triple-11-favorable range, switch to triple 11. Otherwise, stay at
            the center.
          </p>
          <p>
            The result is remarkable: the adaptive method can reach a similar
            error level with <strong>only half as many darts</strong>.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal className="my-10">
        <ConvergenceRaceChart />
      </ScrollReveal>
    </SectionWrapper>
  );
});

export default AdaptiveMethod;
