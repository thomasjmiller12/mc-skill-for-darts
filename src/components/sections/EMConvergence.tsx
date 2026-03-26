"use client";

import { useState, useMemo, useCallback, useRef, useEffect, forwardRef } from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";
import Dartboard from "@/components/dartboard/Dartboard";
import DartboardCanvas from "@/components/dartboard/DartboardCanvas";
import { sampleGaussian2DBatch } from "@/lib/gaussian";
import { score } from "@/lib/scoring";
import { mcemStep } from "@/lib/mcem";
import { getRegionCenter } from "@/components/dartboard/dartboard-utils";

const BOARD_SIZE = 380;

const PRESETS = [
  { label: "Center", x: 0, y: 0 },
  { label: "Triple 20", ...(() => { const [x, y] = getRegionCenter(20, "triple"); return { x, y }; })() },
  { label: "Triple 11", ...(() => { const [x, y] = getRegionCenter(11, "triple"); return { x, y }; })() },
];

const EMConvergence = forwardRef<HTMLElement>(function EMConvergence(_props, ref) {
  const [trueSigma, setTrueSigma] = useState(50);
  const [muX, setMuX] = useState(0);
  const [muY, setMuY] = useState(0);
  const [iterations, setIterations] = useState<
    { sigma: number; samples?: [number, number][]; sampleScores?: number[] }[]
  >([]);
  const [, setCurrentIter] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [observedThrows, setObservedThrows] = useState<[number, number][]>([]);
  const [observedScores, setObservedScores] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate observed throws when params change
  const regenerate = useCallback(() => {
    const pts = sampleGaussian2DBatch(muX, muY, trueSigma, 30);
    const scores = pts.map(([x, y]) => score(x, y));
    setObservedThrows(pts);
    setObservedScores(scores);
    setIterations([{ sigma: 50 }]);
    setCurrentIter(0);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [muX, muY, trueSigma]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const stepOnce = useCallback(() => {
    setIterations((prev) => {
      const last = prev[prev.length - 1];
      if (prev.length > 10) return prev;
      const result = mcemStep(observedScores, muX, muY, last.sigma, 5000);
      return [
        ...prev,
        {
          sigma: result.newSigma,
          samples: result.samples.slice(0, 500), // Keep subset for viz
          sampleScores: result.sampleScores.slice(0, 500),
        },
      ];
    });
    setCurrentIter((c) => Math.min(c + 1, 10));
  }, [observedScores, muX, muY]);

  const runEM = useCallback(() => {
    setIsRunning(true);
    // Reset to initial
    setIterations([{ sigma: 50 }]);
    setCurrentIter(0);

    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > 10) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }
      stepOnce();
    }, 600);
  }, [stepOnce]);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    regenerate();
  }, [regenerate]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentSigmaEst =
    iterations.length > 0 ? iterations[iterations.length - 1].sigma : 50;
  const errorPct =
    trueSigma > 0
      ? Math.abs(((currentSigmaEst - trueSigma) / trueSigma) * 100)
      : 0;

  // Canvas points: observed throws
  const throwPoints = useMemo(
    () =>
      observedThrows.map(([x, y]) => ({
        x,
        y,
        color: "#1A1A1A",
        radius: 3,
        opacity: 0.8,
      })),
    [observedThrows]
  );

  // MC sample points (faint)
  const currentResult = iterations[iterations.length - 1];
  const mcPoints = useMemo(() => {
    if (!currentResult?.samples) return [];
    return currentResult.samples.map(([x, y]) => ({
      x,
      y,
      color: "#4A7C9B",
      radius: 1.5,
      opacity: 0.15,
    }));
  }, [currentResult]);

  const allPoints = useMemo(
    () => [...mcPoints, ...throwPoints],
    [mcPoints, throwPoints]
  );

  return (
    <SectionWrapper id="convergence" ref={ref} wide bg="bg-white/50">
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-center">
            Watch EM Converge
          </h2>
          <p className="text-muted text-center mb-10 max-w-lg mx-auto">
            Set the true skill and aiming point, then watch the algorithm
            discover &sigma; from scores alone.
          </p>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Dartboard */}
          <ScrollReveal>
            <div
              className="relative"
              style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
            >
              <Dartboard
                size={BOARD_SIZE}
                onBoardClick={(x, y) => {
                  setMuX(x);
                  setMuY(y);
                }}
              >
                {/* Crosshair */}
                <g>
                  <line
                    x1={muX - 8}
                    y1={-muY}
                    x2={muX + 8}
                    y2={-muY}
                    stroke="#D4A853"
                    strokeWidth={1.5}
                  />
                  <line
                    x1={muX}
                    y1={-muY - 8}
                    x2={muX}
                    y2={-muY + 8}
                    stroke="#D4A853"
                    strokeWidth={1.5}
                  />
                </g>
              </Dartboard>
              <DartboardCanvas
                size={BOARD_SIZE}
                points={allPoints}
                sigmaRing={{
                  x: muX,
                  y: muY,
                  sigma: currentSigmaEst,
                  color: "#D4756A",
                  dashed: true,
                }}
                gaussianCenter={
                  currentResult?.samples
                    ? { x: muX, y: muY, sigma: currentSigmaEst }
                    : undefined
                }
              />
            </div>
          </ScrollReveal>

          {/* Controls + convergence */}
          <ScrollReveal className="flex-1 min-w-[300px] max-w-[400px]">
            <div className="space-y-5">
              <Slider
                label="True sigma (hidden from algorithm)"
                value={trueSigma}
                min={10}
                max={120}
                onChange={setTrueSigma}
                unit=" mm"
                marks={[
                  { value: 10, label: "Elite" },
                  { value: 63, label: "Amateur" },
                  { value: 120, label: "Beginner" },
                ]}
              />

              {/* Preset targets */}
              <div>
                <label className="text-sm font-sans font-medium text-foreground block mb-2">
                  Aiming target
                </label>
                <div className="flex gap-2">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      variant={
                        Math.abs(muX - p.x) < 1 && Math.abs(muY - p.y) < 1
                          ? "primary"
                          : "secondary"
                      }
                      size="sm"
                      onClick={() => {
                        setMuX(p.x);
                        setMuY(p.y);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={runEM} disabled={isRunning}>
                  Run EM
                </Button>
                <Button variant="secondary" onClick={stepOnce} disabled={isRunning || iterations.length > 10}>
                  Step
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Reset
                </Button>
              </div>

              {/* Convergence chart */}
              <div className="bg-background rounded-lg p-4 border border-gray-100">
                <h4 className="font-sans text-sm font-semibold mb-3">
                  Convergence
                </h4>
                <div className="h-40 relative">
                  <ConvergenceChart
                    iterations={iterations.map((it, i) => ({
                      iter: i,
                      sigma: it.sigma,
                    }))}
                    trueSigma={trueSigma}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="bg-background rounded-lg p-4 border border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                  <div>
                    <span className="text-muted block">True &sigma;</span>
                    <span className="font-mono text-lg font-semibold">
                      {trueSigma.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">
                      Estimated &sigma;&#770;
                    </span>
                    <span className="font-mono text-lg font-semibold text-accent-blue">
                      {currentSigmaEst.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Iteration</span>
                    <span className="font-mono text-lg">
                      {iterations.length - 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Error</span>
                    <span
                      className={`font-mono text-lg ${
                        errorPct < 10
                          ? "text-board-green"
                          : errorPct < 25
                          ? "text-accent-gold"
                          : "text-accent-coral"
                      }`}
                    >
                      {errorPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal className="mt-8">
          <p className="text-sm text-muted text-center max-w-xl mx-auto italic">
            Watch how the Monte Carlo samples redistribute as &sigma;&#770;
            changes. In early iterations the cloud may be too wide or too narrow
            &mdash; but each step refines it, pulling the estimate toward truth.
          </p>
        </ScrollReveal>
    </SectionWrapper>
  );
});

export default EMConvergence;

/** Simple inline convergence chart using SVG */
function ConvergenceChart({
  iterations,
  trueSigma,
}: {
  iterations: { iter: number; sigma: number }[];
  trueSigma: number;
}) {
  if (iterations.length === 0) return null;

  const w = 300;
  const h = 140;
  const pad = { top: 10, right: 15, bottom: 25, left: 40 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const maxIter = 10;
  const allSigmas = [...iterations.map((it) => it.sigma), trueSigma];
  const minSigma = Math.min(...allSigmas) * 0.8;
  const maxSigma = Math.max(...allSigmas) * 1.2;

  const xScale = (iter: number) => pad.left + (iter / maxIter) * plotW;
  const yScale = (sigma: number) =>
    pad.top + plotH - ((sigma - minSigma) / (maxSigma - minSigma)) * plotH;

  const linePath = iterations
    .map(
      (it, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(it.iter)} ${yScale(it.sigma)}`
    )
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* True sigma line */}
      <line
        x1={pad.left}
        y1={yScale(trueSigma)}
        x2={w - pad.right}
        y2={yScale(trueSigma)}
        stroke="#5B9F6E"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text
        x={w - pad.right + 2}
        y={yScale(trueSigma)}
        fontSize={9}
        fill="#5B9F6E"
        dominantBaseline="central"
      >
        true
      </text>

      {/* Axes */}
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={h - pad.bottom}
        stroke="#ddd"
        strokeWidth={1}
      />
      <line
        x1={pad.left}
        y1={h - pad.bottom}
        x2={w - pad.right}
        y2={h - pad.bottom}
        stroke="#ddd"
        strokeWidth={1}
      />

      {/* X axis labels */}
      {[0, 5, 10].map((i) => (
        <text
          key={i}
          x={xScale(i)}
          y={h - pad.bottom + 15}
          fontSize={9}
          fill="#6B6B6B"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains), monospace"
        >
          {i}
        </text>
      ))}
      <text
        x={pad.left + plotW / 2}
        y={h - 2}
        fontSize={9}
        fill="#6B6B6B"
        textAnchor="middle"
      >
        iteration
      </text>

      {/* Y axis labels */}
      {[minSigma, (minSigma + maxSigma) / 2, maxSigma].map((v) => (
        <text
          key={v}
          x={pad.left - 5}
          y={yScale(v)}
          fontSize={9}
          fill="#6B6B6B"
          textAnchor="end"
          dominantBaseline="central"
          fontFamily="var(--font-jetbrains), monospace"
        >
          {v.toFixed(0)}
        </text>
      ))}

      {/* Convergence line */}
      <path
        d={linePath}
        fill="none"
        stroke="#4A7C9B"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Points */}
      {iterations.map((it) => (
        <circle
          key={it.iter}
          cx={xScale(it.iter)}
          cy={yScale(it.sigma)}
          r={3}
          fill="#4A7C9B"
        />
      ))}
    </svg>
  );
}
