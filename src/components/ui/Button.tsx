"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ButtonProps) {
  const base =
    "font-sans font-medium rounded-lg transition-all duration-150 active:scale-[0.97]";

  const variants = {
    primary:
      "bg-accent-blue text-white shadow-sm hover:shadow-md hover:brightness-110 disabled:opacity-50",
    secondary:
      "bg-white text-foreground border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-50",
    ghost: "text-accent-blue hover:bg-accent-blue/10 disabled:opacity-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
