"use client";

import { forwardRef } from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Callout from "@/components/ui/Callout";

const Conclusion = forwardRef<HTMLElement>(function Conclusion(_props, ref) {
  return (
    <SectionWrapper id="conclusion" ref={ref}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
        Looking Forward
      </h2>

      <ScrollReveal>
        <Callout>
          The Monte Carlo framework should allow for the easy use of other
          noise distributions &mdash; like asymmetric or skew Gaussian &mdash;
          to represent execution error. We also plan to use skill estimates to
          handicap players in darts, making games between different-skilled
          players even and more exciting.
        </Callout>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Callout>
          Generalizations of this approach could provide skill estimates in
          domains beyond darts &mdash; shooting, billiards, curling, golf,
          cornhole, and archery.
        </Callout>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="space-y-4 text-foreground leading-relaxed font-sans mt-8">
          <p>
            This work demonstrates that Monte Carlo methods can recover
            information that seems permanently lost in the scoring process. By
            replacing intractable integrals with simulation, MCEM opens the
            door to skill estimation from any aiming point &mdash; not just the
            center &mdash; and the adaptive approach makes this estimation
            faster and more practical.
          </p>
        </div>
      </ScrollReveal>

      {/* Author / Paper info */}
      <ScrollReveal delay={0.3}>
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h3 className="font-serif text-lg font-semibold mb-4">
            About This Work
          </h3>
          <div className="text-sm text-muted font-sans space-y-2">
            <p>
              <strong>Paper</strong>: &ldquo;Monte Carlo Skill Estimation for
              Darts&rdquo; by Thomas Miller &amp; Christopher Archibald
            </p>
            <p>
              <strong>Affiliation</strong>: Brigham Young University
            </p>
            <div className="flex flex-wrap gap-4 pt-5">
              <a
                href="/paper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Read the Paper (PDF)
              </a>
              <a
                href="https://github.com/thomasjmiller12/mc-skill-for-darts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
            <p className="pt-4 text-xs text-muted">
              This interactive explainer was built to make the paper&apos;s
              ideas accessible through hands-on simulation. All computations
              run client-side in your browser.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </SectionWrapper>
  );
});

export default Conclusion;
