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

export default function StartRound() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [drawnCard, setDrawnCard] = useState<ColorCard | null>(null);

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  const { data: colorCards = [] } = useQuery<ColorCard[]>({
    queryKey: ["/api/color-cards"],
  });

  const isVirtualMode = gameState?.mode === "virtual";
  const nextRoundNumber = (gameState?.currentRound || 0) + 1;

  const drawCardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds/draw-card", {
        phase: selectedPhase,
        isVirtual: isVirtualMode
      });
      return await res.json();
    },
    onSuccess: (data: { phase: string; card: ColorCard }) => {
      setSelectedPhase(data.phase);
      setDrawnCard(data.card);
      if (isVirtualMode) {
        toast({
          title: "Dice Rolled!",
          description: `Phase: ${PHASES.find(p => p.value === data.phase)?.label}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to draw card",
        variant: "destructive",
      });
    }
  });

  const handleDrawCard = () => {
    if (!isVirtualMode && !selectedPhase) {
      toast({
        title: "Select a Phase",
        description: "Please select a market phase first",
        variant: "destructive",
      });
      return;
    }
    drawCardMutation.mutate();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      toast({
        title: "Round Started!",
        description: `Round ${nextRoundNumber} is now active`,
      });
      setLocation("/");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Start Round {nextRoundNumber}</h1>
          <p className="text-muted-foreground">
            {isVirtualMode ? "Roll the dice to determine market phase" : "Select the market phase"}
          </p>
        </div>

        {!drawnCard && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{isVirtualMode ? "Roll Dice" : "Select Phase"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isVirtualMode && (
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
              )}
              
              <Button 
                onClick={handleDrawCard} 
                disabled={drawCardMutation.isPending}
                className="w-full" 
                size="lg" 
                data-testid="button-draw-card"
              >
                <Dices className="w-5 h-5 mr-2" />
                {drawCardMutation.isPending ? "Drawing..." : (isVirtualMode ? "Roll Dice & Draw Card" : "Draw Card")}
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
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-3">Asset Returns</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 rounded bg-[#2563EB]/10">
                        <span className="text-sm font-medium text-[#2563EB]">Equity</span>
                        <span className="font-mono font-bold text-[#2563EB]" data-testid="text-equity-return">
                          {parseFloat(drawnCard.equityReturn) > 0 ? "+" : ""}{drawnCard.equityReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-[#DC2626]/10">
                        <span className="text-sm font-medium text-[#DC2626]">Debt</span>
                        <span className="font-mono font-bold text-[#DC2626]" data-testid="text-debt-return">
                          {parseFloat(drawnCard.debtReturn) > 0 ? "+" : ""}{drawnCard.debtReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-[#F97316]/10">
                        <span className="text-sm font-medium text-[#F97316]">Gold</span>
                        <span className="font-mono font-bold text-[#F97316]" data-testid="text-gold-return">
                          {parseFloat(drawnCard.goldReturn) > 0 ? "+" : ""}{drawnCard.goldReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-[#16A34A]/10">
                        <span className="text-sm font-medium text-[#16A34A]">Cash</span>
                        <span className="font-mono font-bold text-[#16A34A]" data-testid="text-cash-return">
                          {parseFloat(drawnCard.cashReturn) > 0 ? "+" : ""}{drawnCard.cashReturn}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setDrawnCard(null)} className="flex-1" data-testid="button-redraw">
                Draw Different Card
              </Button>
              <Button onClick={() => createRoundMutation.mutate()} disabled={createRoundMutation.isPending} className="flex-1" data-testid="button-continue">
                {createRoundMutation.isPending ? "Starting..." : "Continue"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
