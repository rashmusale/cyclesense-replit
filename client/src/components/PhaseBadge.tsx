import { cn } from "@/lib/utils";

type PhaseColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED';

interface PhaseBadgeProps {
  phase: PhaseColor;
  className?: string;
}

const phaseStyles: Record<PhaseColor, string> = {
  GREEN: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  BLUE: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  ORANGE: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  RED: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border",
        phaseStyles[phase],
        className
      )}
      data-testid={`badge-phase-${phase.toLowerCase()}`}
    >
      {phase}
    </span>
  );
}
