import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Header from "@/components/Header";
import PhaseBadge from "@/components/PhaseBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Round, ColorCard, BlackCard, Team, TeamAllocation } from "@shared/schema";
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

export default function RoundSummary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const roundId = params.get('roundId');

  const [returnsRevealed, setReturnsRevealed] = useState(false);
  const [blackCardDialogOpen, setBlackCardDialogOpen] = useState(false);
  const [selectedBlackCard, setSelectedBlackCard] = useState<BlackCard | null>(null);

  const { data: round } = useQuery<Round>({
    queryKey: ["/api/rounds", roundId],
    enabled: !!roundId,
  });

  const { data: colorCard } = useQuery<ColorCard>({
    queryKey: ["/api/color-cards", round?.colorCardId],
    enabled: !!round?.colorCardId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allocations = [] } = useQuery<TeamAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: blackCards = [] } = useQuery<BlackCard[]>({
    queryKey: ["/api/black-cards"],
  });

  // Get latest allocation for each team (before this round)
  const getLatestAllocation = (teamId: number) => {
    const teamAllocs = allocations
      .filter(a => a.teamId === teamId && a.roundId !== roundId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    
    return teamAllocs[0] || {
      teamId,
      equityPct: 25,
      debtPct: 25,
      goldPct: 25,
      cashPct: 25,
      navAfter: "10.00"
    };
  };

  // Auto-calculate NAV for all teams
  const autoCalculateMutation = useMutation({
    mutationFn: async () => {
      const promises = teams.map(async (team) => {
        const latestAlloc = getLatestAllocation(team.id);
        
        const res = await apiRequest("POST", "/api/allocations", {
          teamId: team.id,
          roundId,
          equityPct: latestAlloc.equityPct,
          debtPct: latestAlloc.debtPct,
          goldPct: latestAlloc.goldPct,
          cashPct: latestAlloc.cashPct,
          pitchScore: 0,
          emotionScore: 0,
        });
        return await res.json();
      });
      
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "NAV Calculated",
        description: "All team NAVs have been updated",
      });
      setReturnsRevealed(true);
    },
  });

  // Auto-run calculation on mount
  useEffect(() => {
    if (round && colorCard && teams.length > 0 && !returnsRevealed) {
      autoCalculateMutation.mutate();
    }
  }, [round, colorCard, teams.length]);

  const applyBlackCardMutation = useMutation({
    mutationFn: async (blackCardId: number) => {
      // Update round with black card
      const res = await apiRequest("PATCH", `/api/rounds/${roundId}`, {
        blackCardId,
      });
      
      // Recalculate all team NAVs with black card applied
      const promises = teams.map(async (team) => {
        const latestAlloc = getLatestAllocation(team.id);
        
        const res = await apiRequest("POST", "/api/allocations", {
          teamId: team.id,
          roundId,
          equityPct: latestAlloc.equityPct,
          debtPct: latestAlloc.debtPct,
          goldPct: latestAlloc.goldPct,
          cashPct: latestAlloc.cashPct,
          pitchScore: 0,
          emotionScore: 0,
        });
        return await res.json();
      });
      
      await Promise.all(promises);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "Black Card Applied",
        description: "NAVs recalculated with black card effects",
      });
      setBlackCardDialogOpen(false);
    },
  });

  const handleBlackCardReveal = (card: BlackCard) => {
    setSelectedBlackCard(card);
    applyBlackCardMutation.mutate(card.id);
  };

  // Get this round's allocations
  const roundAllocations = allocations.filter(a => a.roundId === roundId);

  if (!round || !colorCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground">Loading round data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Round {round.roundNumber} - Virtual Mode</h1>
          <p className="text-muted-foreground">
            Automatic NAV calculation using existing allocations
          </p>
        </div>

        {/* Round Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Round Details</CardTitle>
              <PhaseBadge phase={round.phase.toUpperCase() as any} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Card Number</div>
                <div className="font-mono font-semibold">{colorCard.cardNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Market Event</div>
                <div className="text-base">{colorCard.cardText}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NAV Calculation Status */}
        {autoCalculateMutation.isPending && (
          <Card className="mb-6 border-primary">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div>
                  <p className="font-semibold">Calculating NAVs...</p>
                  <p className="text-sm text-muted-foreground">Applying color card returns to existing allocations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team NAV Results */}
        {returnsRevealed && roundAllocations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Team NAV Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.map(team => {
                  const allocation = roundAllocations.find(a => a.teamId === team.id);
                  if (!allocation) return null;
                  
                  const navBefore = parseFloat(allocation.navBefore);
                  const navAfter = parseFloat(allocation.navAfter);
                  const change = navAfter - navBefore;
                  const changePct = ((navAfter / navBefore) - 1) * 100;

                  return (
                    <div key={team.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div>
                        <div className="font-semibold text-lg">{team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Allocation: E{allocation.equityPct}% D{allocation.debtPct}% G{allocation.goldPct}% C{allocation.cashPct}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{navAfter.toFixed(2)}</div>
                        <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Returns Reveal */}
        {returnsRevealed && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <CardTitle>Asset Returns Revealed</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded bg-[#2563EB]/10">
                  <span className="text-sm font-medium text-[#2563EB] mb-1">Equity</span>
                  <span className="font-mono font-bold text-2xl text-[#2563EB]">
                    {parseFloat(colorCard.equityReturn) > 0 ? "+" : ""}{colorCard.equityReturn}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-[#DC2626]/10">
                  <span className="text-sm font-medium text-[#DC2626] mb-1">Debt</span>
                  <span className="font-mono font-bold text-2xl text-[#DC2626]">
                    {parseFloat(colorCard.debtReturn) > 0 ? "+" : ""}{colorCard.debtReturn}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-[#F97316]/10">
                  <span className="text-sm font-medium text-[#F97316] mb-1">Gold</span>
                  <span className="font-mono font-bold text-2xl text-[#F97316]">
                    {parseFloat(colorCard.goldReturn) > 0 ? "+" : ""}{colorCard.goldReturn}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-[#16A34A]/10">
                  <span className="text-sm font-medium text-[#16A34A] mb-1">Cash</span>
                  <span className="font-mono font-bold text-2xl text-[#16A34A]">
                    {parseFloat(colorCard.cashReturn) > 0 ? "+" : ""}{colorCard.cashReturn}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Black Card Prompt */}
        {returnsRevealed && !round.blackCardId && (
          <Card className="mb-6 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Black Card Decision</h3>
                  <p className="text-muted-foreground mb-4">
                    Would you like to reveal a black card for additional market effects?
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setBlackCardDialogOpen(true)} data-testid="button-reveal-black-card">
                      Reveal Black Card
                    </Button>
                    <Button variant="outline" onClick={() => setLocation('/')} data-testid="button-skip-black-card">
                      Skip - View Leaderboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Black Card Applied */}
        {round.blackCardId && selectedBlackCard && (
          <Card className="mb-6 border-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-600">Black Card Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Card</div>
                  <div className="font-semibold">{selectedBlackCard.cardNumber} - {selectedBlackCard.title}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Effect</div>
                  <div>{selectedBlackCard.cardText}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Modifiers</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="text-sm">Equity: {selectedBlackCard.equityModifier > 0 ? '+' : ''}{selectedBlackCard.equityModifier}%</div>
                    <div className="text-sm">Debt: {selectedBlackCard.debtModifier > 0 ? '+' : ''}{selectedBlackCard.debtModifier}%</div>
                    <div className="text-sm">Gold: {selectedBlackCard.goldModifier > 0 ? '+' : ''}{selectedBlackCard.goldModifier}%</div>
                    <div className="text-sm">Cash: {selectedBlackCard.cashModifier > 0 ? '+' : ''}{selectedBlackCard.cashModifier}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {returnsRevealed && (round.blackCardId || !blackCardDialogOpen) && (
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setLocation('/start-round')} data-testid="button-start-another-round">
              Start Another Round
            </Button>
            <Button onClick={() => setLocation('/')} size="lg" data-testid="button-view-leaderboard">
              View Leaderboard
            </Button>
          </div>
        )}
      </div>

      {/* Black Card Selection Dialog */}
      <AlertDialog open={blackCardDialogOpen} onOpenChange={setBlackCardDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Black Card</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a black card to apply additional market effects
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-3 max-h-96 overflow-y-auto py-4">
            {blackCards.map(card => (
              <div
                key={card.id}
                onClick={() => handleBlackCardReveal(card)}
                className="p-4 rounded-lg border hover-elevate cursor-pointer"
              >
                <div className="font-semibold mb-1">{card.cardNumber} - {card.title}</div>
                <div className="text-sm text-muted-foreground mb-2">{card.cardText}</div>
                <div className="flex gap-4 text-xs">
                  <span>E: {card.equityModifier > 0 ? '+' : ''}{card.equityModifier}%</span>
                  <span>D: {card.debtModifier > 0 ? '+' : ''}{card.debtModifier}%</span>
                  <span>G: {card.goldModifier > 0 ? '+' : ''}{card.goldModifier}%</span>
                  <span>C: {card.cashModifier > 0 ? '+' : ''}{card.cashModifier}%</span>
                </div>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
