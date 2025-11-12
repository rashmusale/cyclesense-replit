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
import { AlertCircle, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import type { Team, GameState, Round, ColorCard } from "@shared/schema";
import logoUrl from "@assets/favicon.png";

interface TeamAllocationData {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  pitchScore: number;
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
          // Ensure values meet constraints: min 1%, gold/cash max 25%
          const equity = Math.max(1, team.initialEquity || 25);
          const debt = Math.max(1, team.initialDebt || 25);
          const gold = Math.max(1, Math.min(25, team.initialGold || 25));
          const cash = Math.max(1, Math.min(25, team.initialCash || 25));
          
          initialData[team.id] = {
            equity,
            debt,
            gold,
            cash,
            pitchScore: 0,
          };
        } else {
          // For Round 2+, find previous round's allocation
          const previousRoundNumber = currentRoundNum - 1;
          const previousRound = rounds.find(r => r.roundNumber === previousRoundNumber);
          const prevAllocation = previousRound 
            ? allAllocations.find(a => a.teamId === team.id && a.roundId === previousRound.id)
            : null;
          
          // Use previous allocation or fallback to team's initial allocations
          // Ensure values meet constraints: min 1%, gold/cash max 25%
          const equity = Math.max(1, prevAllocation?.equity || team.initialEquity || 25);
          const debt = Math.max(1, prevAllocation?.debt || team.initialDebt || 25);
          const gold = Math.max(1, Math.min(25, prevAllocation?.gold || team.initialGold || 25));
          const cash = Math.max(1, Math.min(25, prevAllocation?.cash || team.initialCash || 25));
          
          initialData[team.id] = {
            equity,
            debt,
            gold,
            cash,
            pitchScore: 0,
          };
        }
      });
      setTeamData(initialData);
    }
  }, [teams, rounds, allAllocations, currentRound?.id]);

  const updateTeamField = (teamId: string, field: keyof TeamAllocationData, value: number) => {
    setTeamData(prev => {
      const current = prev[teamId];
      let newValue = value;
      
      if (field === 'pitchScore') {
        newValue = Math.max(0, Math.min(5, value));
      } else if (field === 'gold' || field === 'cash') {
        // Gold and Cash: min 1%, max 25%
        newValue = Math.max(1, Math.min(25, value));
      } else if (field === 'equity' || field === 'debt') {
        // Equity and Debt: min 1%, max 100%
        newValue = Math.max(1, Math.min(100, value));
      }
      
      return {
        ...prev,
        [teamId]: {
          ...current,
          [field]: newValue
        }
      };
    });
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


  const isValidAllocation = (teamId: string) => {
    const data = teamData[teamId];
    if (!data) return false;
    
    const total = getAllocationTotal(teamId);
    
    // Must total 100%
    if (total !== 100) return false;
    
    // All allocations must be at least 1%
    if (data.equity < 1 || data.debt < 1 || data.gold < 1 || data.cash < 1) return false;
    
    // Gold and Cash cannot exceed 25%
    if (data.gold > 25 || data.cash > 25) return false;
    
    return true;
  };

  const allAllocationsValid = teams.every(team => isValidAllocation(team.id));

  const submitAllMutation = useMutation({
    mutationFn: async () => {
      if (!currentRound) throw new Error("No active round");
      
      // Validate all teams
      for (const team of teams) {
        const data = teamData[team.id];
        if (!data) {
          throw new Error(`${team.name} has no allocation data`);
        }
        
        const total = getAllocationTotal(team.id);
        
        if (total !== 100) {
          throw new Error(`${team.name} allocations must total 100% (currently ${total}%)`);
        }
        
        // All allocations must be at least 1%
        if (data.equity < 1 || data.debt < 1 || data.gold < 1 || data.cash < 1) {
          throw new Error(`${team.name} all allocations must be at least 1%`);
        }
        
        // Gold and Cash cannot exceed 25%
        if (data.gold > 25 || data.cash > 25) {
          throw new Error(`${team.name} gold and cash allocations cannot exceed 25%`);
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
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <img 
                src={logoUrl} 
                alt="CycleSense" 
                className="w-16 h-16 animate-spin-slow"
              />
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
            Enter allocations for all teams (must total 100%, minimum 1% each, max 25% for Gold & Cash)
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
                    <TableHead className="text-center w-[100px]">Gold % (max 25%)</TableHead>
                    <TableHead className="text-center w-[100px]">Cash % (max 25%)</TableHead>
                    <TableHead className="text-center w-[100px]">Pitch (0-5)</TableHead>
                    <TableHead className="text-center w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map(team => {
                    const defaultData = {
                      equity: 25,
                      debt: 25,
                      gold: 25,
                      cash: 25,
                      pitchScore: 0,
                    };
                    const data = teamData[team.id] || defaultData;
                    const total = getAllocationTotal(team.id);
                    const isValid = isValidAllocation(team.id);
                    const totalValid = total === 100;
                    const hasMinError = data.equity < 1 || data.debt < 1 || data.gold < 1 || data.cash < 1;
                    const hasMaxError = data.gold > 25 || data.cash > 25;

                    // Helper component for number input with steppers
                    const NumberInputWithSteppers = ({ 
                      value, 
                      onChange, 
                      min, 
                      max, 
                      field,
                      testId 
                    }: { 
                      value: number; 
                      onChange: (value: number) => void; 
                      min: number; 
                      max: number;
                      field: string;
                      testId: string;
                    }) => (
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min={min}
                          max={max}
                          value={value}
                          onChange={(e) => onChange(parseInt(e.target.value) || min)}
                          className="text-center font-mono pr-8"
                          data-testid={testId}
                        />
                        <div className="absolute right-1 flex flex-col">
                          <button
                            type="button"
                            onClick={() => onChange(Math.min(max, value + 1))}
                            className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-t-sm"
                            tabIndex={-1}
                            data-testid={`${testId}-increment`}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onChange(Math.max(min, value - 1))}
                            className="h-4 w-6 flex items-center justify-center hover:bg-accent rounded-b-sm border-t"
                            tabIndex={-1}
                            data-testid={`${testId}-decrement`}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );

                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-semibold">{team.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <NumberInputWithSteppers
                              value={data.equity}
                              onChange={(val) => updateTeamField(team.id, 'equity', val)}
                              min={1}
                              max={100}
                              field="equity"
                              testId={`input-equity-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.equity || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <NumberInputWithSteppers
                              value={data.debt}
                              onChange={(val) => updateTeamField(team.id, 'debt', val)}
                              min={1}
                              max={100}
                              field="debt"
                              testId={`input-debt-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.debt || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <NumberInputWithSteppers
                              value={data.gold}
                              onChange={(val) => updateTeamField(team.id, 'gold', val)}
                              min={1}
                              max={25}
                              field="gold"
                              testId={`input-gold-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.gold || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <NumberInputWithSteppers
                              value={data.cash}
                              onChange={(val) => updateTeamField(team.id, 'cash', val)}
                              min={1}
                              max={25}
                              field="cash"
                              testId={`input-cash-${team.id}`}
                            />
                            <div className="text-xs italic text-muted-foreground/60 text-center">
                              prev: {getPreviousAllocation(team.id)?.cash || 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <NumberInputWithSteppers
                              value={data.pitchScore}
                              onChange={(val) => updateTeamField(team.id, 'pitchScore', val)}
                              min={0}
                              max={5}
                              field="pitchScore"
                              testId={`input-pitch-${team.id}`}
                            />
                            <div className="text-xs italic text-transparent text-center select-none">
                              &nbsp;
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500 inline" data-testid={`status-valid-${team.id}`} />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <AlertCircle className="w-5 h-5 text-red-500" data-testid={`status-invalid-${team.id}`} />
                              {!totalValid && <span className="text-xs text-red-500">Total: {total}%</span>}
                              {totalValid && hasMinError && <span className="text-xs text-red-500">Min: 1%</span>}
                              {totalValid && hasMaxError && <span className="text-xs text-red-500">Max: 25%</span>}
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
