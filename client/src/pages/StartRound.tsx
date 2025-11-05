import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import PhaseBadge from "@/components/PhaseBadge";
import { Dices } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ColorCard, GameState } from "@shared/schema";

const PHASES = [
  { value: "green", label: "Green - Bull Market" },
  { value: "blue", label: "Blue - Stable Market" },
  { value: "orange", label: "Orange - Market Correction" },
  { value: "red", label: "Red - Bear Market" },
];

type VirtualStep = "roll-dice" | "draw-card" | "card-drawn";

export default function StartRound() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [drawnCard, setDrawnCard] = useState<ColorCard | null>(null);
  const [virtualStep, setVirtualStep] = useState<VirtualStep>("roll-dice");

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  const isVirtualMode = gameState?.mode === "virtual";
  const nextRoundNumber = (gameState?.currentRound || 0) + 1;

  // Virtual mode: Roll dice only (determine phase)
  const rollDiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds/draw-card", {
        isVirtual: true
      });
      return await res.json();
    },
    onSuccess: (data: { phase: string; card: ColorCard }) => {
      setSelectedPhase(data.phase);
      setDrawnCard(data.card);
      setVirtualStep("draw-card");
      toast({
        title: "Dice Rolled!",
        description: `Phase: ${PHASES.find(p => p.value === data.phase)?.label}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to roll dice",
        variant: "destructive",
      });
    }
  });

  // In-Person mode: Draw card with selected phase
  const drawCardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds/draw-card", {
        phase: selectedPhase,
        isVirtual: false
      });
      return await res.json();
    },
    onSuccess: (data: { phase: string; card: ColorCard }) => {
      setSelectedPhase(data.phase);
      setDrawnCard(data.card);
      toast({
        title: "Card Drawn!",
        description: "Color card selected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to draw card",
        variant: "destructive",
      });
    }
  });

  const handleInPersonDrawCard = () => {
    if (!selectedPhase) {
      toast({
        title: "Select a Phase",
        description: "Please select a market phase first",
        variant: "destructive",
      });
      return;
    }
    drawCardMutation.mutate();
  };

  const handleVirtualContinue = () => {
    // Virtual mode: Create round and go to team input (returns hidden)
    if (!drawnCard) return;
    
    createRoundMutation.mutate();
  };

  const createRoundMutation = useMutation({
    mutationFn: async () => {
      if (!drawnCard) throw new Error("No card drawn");
      
      const res = await apiRequest("POST", "/api/rounds", {
        roundNumber: nextRoundNumber,
        phase: drawnCard.phase,
        colorCardId: drawnCard.id,
        blackCardId: null
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      
      if (isVirtualMode) {
        // Virtual mode: Go to team input (returns hidden)
        toast({
          title: "Round Started!",
          description: `Teams can now enter allocations for Round ${nextRoundNumber}`,
        });
        setLocation(`/team-input?roundId=${data.id}`);
      } else {
        // In-Person mode: Go to team input for allocations
        toast({
          title: "Round Started!",
          description: `Teams can now enter allocations`,
        });
        setLocation(`/team-input?roundId=${data.id}`);
      }
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Start Round {nextRoundNumber}</h1>
          <p className="text-muted-foreground">
            {isVirtualMode ? "Virtual Mode - Automated workflow" : "In-Person Mode - Manual phase selection"}
          </p>
        </div>

        {/* VIRTUAL MODE WORKFLOW */}
        {isVirtualMode && (
          <>
            {/* Step 1: Roll Dice */}
            {virtualStep === "roll-dice" && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Roll the Dice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Roll the dice to randomly determine the market phase for this round.
                  </p>
                  <Button 
                    onClick={() => rollDiceMutation.mutate()} 
                    disabled={rollDiceMutation.isPending}
                    className="w-full" 
                    size="lg" 
                    data-testid="button-roll-dice"
                  >
                    <Dices className="w-5 h-5 mr-2" />
                    {rollDiceMutation.isPending ? "Rolling..." : "Roll Dice"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Show Phase, Card Drawn (Returns Hidden) */}
            {virtualStep === "draw-card" && drawnCard && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Phase Selected</CardTitle>
                      <PhaseBadge phase={drawnCard.phase.toUpperCase() as any} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg mb-4">
                      The dice rolled: <span className="font-bold">{PHASES.find(p => p.value === drawnCard.phase)?.label}</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Color Card Drawn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Card Number</div>
                        <div className="font-mono font-semibold" data-testid="text-card-number">{drawnCard.cardNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Market Event</div>
                        <div className="text-base" data-testid="text-card-text">{drawnCard.cardText}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDrawnCard(null);
                      setVirtualStep("roll-dice");
                    }} 
                    className="flex-1" 
                    data-testid="button-redraw"
                  >
                    Re-roll Dice
                  </Button>
                  <Button 
                    onClick={handleVirtualContinue} 
                    disabled={createRoundMutation.isPending} 
                    className="flex-1" 
                    data-testid="button-continue"
                  >
                    {createRoundMutation.isPending ? "Starting..." : "Continue to Team Input"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* IN-PERSON MODE WORKFLOW */}
        {!isVirtualMode && (
          <>
            {!drawnCard && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Phase</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPhase} onValueChange={setSelectedPhase} className="mb-6">
                    {PHASES.map(phase => (
                      <div key={phase.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={phase.value} id={phase.value} data-testid={`radio-phase-${phase.value}`} />
                        <Label htmlFor={phase.value} className="cursor-pointer">
                          <PhaseBadge phase={phase.value.toUpperCase() as any} />
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  <Button 
                    onClick={handleInPersonDrawCard} 
                    disabled={drawCardMutation.isPending || !selectedPhase}
                    className="w-full" 
                    size="lg" 
                    data-testid="button-draw-card"
                  >
                    {drawCardMutation.isPending ? "Drawing..." : "Draw Card"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {drawnCard && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Color Card Drawn</CardTitle>
                      <PhaseBadge phase={drawnCard.phase.toUpperCase() as any} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Card Number</div>
                        <div className="font-mono font-semibold" data-testid="text-card-number">{drawnCard.cardNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Title</div>
                        <div className="text-xl font-bold" data-testid="text-card-title">{drawnCard.title}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Market Event</div>
                        <div className="text-base" data-testid="text-card-text">{drawnCard.cardText}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setDrawnCard(null)} className="flex-1" data-testid="button-redraw">
                    Draw Different Card
                  </Button>
                  <Button 
                    onClick={() => createRoundMutation.mutate()} 
                    disabled={createRoundMutation.isPending} 
                    className="flex-1" 
                    data-testid="button-continue"
                  >
                    {createRoundMutation.isPending ? "Starting..." : "Continue to Allocations"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
