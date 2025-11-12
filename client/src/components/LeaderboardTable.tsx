import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Team {
  id: number;
  name: string;
  navCurrent: number;
  pitchTotal: number;
}

interface LeaderboardTableProps {
  teams: Team[];
}

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable({ teams }: LeaderboardTableProps) {
  const sortedTeams = [...teams].sort((a, b) => b.navCurrent - a.navCurrent);

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-[#F97316]/10 to-transparent border-l-4 border-l-[#F97316]';
    if (index === 1) return 'bg-gradient-to-r from-[#16A34A]/10 to-transparent border-l-4 border-l-[#16A34A]';
    if (index === 2) return 'bg-gradient-to-r from-[#2563EB]/10 to-transparent border-l-4 border-l-[#2563EB]';
    return '';
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/50 to-muted/20">
            <TableHead className="w-16 text-sm font-semibold uppercase tracking-wide">Rank</TableHead>
            <TableHead className="text-sm font-semibold uppercase tracking-wide">Team</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">NAV</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">Pitch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => (
            <TableRow 
              key={team.id} 
              className={`hover-elevate ${getRankColor(index)}`}
              data-testid={`row-team-${team.id}`}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {index < 3 && <span className="text-xl">{medals[index]}</span>}
                  {index >= 3 && <span className="text-muted-foreground font-semibold">{index + 1}</span>}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-lg" data-testid={`text-team-name-${team.id}`}>
                {team.name}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-xl font-bold text-foreground" data-testid={`text-nav-${team.id}`}>
                  {team.navCurrent.toFixed(2)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="px-2 py-1 rounded bg-[#2563EB]/10 font-mono text-base font-semibold text-[#2563EB]" data-testid={`text-pitch-${team.id}`}>
                  {team.pitchTotal}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
