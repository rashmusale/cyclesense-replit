import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Trophy, TrendingUp, History, CreditCard, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Team, GameState, TeamAllocation, Round } from "@shared/schema";
import logoUrl from "@assets/CycleSense LOGO_1761839230730.png";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [endGameModalOpen, setEndGameModalOpen] = useState(false);
  const [gameRulesOpen, setGameRulesOpen] = useState(false);

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
      // Reset all queries to initial state to force Dashboard to show welcome screen
      queryClient.resetQueries({ queryKey: ["/api/teams"] });
      queryClient.resetQueries({ queryKey: ["/api/game-state"] });
      queryClient.resetQueries({ queryKey: ["/api/rounds"] });
      queryClient.resetQueries({ queryKey: ["/api/allocations"] });
      
      toast({
        title: "Game Ended",
        description: "Game data exported and cleared.",
      });
      setEndGameModalOpen(false);
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
    // Build CSV content
    const rows: string[] = [];
    
    // Header
    rows.push("Round,Team,Equity %,Debt %,Gold %,Cash %,Pitch Score,Emotion Score,NAV Before,NAV After");
    
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
    
    // Add data rows
    sortedAllocations.forEach(alloc => {
      const team = teams.find(t => t.id === alloc.teamId);
      const roundNumber = roundIdToNumber.get(alloc.roundId) || 0;
      rows.push(
        `${roundNumber},${team?.name || 'Unknown'},${alloc.equity},${alloc.debt},${alloc.gold},${alloc.cash},${alloc.pitchScore},${alloc.emotionScore},${alloc.navBefore},${alloc.navAfter}`
      );
    });
    
    // Create blob and download
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cyclesense-game-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Game data downloaded as CSV.",
    });
  };

  const handleEndGame = () => {
    // Export CSV first
    handleExport();
    
    // Then reset game after a brief delay to ensure export completes
    setTimeout(() => {
      resetGameMutation.mutate();
    }, 500);
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
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-2xl">
            <div className="flex justify-center mb-12">
              <img src={logoUrl} alt="CycleSense" className="w-96 h-96" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/game-setup')} 
                size="lg"
                className="px-8"
                data-testid="button-new-game"
              >
                New Game
              </Button>
              <Button 
                variant="outline"
                onClick={() => setGameRulesOpen(true)} 
                size="lg"
                className="px-8"
                data-testid="button-game-rules"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Game Rules
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/manage-cards')} 
                size="lg"
                className="px-8"
                data-testid="button-manage-cards-home"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Cards
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={gameRulesOpen} onOpenChange={setGameRulesOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold">CycleSense Game Rules</DialogTitle>
              <DialogDescription className="text-lg italic">
                A Game of Markets, Mindsets & Momentum
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              <div className="bg-accent/20 p-4 rounded-md border-l-4 border-primary">
                <p className="font-semibold text-lg">Markets move in cycles. Investors move in emotions. Winners move with sense.</p>
                <p className="mt-2 text-muted-foreground">
                  Cycle Sense helps in experiencing how portfolios and mindsets behave through real market phases. Players play as fund managers navigating expansion, slowdown, crisis, and recovery, just like real markets.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-xl border-b pb-2">Your Mission</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Manage ₹100 Cr across Equity, Debt, Gold & Cash</li>
                    <li>Read the scene, sense the cycle, make your call and justify it</li>
                    <li>Every round tests your logic and your temperament</li>
                    <li>Team with highest NAV wins</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-xl border-b pb-2">Game Components</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">Rolling Die:</p>
                      <p className="text-muted-foreground">Decides which colour deck is played each round</p>
                    </div>
                    <div>
                      <p className="font-semibold">Portfolio Card:</p>
                      <p className="text-muted-foreground">4 boxes for Equity, Debt, Gold, Cash where teams place tokens</p>
                    </div>
                    <div>
                      <p className="font-semibold">Color Decks:</p>
                      <ul className="list-disc list-inside text-muted-foreground ml-2">
                        <li>🟢 Green – Early Recovery</li>
                        <li>🔵 Blue – Expansion</li>
                        <li>🟠 Orange – Slowdown/Stress</li>
                        <li>🔴 Red – Crisis/Reset</li>
                        <li>⚫ Black – Shocks/Twists</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Tokens:</p>
                      <p className="text-muted-foreground">20 per team. Used for allocations.</p>
                    </div>
                    <div>
                      <p className="font-semibold">Emotion Tokens:</p>
                      <p className="text-muted-foreground">Confidence, Discipline, Patience, Conviction, Adaptability</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-xl border-b pb-2">Round Flow</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Facilitator rolls the die to choose the deck/phase color (green/blue/orange/red)</li>
                    <li>Facilitator picks top card from the chosen color deck & reads it aloud</li>
                    <li>Each team decides on rebalance (0-20%) and picks one emotion token</li>
                    <li>One by one each team is asked to pitch allocation (1 min)</li>
                    <li>Facilitator scores Pitch (0–5) + Emotion (0–5)</li>
                    <li>Facilitator shows market results → NAV updated on tracker</li>
                    <li>Facilitator draws a Black Card. No allocation change allowed. NAV updated.</li>
                    <li>Leaderboard revealed</li>
                  </ol>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-xl border-b pb-2">Game Setup</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Minimum 2 teams, each with 2–5 players</li>
                    <li>Each team manages ₹100 Cr (20 tokens of ₹5 Cr each)</li>
                    <li>Each team receives one Portfolio Card with 4 asset classes - Equity, Debt, Gold, Cash</li>
                    <li>Each team gets 5 Emotion Tokens - Confidence, Discipline, Patience, Conviction, Adaptability</li>
                    <li>Starting NAV = ₹10</li>
                    <li>Starting Allocation: Teams allocate their ₹100 Cr based on how they view the market today</li>
                    <li>The Facilitator is the Market - runs each round, reveals scenarios, and drives outcomes</li>
                    <li>The number of rounds will be decided by the facilitator depending on time and flow</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-xl border-b pb-2">Scoring System</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">1. Pitch (0–5 points):</p>
                      <p className="text-muted-foreground">Strength of reasoning & story</p>
                    </div>
                    <div>
                      <p className="font-semibold">2. Emotion (0–5 points):</p>
                      <p className="text-muted-foreground">Choice of emotion token</p>
                    </div>
                    <div>
                      <p className="font-semibold">3. Portfolio Returns:</p>
                      <p className="text-muted-foreground">Based on market outcome</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="font-semibold mb-1">NAV Formula:</p>
                      <p className="font-mono text-xs">New NAV = Old NAV × (1 + Portfolio Return) + Pitch + Emotion</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-6 rounded-md text-center border-2 border-primary/30">
                <p className="text-2xl font-bold italic">"It's not about guessing markets. It's about sensing them."</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
                onClick={handleExport}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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

      <AlertDialog open={endGameModalOpen} onOpenChange={setEndGameModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will download the game data as CSV, then reset all data including rounds, allocations, and team scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-game">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndGame}
              data-testid="button-confirm-end-game"
            >
              End Game & Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
