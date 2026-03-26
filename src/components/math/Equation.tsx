"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import katex from "katex";
import "katex/dist/katex.min.css";

interface EquationProps {
  math: string;
  display?: boolean;
  annotation?: string;
  className?: string;
}

export default function Equation({
  math,
  display = true,
  annotation,
  className = "",
}: EquationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, {
        displayMode: display,
        throwOnError: false,
        trust: true,
      });
    }
  }, [math, display]);

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, clipPath: "inset(0 100% 0 0)" }
      }
      whileInView={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      <div ref={containerRef} className={display ? "katex-display" : ""} />
      {annotation && <p className="equation-annotation">{annotation}</p>}
    </motion.div>
  );
}
