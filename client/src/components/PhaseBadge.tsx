import { cn } from "@/lib/utils";

type PhaseColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED';

interface PhaseBadgeProps {
  phase: PhaseColor;
  className?: string;
}

const phaseStyles: Record<PhaseColor, string> = {
  GREEN: 'bg-[#2e8b57] text-white border-white/30',
  BLUE: 'bg-[#1e88e5] text-white border-white/30',
  ORANGE: 'bg-[#f57c00] text-white border-white/30',
  RED: 'bg-[#c62828] text-white border-white/30',
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
