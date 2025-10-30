import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResetGameModal from "@/components/ResetGameModal";
import { Download, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const mockTeams = [
    { id: 1, name: 'Team Alpha', navCurrent: 15.75, pitchTotal: 12, emotionTotal: 8 },
    { id: 2, name: 'Team Beta', navCurrent: 14.20, pitchTotal: 10, emotionTotal: 11 },
    { id: 3, name: 'Team Gamma', navCurrent: 13.45, pitchTotal: 9, emotionTotal: 9 },
    { id: 4, name: 'Team Delta', navCurrent: 12.80, pitchTotal: 11, emotionTotal: 7 },
  ];

  const currentRound = 3;
  const avgNav = mockTeams.reduce((sum, team) => sum + team.navCurrent, 0) / mockTeams.length;
  const topTeam = [...mockTeams].sort((a, b) => b.navCurrent - a.navCurrent)[0];

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Downloading game data as CSV...",
    });
    console.log('Export CSV triggered');
  };

  const handleResetGame = (keepTeams: boolean) => {
    toast({
      title: "Game Reset",
      description: keepTeams ? "All rounds cleared. Teams preserved." : "All data cleared.",
    });
    console.log('Reset game, keep teams:', keepTeams);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentRound={currentRound}
        onNewRound={() => setLocation('/start-round')}
        onConfigureTeams={() => setLocation('/configure-teams')}
        onNewGame={() => setResetModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">Current Leaderboard</h2>
              <p className="text-muted-foreground">Round {currentRound} Complete</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExport}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Teams Playing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono" data-testid="text-teams-count">
                  {mockTeams.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Average NAV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono" data-testid="text-avg-nav">
                  {avgNav.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold" data-testid="text-top-team">
                  {topTeam.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  NAV: <span className="font-mono font-bold">{topTeam.navCurrent.toFixed(2)}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <LeaderboardTable teams={mockTeams} />
        </div>
      </main>

      <ResetGameModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        onConfirm={handleResetGame}
      />
    </div>
  );
}
