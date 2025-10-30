import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

interface TeamResult {
  teamName: string;
  navBefore: number;
  portfolioReturn: number;
  pitchPoints: number;
  emotionPoints: number;
  navAfter: number;
}

interface RoundSummaryTableProps {
  results: TeamResult[];
}

export default function RoundSummaryTable({ results }: RoundSummaryTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm font-semibold uppercase tracking-wide">Team</TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">Before NAV</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">Return %</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">+Pitch</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">+Emotion</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-right text-sm font-semibold uppercase tracking-wide">After NAV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index} className="hover-elevate" data-testid={`row-result-${index}`}>
              <TableCell className="font-semibold" data-testid={`text-team-name-${index}`}>
                {result.teamName}
              </TableCell>
              <TableCell className="text-right font-mono font-bold" data-testid={`text-nav-before-${index}`}>
                {result.navBefore.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableCell>
              <TableCell className={`text-right font-mono ${result.portfolioReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {result.portfolioReturn >= 0 ? '+' : ''}{result.portfolioReturn.toFixed(2)}%
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableCell>
              <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                +{result.pitchPoints}
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableCell>
              <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                +{result.emotionPoints}
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
              </TableCell>
              <TableCell className="text-right font-mono text-xl font-bold" data-testid={`text-nav-after-${index}`}>
                {result.navAfter.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
