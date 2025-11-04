import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Trophy, TrendingUp, History, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Team, GameState, TeamAllocation, Round } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [endGameModalOpen, setEndGameModalOpen] = useState(false);

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allAllocations = [] } = useQuery<TeamAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const resetGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/reset", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "Game Reset",
        description: "All game data has been cleared. Redirecting to home...",
      });
      setResetModalOpen(false);
      setEndGameModalOpen(false);
      setLocation("/");
    },
  });


  const currentRound = gameState?.currentRound || 0;
  const hasStarted = gameState?.isActive || false;

  // Calculate ROI as (current NAV / 10) - 1
  const teamsWithReturns = teams
    .map(team => ({
      ...team,
      returnPct: ((parseFloat(team.currentNav) / 10) - 1) * 100
    }))
    .sort((a, b) => parseFloat(b.currentNav) - parseFloat(a.currentNav));

  // Build NAV progression data using round numbers
  const navProgressionData = () => {
    const data: any[] = [{ round: 0 }];
    teams.forEach(team => {
      data[0][team.name] = 10;
    });

    // Create a map from roundId (UUID) to roundNumber
    const roundIdToNumber = new Map<string, number>();
    rounds.forEach(round => {
      roundIdToNumber.set(round.id, round.roundNumber);
    });

    // Group allocations by round number (not roundId)
    const allocationsByRoundNumber = new Map<number, TeamAllocation[]>();
    allAllocations.forEach(alloc => {
      const roundNumber = roundIdToNumber.get(alloc.roundId);
      if (roundNumber !== undefined) {
        if (!allocationsByRoundNumber.has(roundNumber)) {
          allocationsByRoundNumber.set(roundNumber, []);
        }
        allocationsByRoundNumber.get(roundNumber)!.push(alloc);
      }
    });

    // Sort by round number and build chart data
    const sortedRoundNumbers = Array.from(allocationsByRoundNumber.keys()).sort((a, b) => a - b);
    sortedRoundNumbers.forEach(roundNumber => {
      const allocations = allocationsByRoundNumber.get(roundNumber)!;
      const roundData: any = { round: roundNumber };
      allocations.forEach(alloc => {
        const team = teams.find(t => t.id === alloc.teamId);
        if (team) {
          roundData[team.name] = parseFloat(alloc.navAfter);
        }
      });
      data.push(roundData);
    });

    return data;
  };

  const chartData = navProgressionData();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Downloading game data as CSV...",
    });
  };

  const getLatestAllocation = (teamId: string) => {
    // Create a map from roundId to roundNumber for sorting
    const roundIdToNumber = new Map<string, number>();
    rounds.forEach(round => {
      roundIdToNumber.set(round.id, round.roundNumber);
    });

    const teamAllocs = allAllocations
      .filter(a => a.teamId === teamId)
      .sort((a, b) => {
        const roundNumA = roundIdToNumber.get(a.roundId) || 0;
        const roundNumB = roundIdToNumber.get(b.roundId) || 0;
        return roundNumB - roundNumA; // Sort descending (latest first)
      });
    return teamAllocs[0] || null;
  };


  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to CycleSense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No active game. Start by setting up a new game.
            </p>
            <Button 
              onClick={() => setLocation('/game-setup')} 
              className="w-full"
              size="lg"
              data-testid="button-new-game"
            >
              New Game
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/manage-cards')} 
              className="w-full"
              data-testid="button-manage-cards-home"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-2">Leaderboard</h2>
              <p className="text-muted-foreground">
                {currentRound === 0 ? "No rounds completed yet" : `Round ${currentRound} Complete`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/manage-cards')}
                data-testid="button-manage-cards"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Cards
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setResetModalOpen(true)}
                data-testid="button-reset-game"
              >
                Reset Game
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setEndGameModalOpen(true)}
                data-testid="button-end-game"
              >
                End Game
              </Button>
              {currentRound > 0 && (
                <Button 
                  onClick={() => setLocation('/start-round')}
                  data-testid="button-next-round"
                >
                  Start Round {currentRound + 1}
                </Button>
              )}
              {currentRound === 0 && (
                <Button 
                  onClick={() => setLocation('/start-round')}
                  data-testid="button-start-first-round"
                >
                  Start First Round
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="allocations" data-testid="tab-allocations">
                Current Allocations
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <History className="w-4 h-4 mr-2" />
                Historical Allocations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              {chartData.length > 1 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      NAV Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="round" 
                          label={{ value: 'Round', position: 'insideBottom', offset: -5 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          label={{ value: 'NAV', angle: -90, position: 'insideLeft' }}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        {teams.map((team, idx) => {
                          const colors = ['#F97316', '#2563EB', '#16A34A', '#DC2626', '#8B5CF6', '#EAB308'];
                          const color = colors[idx % colors.length];
                          return (
                            <Line 
                              key={team.id}
                              type="monotone" 
                              dataKey={team.name} 
                              stroke={color} 
                              strokeWidth={2} 
                              dot={{ fill: color, r: 4 }} 
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2563EB]/10 via-[#16A34A]/10 to-[#F97316]/10">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Rank</th>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Team</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">Current NAV</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">ROI %</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">Pitch Total</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">Emotion Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsWithReturns.map((team, idx) => (
                        <tr key={team.id} className="border-t hover-elevate" data-testid={`row-team-${team.id}`}>
                          <td className="p-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold text-primary">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-lg">{team.name}</td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-bold text-2xl">{team.currentNav}</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-mono font-semibold ${team.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {team.returnPct >= 0 ? '+' : ''}{team.returnPct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono">{team.pitchTotal}</td>
                          <td className="p-4 text-right font-mono">{team.emotionTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="allocations">
              <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2563EB]/10 via-[#16A34A]/10 to-[#F97316]/10">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Team</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Equity</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#DC2626]">Debt</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#F97316]">Gold</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#16A34A]">Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => {
                        const latestAlloc = getLatestAllocation(team.id);
                        return (
                          <tr key={team.id} className="border-t hover-elevate" data-testid={`row-allocation-${team.id}`}>
                            <td className="p-4 font-semibold">{team.name}</td>
                            <td className="p-4 text-right">
                              <span className="font-mono font-semibold text-[#2563EB]">
                                {latestAlloc ? latestAlloc.equity : 0}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-mono font-semibold text-[#DC2626]">
                                {latestAlloc ? latestAlloc.debt : 0}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-mono font-semibold text-[#F97316]">
                                {latestAlloc ? latestAlloc.gold : 0}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-mono font-semibold text-[#16A34A]">
                                {latestAlloc ? latestAlloc.cash : 0}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2563EB]/10 via-[#16A34A]/10 to-[#F97316]/10">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Round</th>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Team</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Equity %</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#DC2626]">Debt %</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#F97316]">Gold %</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#16A34A]">Cash %</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">Pitch Score</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide">Emotion Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Create a map from roundId to roundNumber
                        const roundIdToNumber = new Map<string, number>();
                        rounds.forEach(round => {
                          roundIdToNumber.set(round.id, round.roundNumber);
                        });

                        // Sort allocations by round number then team name
                        const sortedAllocations = [...allAllocations].sort((a, b) => {
                          const roundNumA = roundIdToNumber.get(a.roundId) || 0;
                          const roundNumB = roundIdToNumber.get(b.roundId) || 0;
                          if (roundNumA !== roundNumB) {
                            return roundNumA - roundNumB;
                          }
                          const teamA = teams.find(t => t.id === a.teamId);
                          const teamB = teams.find(t => t.id === b.teamId);
                          return (teamA?.name || '').localeCompare(teamB?.name || '');
                        });

                        return sortedAllocations.map((alloc) => {
                          const team = teams.find(t => t.id === alloc.teamId);
                          const roundNumber = roundIdToNumber.get(alloc.roundId);
                          
                          return (
                            <tr key={alloc.id} className="border-t hover-elevate" data-testid={`row-history-${alloc.id}`}>
                              <td className="p-4 font-semibold">{roundNumber}</td>
                              <td className="p-4">{team?.name || 'Unknown'}</td>
                              <td className="p-4 text-right">
                                <span className="font-mono text-[#2563EB]">{alloc.equity}%</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono text-[#DC2626]">{alloc.debt}%</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono text-[#F97316]">{alloc.gold}%</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono text-[#16A34A]">{alloc.cash}%</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono">{alloc.pitchScore}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono">{alloc.emotionScore}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all rounds, allocations, and reset team scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => resetGameMutation.mutate()}
              data-testid="button-confirm-reset"
            >
              Reset Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endGameModalOpen} onOpenChange={setEndGameModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current game and reset all data including rounds, allocations, and team scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-game">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => resetGameMutation.mutate()}
              data-testid="button-confirm-end-game"
            >
              End Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
