import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EyeOff } from "lucide-react";
import type { Team, GameState, Round, ColorCard, TeamAllocation } from "@shared/schema";

export default function TeamInput() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [equity, setEquity] = useState(25);
  const [debt, setDebt] = useState(25);
  const [gold, setGold] = useState(25);
  const [cash, setCash] = useState(25);
  const [pitchScore, setPitchScore] = useState(0);
  const [emotionScore, setEmotionScore] = useState(0);

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const currentRound = rounds.find(r => r.roundNumber === gameState?.currentRound);
  
  const { data: colorCard } = useQuery<ColorCard>({
    queryKey: ["/api/color-cards", currentRound?.colorCardId],
    enabled: !!currentRound?.colorCardId,
  });

  const { data: allocations = [] } = useQuery<TeamAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  const roundAllocations = allocations.filter((a: TeamAllocation) => a.roundId === currentRound?.id);

  const allocationTotal = equity + debt + gold + cash;

  const submitAllocationMutation = useMutation({
    mutationFn: async (teamId: string) => {
      if (allocationTotal !== 100) {
        throw new Error("Allocations must total 100%");
      }

      const res = await apiRequest("POST", "/api/allocations", {
        teamId,
        roundId: currentRound?.id,
        equity,
        debt,
        gold,
        cash,
        pitchScore,
        emotionScore
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "Allocation Submitted",
        description: "Portfolio allocation has been recorded",
      });
      // Stay on page - facilitator will navigate to results when all teams done
      // In practice teams might submit via different devices
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSliderChange = (asset: string, value: number) => {
    const newValue = Math.max(0, Math.min(100, value));
    
    if (asset === "equity") setEquity(newValue);
    else if (asset === "debt") setDebt(newValue);
    else if (asset === "gold") setGold(newValue);
    else if (asset === "cash") setCash(newValue);
  };


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
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Portfolio Allocation - Round {currentRound.roundNumber}</h1>
          <p className="text-muted-foreground">Enter your team's asset allocation (must total 100%)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Asset Returns</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span>Hidden until scores computed</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded bg-[#2563EB]/10">
                  <span className="font-medium text-[#2563EB]">Equity</span>
                  <span className="font-mono font-bold text-[#2563EB]" data-testid="text-equity-return">
                    ???
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#DC2626]/10">
                  <span className="font-medium text-[#DC2626]">Debt</span>
                  <span className="font-mono font-bold text-[#DC2626]" data-testid="text-debt-return">
                    ???
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F97316]/10">
                  <span className="font-medium text-[#F97316]">Gold</span>
                  <span className="font-mono font-bold text-[#F97316]" data-testid="text-gold-return">
                    ???
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#16A34A]/10">
                  <span className="font-medium text-[#16A34A]">Cash</span>
                  <span className="font-mono font-bold text-[#16A34A]" data-testid="text-cash-return">
                    ???
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Equity", value: equity, setter: setEquity, color: "#2563EB" },
                  { name: "Debt", value: debt, setter: setDebt, color: "#DC2626" },
                  { name: "Gold", value: gold, setter: setGold, color: "#F97316" },
                  { name: "Cash", value: cash, setter: setCash, color: "#16A34A" }
                ].map(asset => (
                  <div key={asset.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={asset.name.toLowerCase()}>{asset.name}</Label>
                      <span className="font-mono font-bold" style={{ color: asset.color }}>
                        {asset.value}%
                      </span>
                    </div>
                    <Input
                      id={asset.name.toLowerCase()}
                      type="number"
                      min="0"
                      max="100"
                      value={asset.value}
                      onChange={(e) => handleSliderChange(asset.name.toLowerCase(), parseInt(e.target.value) || 0)}
                      data-testid={`input-${asset.name.toLowerCase()}`}
                    />
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className={allocationTotal === 100 ? "text-green-600" : "text-red-600"} data-testid="text-total">
                      {allocationTotal}%
                    </span>
                  </div>
                  {allocationTotal !== 100 && (
                    <p className="text-sm text-red-600 mt-1">Allocations must total 100%</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scoring (Facilitator)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pitch-score">Pitch Score (0-5)</Label>
                <Input
                  id="pitch-score"
                  type="number"
                  min="0"
                  max="5"
                  value={pitchScore}
                  onChange={(e) => setPitchScore(parseInt(e.target.value) || 0)}
                  data-testid="input-pitch-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emotion-score">Emotion Score (0-5)</Label>
                <Input
                  id="emotion-score"
                  type="number"
                  min="0"
                  max="5"
                  value={emotionScore}
                  onChange={(e) => setEmotionScore(parseInt(e.target.value) || 0)}
                  data-testid="input-emotion-score"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Team Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {teams.map(team => {
                const hasAllocation = roundAllocations.some(a => a.teamId === team.id);
                return (
                  <Button
                    key={team.id}
                    onClick={() => submitAllocationMutation.mutate(team.id)}
                    disabled={allocationTotal !== 100 || submitAllocationMutation.isPending}
                    variant={hasAllocation ? "secondary" : "outline"}
                    className="justify-start h-auto py-4"
                    data-testid={`button-submit-team-${team.id}`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{team.name}</span>
                        {hasAllocation && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">✓ Submitted</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">Current NAV: {team.currentNav}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {roundAllocations.length === teams.length && teams.length > 0 && (
          <Card className="border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">All teams have submitted their allocations!</p>
                  <p className="text-sm text-muted-foreground">Proceed to compute scores and reveal returns</p>
                </div>
                <Button
                  onClick={() => setLocation(`/round-summary?roundId=${currentRound.id}`)}
                  size="lg"
                  data-testid="button-compute-scores"
                >
                  Compute Scores
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
