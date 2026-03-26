"use client";

import { useState, useEffect, forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Callout from "@/components/ui/Callout";
import Equation from "@/components/math/Equation";
import InlineMath from "@/components/math/InlineMath";

const STEPS = [
  { label: "Generate MC samples", color: "#4A7C9B" },
  { label: "Compute expected distances D", color: "#D4A853" },
  { label: "MLE on D", color: "#D4756A" },
  { label: "Update \u03C3", color: "#5B9F6E" },
];

function EMLoopDiagram() {
  const [activeStep, setActiveStep] = useState(-1);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="flex flex-col items-center my-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-accent-blue bg-accent-blue/5">
          <span className="font-mono text-sm text-accent-blue">
            &sigma;<sub>t</sub>
          </span>
        </div>
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="text-muted"
            >
              <path
                d="M6 10h8M11 7l3 3-3 3"
                stroke="currentColor"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <motion.div
              animate={{
                scale: activeStep === i ? 1.05 : 1,
                borderColor: activeStep === i ? step.color : "#e5e7eb",
              }}
              transition={{ duration: 0.3 }}
              className="px-4 py-2 rounded-lg border-2 text-sm font-sans"
              style={{
                color: activeStep === i ? step.color : "#6B6B6B",
              }}
            >
              {step.label}
            </motion.div>
          </div>
        ))}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="text-muted"
        >
          <path
            d="M6 10h8M11 7l3 3-3 3"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-accent-blue bg-accent-blue/5">
          <span className="font-mono text-sm text-accent-blue">
            &sigma;<sub>t+1</sub>
          </span>
        </div>
      </div>
      <p className="figure-caption mt-3">
        Figure 2: The Monte Carlo EM loop
      </p>
    </div>
  );
}

const EnterEM = forwardRef<HTMLElement>(function EnterEM(_props, ref) {
  return (
    <SectionWrapper id="em" ref={ref}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
        Recovering Lost Information
      </h2>

      <ScrollReveal>
        <Callout>
          The only information available after a typical darts throw is the
          score. Each score represents a variety of different locations where a
          dart could have landed, and thus, information about the throw is lost.
          Skill estimation methods must overcome this information loss.
        </Callout>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="space-y-4 text-foreground leading-relaxed font-sans">
          <p>
            The <strong>Expectation-Maximization (EM)</strong> algorithm is a
            natural fit for this problem. It works in two alternating steps:
          </p>

          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              <strong>Start with a guess</strong> for{" "}
              <InlineMath math="\sigma" />
            </li>
            <li>
              <strong>E step</strong>: &ldquo;Given our current guess of{" "}
              <InlineMath math="\sigma" />, where do we <em>expect</em> each
              dart to have landed?&rdquo;
            </li>
            <li>
              <strong>M step</strong>: &ldquo;Given those expected locations,
              what&apos;s the best <InlineMath math="\sigma" />
              ?&rdquo;
            </li>
            <li>
              <strong>Repeat</strong> until convergence
            </li>
          </ol>

          <p>
            A previous method by Tibshirani et al. could compute the E step
            analytically &mdash; but <em>only</em> when aiming at the center,
            exploiting radial symmetry. For any other target, the integral
            becomes intractable.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <Callout>
          When the target &mu; is a location other than the center, the
          expectation function becomes too difficult to evaluate analytically.
        </Callout>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-4 text-foreground leading-relaxed font-sans">
          <p>
            <strong>The solution</strong>: replace the analytical E step with{" "}
            <strong>Monte Carlo sampling</strong>. Generate thousands of
            simulated throws from{" "}
            <InlineMath math="\mathcal{N}(\mu, \hat{\sigma}_t^2 I)" />, then
            use the simulated locations to estimate the expected distances.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <EMLoopDiagram />
      </ScrollReveal>

      <div className="space-y-6 my-8">
        <ScrollReveal>
          <h4 className="font-serif text-lg font-semibold mb-2">
            E Step &mdash; Expected squared distance for score{" "}
            <InlineMath math="s_k" />
          </h4>
          <Equation
            math="m_k = \frac{\sum_{y_j \in s_k} |\mu - y_j|^2}{l}"
            annotation="Average the squared distances of all MC samples that landed in score region s_k."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h4 className="font-serif text-lg font-semibold mb-2">
            M Step &mdash; New &sigma; estimate
          </h4>
          <Equation
            math="\sigma_{t+1}^2 = \frac{\sum_{d_i \in D} d_i}{2n}"
            annotation="The classic MLE formula, but now using expected distances instead of true distances."
          />
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
});

export default EnterEM;
