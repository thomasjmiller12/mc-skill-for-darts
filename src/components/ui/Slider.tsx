"use client";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  marks?: { value: number; label: string }[];
  showValue?: boolean;
  unit?: string;
  className?: string;
}

export default function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  marks,
  showValue = true,
  unit = "",
  className = "",
}: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-baseline">
          {label && (
            <label className="text-sm font-sans text-foreground font-medium">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-mono text-muted">
              {value.toFixed(step < 1 ? 1 : 0)}
              {unit}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
      {marks && (
        <div className="relative w-full h-5">
          {marks.map((mark) => {
            const pct = ((mark.value - min) / (max - min)) * 100;
            return (
              <span
                key={mark.value}
                className="absolute text-xs text-muted font-mono -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {mark.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
