import { cn } from "@/lib/utils";

type PhaseColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED';

interface PhaseBadgeProps {
  phase: PhaseColor;
  className?: string;
}

const phaseStyles: Record<PhaseColor, string> = {
  GREEN: 'bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/30',
  BLUE: 'bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30',
  ORANGE: 'bg-[#F97316]/20 text-[#F97316] border-[#F97316]/30',
  RED: 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/30',
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
