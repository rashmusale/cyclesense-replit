import PhaseBadge from '../PhaseBadge';

export default function PhaseBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <PhaseBadge phase="GREEN" />
      <PhaseBadge phase="BLUE" />
      <PhaseBadge phase="ORANGE" />
      <PhaseBadge phase="RED" />
    </div>
  );
}
