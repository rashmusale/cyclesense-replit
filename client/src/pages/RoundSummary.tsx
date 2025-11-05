import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import Header from "@/components/Header";
import PhaseBadge from "@/components/PhaseBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, AlertCircle, Shuffle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Round, ColorCard, BlackCard, Team, TeamAllocation, GameState } from "@shared/schema";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PHASE_COLORS = {
  green: { bg: "bg-[#2e8b57]", border: "border-[#2e8b57]", text: "text-white", textMuted: "text-white/90" },
  blue: { bg: "bg-[#1e88e5]", border: "border-[#1e88e5]", text: "text-white", textMuted: "text-white/90" },
  orange: { bg: "bg-[#f57c00]", border: "border-[#f57c00]", text: "text-white", textMuted: "text-white/90" },
  red: { bg: "bg-[#c62828]", border: "border-[#c62828]", text: "text-white", textMuted: "text-white/90" },
};

export default function RoundSummary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const roundId = params.get('roundId');

  const [blackCardDialogOpen, setBlackCardDialogOpen] = useState(false);
  const [selectedBlackCard, setSelectedBlackCard] = useState<BlackCard | null>(null);
  const [selectedBlackCardNumber, setSelectedBlackCardNumber] = useState<string>("");
  const [drawnBlackCard, setDrawnBlackCard] = useState<BlackCard | null>(null);
  const [isDrawingBlackCard, setIsDrawingBlackCard] = useState(false);

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

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

  const { data: appliedBlackCard } = useQuery<BlackCard>({
    queryKey: ["/api/black-cards", round?.blackCardId],
    enabled: !!round?.blackCardId,
  });

  const isVirtualMode = gameState?.mode === "virtual";

  // Get this round's allocations
  const roundAllocations = allocations.filter(a => a.roundId === roundId);

  const applyBlackCardMutation = useMutation({
    mutationFn: async ({ blackCardId, savedAllocations }: { blackCardId: string; savedAllocations: TeamAllocation[] }) => {
      // Step 1: Update round with black card
      await apiRequest("PATCH", `/api/rounds/${roundId}`, {
        blackCardId,
      });
      
      // Step 2: Delete existing allocations for this round (rollback NAVs)
      await apiRequest("DELETE", `/api/allocations/round/${roundId}`, {});
      
      // Step 3: Recreate allocations with same data (server will recalc NAV with black card)
      const promises = savedAllocations.map(async (alloc) => {
        const res = await apiRequest("POST", "/api/allocations", {
          teamId: alloc.teamId,
          roundId,
          equity: alloc.equity,
          debt: alloc.debt,
          gold: alloc.gold,
          cash: alloc.cash,
          pitchScore: alloc.pitchScore,
          emotionScore: alloc.emotionScore,
        });
        return await res.json();
      });
      
      return await Promise.all(promises);
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
    // Save allocations NOW before mutation starts
    const savedAllocations = allocations.filter(a => a.roundId === roundId);
    applyBlackCardMutation.mutate({ blackCardId: card.id, savedAllocations });
  };

  const handleRandomBlackCard = () => {
    if (blackCards.length === 0) {
      toast({
        title: "No Black Cards",
        description: "Please add black cards to the deck first",
        variant: "destructive",
      });
      return;
    }
    
    // Show drawing animation for 2.5 seconds
    setIsDrawingBlackCard(true);
    
    setTimeout(() => {
      const randomCard = blackCards[Math.floor(Math.random() * blackCards.length)];
      setDrawnBlackCard(randomCard);
      setIsDrawingBlackCard(false);
    }, 2500);
  };

  const handleApplyDrawnBlackCard = () => {
    if (drawnBlackCard) {
      handleBlackCardReveal(drawnBlackCard);
    }
  };

  const handleInPersonBlackCardSelect = () => {
    const card = blackCards.find(c => c.cardNumber === selectedBlackCardNumber);
    if (card) {
      handleBlackCardReveal(card);
      setBlackCardDialogOpen(false);
    }
  };

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
          <h1 className="text-4xl font-bold mb-2">Round {round.roundNumber} Results</h1>
          <p className="text-muted-foreground">NAV Updated (New NAV = Old NAV × (1 + Portfolio Return) + Pitch + Emotion)</p>
        </div>

        {/* Team NAV Results */}
        {roundAllocations.length > 0 && (
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
                          Allocation: E{allocation.equity}% D{allocation.debt}% G{allocation.gold}% C{allocation.cash}%
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

        {/* Color Card Details */}
        <Card className={`mb-6 ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].bg} border-2 ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].border}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].text}>Color Card</CardTitle>
              <PhaseBadge phase={round.phase.toUpperCase() as any} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className={`text-sm mb-1 ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].textMuted}`}>Card Number</div>
                <div className={`font-mono font-semibold ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].text}`}>{colorCard.cardNumber}</div>
              </div>
              <div>
                <div className={`text-sm mb-1 ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].textMuted}`}>Market Event</div>
                <div className={`text-base ${PHASE_COLORS[round.phase as keyof typeof PHASE_COLORS].text}`}>{colorCard.cardText}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Black Card Details - Shown when applied */}
        {appliedBlackCard && (
          <Card className="mb-6 bg-black/90 border-2 border-purple-500">
            <CardHeader>
              <CardTitle className="text-white">Black Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-purple-200 mb-1">Card Number</div>
                  <div className="font-mono font-semibold text-white">{appliedBlackCard.cardNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-purple-200 mb-1">Card Text</div>
                  <div className="text-base text-white">{appliedBlackCard.cardText}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Color Card Impact (Asset Returns) */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <CardTitle>Color Card Impact (Asset Returns)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded bg-[#2563EB]/10">
                <span className="text-sm font-medium text-[#2563EB] mb-1">Equity</span>
                <span className="font-mono font-bold text-2xl text-[#2563EB]">
                  {Number(colorCard.equityReturn) > 0 ? "+" : ""}{colorCard.equityReturn}%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded bg-[#DC2626]/10">
                <span className="text-sm font-medium text-[#DC2626] mb-1">Debt</span>
                <span className="font-mono font-bold text-2xl text-[#DC2626]">
                  {Number(colorCard.debtReturn) > 0 ? "+" : ""}{colorCard.debtReturn}%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded bg-[#F97316]/10">
                <span className="text-sm font-medium text-[#F97316] mb-1">Gold</span>
                <span className="font-mono font-bold text-2xl text-[#F97316]">
                  {Number(colorCard.goldReturn) > 0 ? "+" : ""}{colorCard.goldReturn}%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded bg-[#16A34A]/10">
                <span className="text-sm font-medium text-[#16A34A] mb-1">Cash</span>
                <span className="font-mono font-bold text-2xl text-[#16A34A]">
                  {Number(colorCard.cashReturn) > 0 ? "+" : ""}{colorCard.cashReturn}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Black Card Impact (Modifiers) - Shown when applied */}
        {appliedBlackCard && (
          <Card className="mb-6 bg-black/90 border-2 border-purple-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-white">Black Card Impact (Modifiers)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded bg-purple-500/20 border border-purple-500/40">
                  <span className="text-sm font-medium text-purple-200 mb-1">Equity</span>
                  <span className="font-mono font-bold text-2xl text-white">
                    {Number(appliedBlackCard.equityModifier) > 0 ? "+" : ""}{appliedBlackCard.equityModifier}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-purple-500/20 border border-purple-500/40">
                  <span className="text-sm font-medium text-purple-200 mb-1">Debt</span>
                  <span className="font-mono font-bold text-2xl text-white">
                    {Number(appliedBlackCard.debtModifier) > 0 ? "+" : ""}{appliedBlackCard.debtModifier}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-purple-500/20 border border-purple-500/40">
                  <span className="text-sm font-medium text-purple-200 mb-1">Gold</span>
                  <span className="font-mono font-bold text-2xl text-white">
                    {Number(appliedBlackCard.goldModifier) > 0 ? "+" : ""}{appliedBlackCard.goldModifier}%
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded bg-purple-500/20 border border-purple-500/40">
                  <span className="text-sm font-medium text-purple-200 mb-1">Cash</span>
                  <span className="font-mono font-bold text-2xl text-white">
                    {Number(appliedBlackCard.cashModifier) > 0 ? "+" : ""}{appliedBlackCard.cashModifier}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Black Card Drawing Animation */}
        {isDrawingBlackCard && (
          <Card className="mb-6 bg-black/90 border-2 border-purple-500">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <Shuffle className="w-24 h-24 text-purple-400 animate-bounce" />
                  <div className="absolute inset-0 animate-spin">
                    <Loader2 className="w-24 h-24 text-purple-400/30" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Drawing Black Card...</h3>
                  <p className="text-purple-200 animate-pulse">
                    Additional market forces incoming
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Black Card Prompt */}
        {!round.blackCardId && !drawnBlackCard && !isDrawingBlackCard && (
          <Card className="mb-6 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Black Card Decision</h3>
                  <p className="text-muted-foreground mb-4">
                    {isVirtualMode 
                      ? "Draw a random black card for additional market effects?" 
                      : "Would you like to select a black card for additional market effects?"}
                  </p>
                  <div className="flex gap-3">
                    {isVirtualMode ? (
                      <Button onClick={handleRandomBlackCard} disabled={applyBlackCardMutation.isPending} data-testid="button-draw-random-black-card">
                        <Shuffle className="w-4 h-4 mr-2" />
                        {applyBlackCardMutation.isPending ? "Drawing..." : "Draw Random Black Card"}
                      </Button>
                    ) : (
                      <Button onClick={() => setBlackCardDialogOpen(true)} data-testid="button-reveal-black-card">
                        Select Black Card
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setLocation('/')} data-testid="button-skip-black-card">
                      Skip - View Leaderboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawn Black Card - Virtual Mode */}
        {!round.blackCardId && drawnBlackCard && isVirtualMode && (
          <Card className="mb-6 bg-black/90 border-2 border-purple-500">
            <CardHeader>
              <CardTitle className="text-white">Black Card Drawn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-purple-200 mb-1">Card Number</div>
                  <div className="font-mono font-semibold text-white" data-testid="text-drawn-black-card-number">{drawnBlackCard.cardNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-purple-200 mb-1">Card Text</div>
                  <div className="text-base text-white" data-testid="text-drawn-black-card-text">{drawnBlackCard.cardText}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleApplyDrawnBlackCard} 
                  disabled={applyBlackCardMutation.isPending}
                  data-testid="button-apply-market-impact"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {applyBlackCardMutation.isPending ? "Applying..." : "Apply Market Impact"}
                </Button>
                <Button variant="outline" onClick={() => setDrawnBlackCard(null)} data-testid="button-redraw-black-card" className="border-purple-500 text-white hover:bg-purple-500/20">
                  Draw Different Card
                </Button>
                <Button variant="outline" onClick={() => setLocation('/')} data-testid="button-skip-black-card-after-draw" className="border-purple-500 text-white hover:bg-purple-500/20">
                  Skip - View Leaderboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Black Card Applied - DISABLED (buggy NAV calculation) */}
        {false && round.blackCardId && selectedBlackCard && (
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
                    <div className="text-sm">Equity: {Number(selectedBlackCard.equityModifier) > 0 ? '+' : ''}{selectedBlackCard.equityModifier}%</div>
                    <div className="text-sm">Debt: {Number(selectedBlackCard.debtModifier) > 0 ? '+' : ''}{selectedBlackCard.debtModifier}%</div>
                    <div className="text-sm">Gold: {Number(selectedBlackCard.goldModifier) > 0 ? '+' : ''}{selectedBlackCard.goldModifier}%</div>
                    <div className="text-sm">Cash: {Number(selectedBlackCard.cashModifier) > 0 ? '+' : ''}{selectedBlackCard.cashModifier}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/start-round')} data-testid="button-start-another-round">
            Start Another Round
          </Button>
          <Button onClick={() => setLocation('/')} size="lg" data-testid="button-view-leaderboard">
            View Leaderboard
          </Button>
        </div>
      </div>
      {/* Black Card Selection Dialog - In-Person Mode */}
      <AlertDialog open={blackCardDialogOpen} onOpenChange={setBlackCardDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Black Card</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a black card number to apply additional market effects
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Black Card Number</label>
            <Select value={selectedBlackCardNumber} onValueChange={setSelectedBlackCardNumber}>
              <SelectTrigger data-testid="select-black-card-number">
                <SelectValue placeholder="Select card number" />
              </SelectTrigger>
              <SelectContent>
                {blackCards.map(card => (
                  <SelectItem key={card.id} value={card.cardNumber}>
                    {card.cardNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBlackCardNumber && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground mb-1">Card Text</div>
                <div className="text-sm">
                  {blackCards.find(c => c.cardNumber === selectedBlackCardNumber)?.cardText}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBlackCardNumber("")}>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleInPersonBlackCardSelect} 
              disabled={!selectedBlackCardNumber || applyBlackCardMutation.isPending}
              data-testid="button-apply-black-card"
            >
              {applyBlackCardMutation.isPending ? "Applying..." : "Apply Card"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
