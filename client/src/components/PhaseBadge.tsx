import { cn } from "@/lib/utils";

type PhaseColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED';

interface PhaseBadgeProps {
  phase: PhaseColor;
  className?: string;
}

const phaseStyles: Record<PhaseColor, string> = {
  GREEN: 'bg-[#16A34A]/20 text-white border-white/30',
  BLUE: 'bg-[#2563EB]/20 text-white border-white/30',
  ORANGE: 'bg-[#F97316]/20 text-white border-white/30',
  RED: 'bg-[#DC2626]/20 text-white border-white/30',
};

export default function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border text-white border-white/30 bg-[#1e88e5]"
      data-testid={`badge-phase-${phase.toLowerCase()}`}
    >
      {phase}
    </span>
  );
}
