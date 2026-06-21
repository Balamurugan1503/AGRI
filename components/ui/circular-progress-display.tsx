// components/ui/circular-progress-display.tsx
import React from 'react';
import { cn } from "@/lib/utils"; // Assuming you have a cn utility for tailwind-merge

interface CircularProgressDisplayProps {
  value: number;
  max: number; // Max value for calculation, not necessarily displayed
  unit: string;
  label: string;
  size?: number; // Diameter of the circle
  strokeWidth?: number; // Thickness of the progress arc
  className?: string;
  indicatorColorClass?: string; // Tailwind class for the progress color
  textColorClass?: string; // Tailwind class for the text color
}

export const CircularProgressDisplay: React.FC<CircularProgressDisplayProps> = ({
  value,
  max,
  unit,
  label,
  size = 120, // Default size
  strokeWidth = 10, // Default stroke width
  className,
  indicatorColorClass = "stroke-primary", // Default primary color
  textColorClass = "text-foreground", // Default text color
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, max); // Ensure value doesn't exceed max for calculation
  const offset = circumference - (progress / max) * circumference;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center font-semibold",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg className="absolute top-0 left-0" width={size} height={size}>
        {/* Background Circle */}
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="text-muted" // Color for the background track
        />
        {/* Progress Circle */}
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className={cn("transition-all duration-500 ease-out", indicatorColorClass)}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transformOrigin: "center",
            transform: "rotate(-90deg)", // Start from top
          }}
        />
      </svg>
      <div className={cn("flex flex-col items-center justify-center z-10", textColorClass)}>
        <span className="text-xl leading-none">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
        <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
      </div>
    </div>
  );
};