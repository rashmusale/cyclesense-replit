import { useLocation } from "wouter";
import Header from "@/components/Header";
import PhaseBadge from "@/components/PhaseBadge";
import RoundSummaryTable from "@/components/RoundSummaryTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function RoundSummary() {
  const [, setLocation] = useLocation();

  const mockResults = [
    {
      teamName: 'Team Alpha',
      navBefore: 12.50,
      portfolioReturn: 2.5,
      pitchPoints: 4,
      emotionPoints: 3,
      navAfter: 15.81,
    },
    {
      teamName: 'Team Beta',
      navBefore: 11.00,
      portfolioReturn: 1.8,
      pitchPoints: 3,
      emotionPoints: 4,
      navAfter: 14.20,
    },
  ];

  const roundNumber = 3;
  const phase = 'BLUE';
  const scenarioCode = 'B4';
  const blackCard = 'W2';
  const timestamp = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-background">
      <Header currentRound={roundNumber} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-6">Round {roundNumber} Summary</h2>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-4 flex-wrap">
                <span>Round Details</span>
                <div className="flex items-center gap-2">
                  <PhaseBadge phase={phase as any} />
                  <span className="font-mono text-xl">{scenarioCode}</span>
                  {blackCard && (
                    <>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1 rounded-md text-sm font-medium bg-card border border-card-border">
                        Black Card: {blackCard}
                      </span>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span data-testid="text-timestamp">{timestamp}</span>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-4">Team Results</h3>
            <RoundSummaryTable results={mockResults} />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/start-round')}
              data-testid="button-start-another-round"
            >
              Start Another Round
            </Button>
            <Button
              onClick={() => setLocation('/')}
              size="lg"
              data-testid="button-view-leaderboard"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
