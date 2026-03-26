"use client";

import { useState, useEffect, useRef } from "react";
import DotNav from "@/components/ui/DotNav";
import Hero from "@/components/sections/Hero";
import TheProblem from "@/components/sections/TheProblem";
import ThrowSimulator from "@/components/sections/ThrowSimulator";
import EnterEM from "@/components/sections/EnterEM";
import EMConvergence from "@/components/sections/EMConvergence";
import OptimalTarget from "@/components/sections/OptimalTarget";
import AdaptiveMethod from "@/components/sections/AdaptiveMethod";
import Conclusion from "@/components/sections/Conclusion";

const SECTIONS = [
  { id: "hero", label: "Intro" },
  { id: "problem", label: "What is Skill?" },
  { id: "simulator", label: "Throw Simulator" },
  { id: "em", label: "Enter EM" },
  { id: "convergence", label: "EM Convergence" },
  { id: "optimal", label: "Optimal Target" },
  { id: "adaptive", label: "Adaptive Method" },
  { id: "conclusion", label: "Conclusion" },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("hero");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3 }
    );

    const obs = observerRef.current;
    sectionRefs.current.forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);

  const registerRef = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
      observerRef.current?.observe(el);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <DotNav sections={SECTIONS} activeId={activeSection} />
      <Hero ref={registerRef("hero")} />
      <TheProblem ref={registerRef("problem")} />
      <ThrowSimulator ref={registerRef("simulator")} />
      <EnterEM ref={registerRef("em")} />
      <EMConvergence ref={registerRef("convergence")} />
      <OptimalTarget ref={registerRef("optimal")} />
      <AdaptiveMethod ref={registerRef("adaptive")} />
      <Conclusion ref={registerRef("conclusion")} />
    </div>
  );
}
