"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export default function InlineMath({
  math,
  className = "",
}: {
  math: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(math, ref.current, {
        displayMode: false,
        throwOnError: false,
      });
    }
  }, [math]);

  return <span ref={ref} className={className} />;
}
