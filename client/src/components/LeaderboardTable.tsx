import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Team {
  id: number;
  name: string;
  navCurrent: number;
  pitchTotal: number;
  emotionTotal: number;
}

interface LeaderboardTableProps {
  teams: Team[];
}

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable({ teams }: LeaderboardTableProps) {
  const sortedTeams = [...teams].sort((a, b) => b.navCurrent - a.navCurrent);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-sm font-semibold uppercase tracking-wide">Rank</TableHead>
            <TableHead className="text-sm font-semibold uppercase tracking-wide">Team</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">NAV</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">Pitch</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">Emotion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => (
            <TableRow 
              key={team.id} 
              className="hover-elevate"
              data-testid={`row-team-${team.id}`}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {index < 3 && <span className="text-lg">{medals[index]}</span>}
                  {index >= 3 && <span className="text-muted-foreground">{index + 1}</span>}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-lg" data-testid={`text-team-name-${team.id}`}>
                {team.name}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-xl font-bold" data-testid={`text-nav-${team.id}`}>
                  {team.navCurrent.toFixed(2)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-base" data-testid={`text-pitch-${team.id}`}>
                  {team.pitchTotal}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-base" data-testid={`text-emotion-${team.id}`}>
                  {team.emotionTotal}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
