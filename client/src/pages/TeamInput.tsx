import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { storageService } from "@/lib/storage";
import { createTeamAllocationWithNav } from "@/lib/game-logic";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { Team, GameState, Round, ColorCard } from "@shared/schema";

interface TeamAllocationData {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  pitchScore: number;
  emotionScore: number;
}

interface TeamAllocation {
  id: string;
  teamId: string;
  roundId: string;
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  pitchScore: number;
  emotionScore: number;
  navBefore: string;
  navAfter: string;
}

export default function TeamInput() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State: object keyed by teamId
  const [teamData, setTeamData] = useState<Record<string, TeamAllocationData>>({});

  const { data: gameState } = useQuery<GameState | undefined>({
    queryKey: ["gameState"],
    queryFn: () => storageService.getGameState(),
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: () => storageService.getAllTeams(),
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["rounds"],
    queryFn: () => storageService.getAllRounds(),
  });

  const { data: allAllocations = [] } = useQuery<TeamAllocation[]>({
    queryKey: ["allocations"],
    queryFn: async () => {
      const rounds = await storageService.getAllRounds();
      const allAllocs: TeamAllocation[] = [];
      for (const round of rounds) {
        const roundAllocs = await storageService.getAllocationsForRound(round.id);
        allAllocs.push(...roundAllocs);
      }
      return allAllocs;
    },
  });

  const currentRound = rounds.find(r => r.roundNumber === gameState?.currentRound);
  
  const { data: colorCard } = useQuery<ColorCard | undefined>({
    queryKey: ["colorCard", currentRound?.colorCardId],
    queryFn: () => currentRound?.colorCardId ? storageService.getColorCard(currentRound.colorCardId) : Promise.resolve(undefined),
    enabled: !!currentRound?.colorCardId,
  });

  // Initialize team data with previous round allocations or initial allocations from game setup
  useEffect(() => {
    if (teams.length > 0 && currentRound) {
      const initialData: Record<string, TeamAllocationData> = {};
      
      const currentRoundNum = currentRound.roundNumber;
      
      teams.forEach(team => {
        if (currentRoundNum === 1) {
          // For Round 1, use the team's initial allocations from game setup
          initialData[team.id] = {
            equity: team.initialEquity || 25,
            debt: team.initialDebt || 25,
            gold: team.initialGold || 25,
            cash: team.initialCash || 25,
            pitchScore: 0,
            emotionScore: 0,
          };
        } else {
          // For Round 2+, find previous round's allocation
          const previousRoundNumber = currentRoundNum - 1;
          const previousRound = rounds.find(r => r.roundNumber === previousRoundNumber);
          const prevAllocation = previousRound 
            ? allAllocations.find(a => a.teamId === team.id && a.roundId === previousRound.id)
            : null;
          
          // Use previous allocation or fallback to team's initial allocations
          initialData[team.id] = {
            equity: prevAllocation?.equity || team.initialEquity || 25,
            debt: prevAllocation?.debt || team.initialDebt || 25,
            gold: prevAllocation?.gold || team.initialGold || 25,
            cash: prevAllocation?.cash || team.initialCash || 25,
            pitchScore: 0,
            emotionScore: 0,
          };
        }
      });
      setTeamData(initialData);
    }
  }, [teams, rounds, allAllocations, currentRound?.id]);

  const updateTeamField = (teamId: string, field: keyof TeamAllocationData, value: number) => {
    setTeamData(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: Math.max(0, field === 'pitchScore' || field === 'emotionScore' ? Math.min(5, value) : Math.min(100, value))
      }
    }));
  };

  const getAllocationTotal = (teamId: string) => {
    const data = teamData[teamId];
    if (!data) return 0;
    return data.equity + data.debt + data.gold + data.cash;
  };

  // Get previous round's allocation for a team
  const getPreviousAllocation = (teamId: string) => {
    const currentRoundNum = currentRound?.roundNumber || 1;
    
    if (currentRoundNum === 1) {
      // For Round 1, use team's initial allocations
      const team = teams.find(t => t.id === teamId);
      return team ? {
        equity: team.initialEquity || 25,
        debt: team.initialDebt || 25,
        gold: team.initialGold || 25,
        cash: team.initialCash || 25,
      } : null;
    } else {
      // For Round 2+, find previous round's allocation
      const previousRoundNumber = currentRoundNum - 1;
      const previousRound = rounds.find(r => r.roundNumber === previousRoundNumber);
      const prevAllocation = previousRound 
        ? allAllocations.find(a => a.teamId === teamId && a.roundId === previousRound.id)
        : null;
      
      if (prevAllocation) {
        return {
          equity: prevAllocation.equity,
          debt: prevAllocation.debt,
          gold: prevAllocation.gold,
          cash: prevAllocation.cash,
        };
      }
      
      // Fallback to team's initial allocations
      const team = teams.find(t => t.id === teamId);
      return team ? {
        equity: team.initialEquity || 25,
        debt: team.initialDebt || 25,
        gold: team.initialGold || 25,
        cash: team.initialCash || 25,
      } : null;
    }
  };

  // Calculate total portfolio change (sum of absolute differences)
  const getTotalPortfolioChange = (teamId: string) => {
    const currentData = teamData[teamId];
    const previousData = getPreviousAllocation(teamId);
    
    if (!currentData || !previousData) return 0;
    
    const equityChange = Math.abs(currentData.equity - previousData.equity);
    const debtChange = Math.abs(currentData.debt - previousData.debt);
    const goldChange = Math.abs(currentData.gold - previousData.gold);
    const cashChange = Math.abs(currentData.cash - previousData.cash);
    
    return equityChange + debtChange + goldChange + cashChange;
  };

  const isValidAllocation = (teamId: string) => {
    const total = getAllocationTotal(teamId);
    const change = getTotalPortfolioChange(teamId);
    
    // Must total 100%
    if (total !== 100) return false;
    
    // For Round 2+, total change cannot exceed 20%
    const currentRoundNum = currentRound?.roundNumber || 1;
    if (currentRoundNum > 1 && change > 20) return false;
    
    return true;
  };

  const allAllocationsValid = teams.every(team => isValidAllocation(team.id));

  const submitAllMutation = useMutation({
    mutationFn: async () => {
      if (!currentRound) throw new Error("No active round");
      
      // Validate all teams
      for (const team of teams) {
        const total = getAllocationTotal(team.id);
        const change = getTotalPortfolioChange(team.id);
        
        if (total !== 100) {
          throw new Error(`${team.name} allocations must total 100% (currently ${total}%)`);
        }
        
        if (currentRound.roundNumber > 1 && change > 20) {
          throw new Error(`${team.name} portfolio change (${change.toFixed(1)}%) exceeds 20% limit`);
        }
      }

      // Submit all teams sequentially
      const promises = teams.map(team => {
        const data = teamData[team.id];
        return createTeamAllocationWithNav({
          teamId: team.id,
          roundId: currentRound.id,
          equity: data.equity,
          debt: data.debt,
          gold: data.gold,
          cash: data.cash,
          pitchScore: data.pitchScore,
          emotionScore: data.emotionScore,
        });
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast({
        title: "All Allocations Submitted",
        description: "Navigating to results...",
      });
      // Navigate to round summary
      setLocation(`/round-summary?roundId=${currentRound?.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!currentRound || !colorCard) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No active round. Please start a round first.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Round {currentRound.roundNumber} - Team Allocations</h1>
          <p className="text-muted-foreground">
            Enter allocations for all teams (must total 100%
            {currentRound.roundNumber > 1 && ", max 20% total portfolio change from previous round"})
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Market Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="font-mono text-lg font-semibold">{colorCard.cardNumber}</div>
              <div className="text-base">{colorCard.cardText}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Allocations & Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Team Name</TableHead>
                    <TableHead className="text-center w-[100px]">Equity %</TableHead>
                    <TableHead className="text-center w-[100px]">Debt %</TableHead>
                    <TableHead className="text-center w-[100px]">Gold %</TableHead>
                    <TableHead className="text-center w-[100px]">Cash %</TableHead>
                    <TableHead className="text-center w-[100px]">Pitch (0-5)</TableHead>
                    <TableHead className="text-center w-[100px]">Emotion (0-5)</TableHead>
                    <TableHead className="text-center w-[90px]">Change %</TableHead>
                    <TableHead className="text-center w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map(team => {
                    const data = teamData[team.id] || {
                      equity: 25,
                      debt: 25,
                      gold: 25,
                      cash: 25,
                      pitchScore: 0,
                      emotionScore: 0,
                    };
                    const total = getAllocationTotal(team.id);
                    const change = getTotalPortfolioChange(team.id);
                    const isValid = isValidAllocation(team.id);
                    const totalValid = total === 100;
                    const changeValid = currentRound.roundNumber === 1 || change <= 20;

                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-semibold">{team.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={data.equity}
                              onChange={(e) => updateTeamField(team.id, 'equity', parseInt(e.target.value) || 0)}
                              className="text-center font-mono"
                              data-testid={`input-equity-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.equity || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={data.debt}
                              onChange={(e) => updateTeamField(team.id, 'debt', parseInt(e.target.value) || 0)}
                              className="text-center font-mono"
                              data-testid={`input-debt-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.debt || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={data.gold}
                              onChange={(e) => updateTeamField(team.id, 'gold', parseInt(e.target.value) || 0)}
                              className="text-center font-mono"
                              data-testid={`input-gold-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.gold || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={data.cash}
                              onChange={(e) => updateTeamField(team.id, 'cash', parseInt(e.target.value) || 0)}
                              className="text-center font-mono"
                              data-testid={`input-cash-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.cash || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              value={data.pitchScore}
                              onChange={(e) => updateTeamField(team.id, 'pitchScore', parseInt(e.target.value) || 0)}
                              className="text-center font-mono bg-accent/30"
                              data-testid={`input-pitch-${team.id}`}
                            />
                            <div className="text-xs italic text-transparent text-center select-none">
                              &nbsp;
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              value={data.emotionScore}
                              onChange={(e) => updateTeamField(team.id, 'emotionScore', parseInt(e.target.value) || 0)}
                              className="text-center font-mono bg-accent/30"
                              data-testid={`input-emotion-${team.id}`}
                            />
                            <div className="text-xs italic text-transparent text-center select-none">
                              &nbsp;
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-mono text-sm ${changeValid ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-change-${team.id}`}>
                            {change.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500 inline" data-testid={`status-valid-${team.id}`} />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <AlertCircle className="w-5 h-5 text-red-500" data-testid={`status-invalid-${team.id}`} />
                              {!totalValid && <span className="text-xs text-red-500">Total: {total}%</span>}
                              {totalValid && !changeValid && <span className="text-xs text-red-500">Change: {change.toFixed(1)}%</span>}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={() => submitAllMutation.mutate()}
            disabled={!allAllocationsValid || submitAllMutation.isPending}
            size="lg"
            data-testid="button-submit-compute"
          >
            {submitAllMutation.isPending ? "Submitting..." : "Submit All & Compute Scores"}
          </Button>
        </div>
      </div>
    </div>
  );
}
