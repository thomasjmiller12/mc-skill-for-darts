"use client";

import { useMemo, forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Callout from "@/components/ui/Callout";
import Equation from "@/components/math/Equation";
import InlineMath from "@/components/math/InlineMath";
import Dartboard from "@/components/dartboard/Dartboard";
import DartboardCanvas from "@/components/dartboard/DartboardCanvas";
import { sampleGaussian2DBatch } from "@/lib/gaussian";
import { getRegion } from "@/components/dartboard/dartboard-utils";

function SkillThumbnail({
  sigma,
  label,
  delay,
}: {
  sigma: number;
  label: string;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const points = useMemo(() => {
    return sampleGaussian2DBatch(0, 0, sigma, 60).map(([x, y]) => ({
      x,
      y,
      color: "#4A7C9B",
      radius: 1.5,
      opacity: 0.6,
    }));
  }, [sigma]);

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative">
        <Dartboard size={100} showNumbers={false}>
          <></>
        </Dartboard>
        <DartboardCanvas size={100} points={points} />
      </div>
      <span className="font-mono text-xs text-accent-blue">
        &sigma; = {sigma}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </motion.div>
  );
}

function ComparisonBoard({
  title,
  showPoints,
  showRegions,
}: {
  title: string;
  showPoints: boolean;
  showRegions: boolean;
}) {
  const data = useMemo(() => {
    const raw = sampleGaussian2DBatch(0, 30, 40, 25);
    return raw.map(([x, y]) => ({
      x,
      y,
      region: getRegion(x, y),
    }));
  }, []);

  const points = showPoints
    ? data.map((d) => ({
        x: d.x,
        y: d.y,
        color: "#4A7C9B",
        radius: 3,
        opacity: 0.85,
      }))
    : undefined;

  const highlightScores = showRegions
    ? new Set(data.map((d) => d.region.score))
    : undefined;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Dartboard size={240} highlightRegions={highlightScores}>
          <g>
            <line
              x1={-8}
              y1={30}
              x2={8}
              y2={30}
              stroke="#D4A853"
              strokeWidth={1.5}
            />
            <line
              x1={0}
              y1={22}
              x2={0}
              y2={38}
              stroke="#D4A853"
              strokeWidth={1.5}
            />
          </g>
        </Dartboard>
        {showPoints && <DartboardCanvas size={240} points={points} />}
      </div>
      <p className="text-sm text-muted text-center max-w-[240px] italic">
        {title}
      </p>
    </div>
  );
}

const SKILL_LEVELS = [
  { sigma: 10, label: "Elite" },
  { sigma: 40, label: "Skilled" },
  { sigma: 63, label: "Amateur" },
  { sigma: 107, label: "Beginner" },
  { sigma: 170, label: "Novice" },
];

const TheProblem = forwardRef<HTMLElement>(function TheProblem(_props, ref) {
  return (
    <SectionWrapper id="problem" ref={ref}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
        What is Skill?
      </h2>

      <ScrollReveal>
        <Callout>
          In physical games like darts, the ability of a player to accurately
          execute an intended action has a significant impact on their success.
          But how do you measure something you can&apos;t directly observe?
        </Callout>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="space-y-4 text-foreground leading-relaxed font-sans">
          <p>
            A dart player aims at a point <InlineMath math="\mu" /> on the
            board, but their throw lands at{" "}
            <InlineMath math="X \sim \mathcal{N}(\mu, \sigma^2 I)" />. The
            parameter <InlineMath math="\sigma" /> is their{" "}
            <strong>skill</strong> &mdash; lower{" "}
            <InlineMath math="\sigma" /> means more precise throws.
          </p>
          <p>
            Here&apos;s the catch: we can&apos;t see{" "}
            <InlineMath math="X" /> (the exact landing spot). We only observe
            the <strong>score</strong>{" "}
            <InlineMath math="Z = \text{score}(X)" />. Information is lost.
          </p>
        </div>
      </ScrollReveal>

      {/* Side-by-side comparison */}
      <ScrollReveal className="my-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <ComparisonBoard
            title="If we could see the exact landing points, estimation is trivial"
            showPoints={true}
            showRegions={false}
          />
          <div className="text-3xl text-muted font-serif">&rarr;</div>
          <ComparisonBoard
            title="But all we actually see are the score regions"
            showPoints={false}
            showRegions={true}
          />
        </div>
      </ScrollReveal>

      <Equation
        math="\hat{\sigma}^2 = \frac{1}{2n} \sum_{i=1}^{n} |\mu_i - x_i|^2"
        annotation="This would work perfectly... if we knew the x values."
      />

      {/* Skill scale with staggered thumbnails */}
      <div className="my-16">
        <ScrollReveal>
          <h3 className="font-serif text-xl font-semibold mb-6 text-center">
            The Skill Spectrum
          </h3>
        </ScrollReveal>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {SKILL_LEVELS.map((level, i) => (
            <SkillThumbnail
              key={level.sigma}
              sigma={level.sigma}
              label={level.label}
              delay={i * 0.08}
            />
          ))}
        </div>
        <p className="figure-caption mt-4">
          Figure 1: Scatter patterns for different skill levels, all aiming at
          the center
        </p>
      </div>
    </SectionWrapper>
  );
});

export default TheProblem;
