"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  bg?: string;
}

export const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
  function SectionWrapper({ id, children, className, wide, bg }, ref) {
    const shouldReduceMotion = useReducedMotion();

    return (
      <section
        ref={ref}
        id={id}
        className={`relative py-24 md:py-32 ${bg || ""} ${className || ""}`}
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 30 }
          }
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mx-auto px-6 ${wide ? "max-w-wide" : "max-w-article"}`}
        >
          {children}
        </motion.div>
      </section>
    );
  }
);
