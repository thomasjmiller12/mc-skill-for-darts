"use client";

import { useState, useMemo, useCallback, forwardRef } from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";
import Dartboard from "@/components/dartboard/Dartboard";
import DartboardCanvas from "@/components/dartboard/DartboardCanvas";
import { sampleGaussian2DBatch } from "@/lib/gaussian";
import { mleSigma } from "@/lib/scoring";
import { getRegion } from "@/components/dartboard/dartboard-utils";
import { BOARD_RADIUS } from "@/components/dartboard/dartboard-constants";

const BOARD_SIZE = 420;

const ThrowSimulator = forwardRef<HTMLElement>(function ThrowSimulator(
  _props,
  ref
) {
  const [muX, setMuX] = useState(0);
  const [muY, setMuY] = useState(0);
  const [sigma, setSigma] = useState(40);
  const [numDarts, setNumDarts] = useState(50);
  const [throws, setThrows] = useState<[number, number][]>([]);
  const [throwKey, setThrowKey] = useState(0);

  const handleBoardClick = useCallback((x: number, y: number) => {
    const r = Math.sqrt(x * x + y * y);
    if (r > BOARD_RADIUS) {
      const scale = BOARD_RADIUS / r;
      setMuX(x * scale);
      setMuY(y * scale);
    } else {
      setMuX(x);
      setMuY(y);
    }
  }, []);

  const handleThrow = useCallback(() => {
    const pts = sampleGaussian2DBatch(muX, muY, sigma, numDarts);
    setThrows(pts);
    setThrowKey((k) => k + 1);
  }, [muX, muY, sigma, numDarts]);

  const handleClear = useCallback(() => {
    setThrows([]);
    setThrowKey((k) => k + 1);
  }, []);

  const scoreTally = useMemo(() => {
    const tally = new Map<number, number>();
    for (const [x, y] of throws) {
      const region = getRegion(x, y);
      tally.set(region.score, (tally.get(region.score) || 0) + 1);
    }
    return Array.from(tally.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [throws]);

  const mleSigmaValue = useMemo(() => {
    if (throws.length === 0) return null;
    return mleSigma(throws, muX, muY);
  }, [throws, muX, muY]);

  const canvasPoints = useMemo(() => {
    return throws.map(([x, y]) => {
      const region = getRegion(x, y);
      const isMiss = region.type === "miss";
      return {
        x,
        y,
        color: isMiss ? "#999" : "#1A1A1A",
        radius: 2.5,
        opacity: isMiss ? 0.4 : 0.75,
      };
    });
  }, [throws]);

  return (
    <SectionWrapper id="simulator" ref={ref} wide bg="bg-white/50">
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-center">
        The Throw Simulator
      </h2>
      <p className="text-muted text-center mb-10 max-w-lg mx-auto">
        Click the board to set your target, adjust your skill level, and throw.
      </p>

      <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
        {/* Dartboard */}
        <div
          className="relative"
          style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
        >
          <Dartboard size={BOARD_SIZE} onBoardClick={handleBoardClick}>
            <g>
              <line
                x1={muX - 10}
                y1={-muY}
                x2={muX + 10}
                y2={-muY}
                stroke="#D4A853"
                strokeWidth={2}
              />
              <line
                x1={muX}
                y1={-muY - 10}
                x2={muX}
                y2={-muY + 10}
                stroke="#D4A853"
                strokeWidth={2}
              />
              <circle
                cx={muX}
                cy={-muY}
                r={6}
                fill="none"
                stroke="#D4A853"
                strokeWidth={1.5}
              />
            </g>
          </Dartboard>
          <DartboardCanvas
            key={throwKey}
            size={BOARD_SIZE}
            points={canvasPoints}
            gaussianCenter={
              throws.length > 0 ? { x: muX, y: muY, sigma } : undefined
            }
          />
        </div>

        {/* Controls and readout */}
        <ScrollReveal delay={0.15} className="flex-1 min-w-[280px] max-w-[360px]">
          <div className="space-y-6">
            <Slider
              label="Skill (sigma)"
              value={sigma}
              min={10}
              max={170}
              onChange={setSigma}
              unit=" mm"
              marks={[
                { value: 10, label: "Elite" },
                { value: 63, label: "Amateur" },
                { value: 170, label: "Novice" },
              ]}
            />

            <Slider
              label="Number of darts"
              value={numDarts}
              min={10}
              max={200}
              step={10}
              onChange={setNumDarts}
            />

            <div className="flex gap-3">
              <Button onClick={handleThrow}>Throw {numDarts} Darts</Button>
              <Button variant="secondary" onClick={handleClear}>
                Clear
              </Button>
            </div>

            {/* Readout */}
            <div className="bg-background rounded-lg p-4 border border-gray-100">
              <h4 className="font-sans text-sm font-semibold mb-3 text-foreground">
                Readout
              </h4>
              <div className="space-y-2 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted">Target</span>
                  <span className="font-mono">
                    ({muX.toFixed(0)}, {muY.toFixed(0)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">True &sigma;</span>
                  <span className="font-mono">{sigma.toFixed(1)}</span>
                </div>
                {mleSigmaValue !== null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">
                        MLE &sigma;&#770; (from locations)
                      </span>
                      <span className="font-mono text-accent-blue">
                        {mleSigmaValue.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">From scores alone</span>
                      <span className="font-mono text-accent-coral">???</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Score tally */}
            {scoreTally.length > 0 && (
              <div className="bg-background rounded-lg p-4 border border-gray-100">
                <h4 className="font-sans text-sm font-semibold mb-3 text-foreground">
                  Score Tally (top 8)
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                  {scoreTally.map(([score, count]) => (
                    <div key={score} className="flex justify-between">
                      <span className="text-muted">{score}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal className="mt-8">
        <p className="text-sm text-muted text-center max-w-xl mx-auto italic">
          Notice how different scores can come from very different locations. A
          score of 20 could be a single 20, a double 10, or a triple 4 &mdash;
          each from wildly different spots on the board. This is the information
          we lose.
        </p>
      </ScrollReveal>
    </SectionWrapper>
  );
});

export default ThrowSimulator;
