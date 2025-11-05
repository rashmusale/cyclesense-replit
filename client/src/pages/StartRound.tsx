import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhaseBadge from "@/components/PhaseBadge";
import { Dices, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ColorCard, GameState } from "@shared/schema";

const PHASES = [
  { value: "green", label: "Green - Bull Market", color: "text-[#2e8b57]" },
  { value: "blue", label: "Blue - Stable Market", color: "text-[#1e88e5]" },
  { value: "orange", label: "Orange - Market Correction", color: "text-[#f57c00]" },
  { value: "red", label: "Red - Bear Market", color: "text-[#c62828]" },
];

const PHASE_COLORS = {
  green: { bg: "bg-[#2e8b57]", border: "border-[#2e8b57]", text: "text-white", textMuted: "text-white/90" },
  blue: { bg: "bg-[#1e88e5]", border: "border-[#1e88e5]", text: "text-white", textMuted: "text-white/90" },
  orange: { bg: "bg-[#f57c00]", border: "border-[#f57c00]", text: "text-white", textMuted: "text-white/90" },
  red: { bg: "bg-[#c62828]", border: "border-[#c62828]", text: "text-white", textMuted: "text-white/90" },
};

type VirtualStep = "roll-dice" | "rolling-animation" | "draw-card" | "card-drawn";

export default function StartRound() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>("");
  const [drawnCard, setDrawnCard] = useState<ColorCard | null>(null);
  const [virtualStep, setVirtualStep] = useState<VirtualStep>("roll-dice");

  const { data: gameState } = useQuery<GameState>({
    queryKey: ["/api/game-state"],
  });

  const { data: colorCards = [] } = useQuery<ColorCard[]>({
    queryKey: ["/api/color-cards"],
  });

  const isVirtualMode = gameState?.mode === "virtual";
  const nextRoundNumber = (gameState?.currentRound || 0) + 1;
  
  // Filter color cards by selected phase for In-Person mode
  const phaseColorCards = selectedPhase 
    ? colorCards.filter(card => card.phase === selectedPhase)
    : [];

  // Virtual mode: Roll dice only (determine phase)
  const rollDiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds/draw-card", {
        isVirtual: true
      });
      return await res.json();
    },
    onSuccess: (data: { phase: string; card: ColorCard }) => {
      // Show rolling animation for 2.5 seconds before revealing card
      setVirtualStep("rolling-animation");
      
      setTimeout(() => {
        setSelectedPhase(data.phase);
        setDrawnCard(data.card);
        setVirtualStep("draw-card");
        toast({
          title: "Dice Rolled!",
          description: `Phase: ${PHASES.find(p => p.value === data.phase)?.label}`,
        });
      }, 2500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to roll dice",
        variant: "destructive",
      });
    }
  });

  // In-Person mode: Select specific card by card number
  const handleInPersonCardSelect = () => {
    if (!selectedCardNumber) {
      toast({
        title: "Select a Card",
        description: "Please select a color card number",
        variant: "destructive",
      });
      return;
    }
    
    const selectedCard = phaseColorCards.find(c => c.cardNumber === selectedCardNumber);
    if (selectedCard) {
      setDrawnCard(selectedCard);
      toast({
        title: "Card Selected!",
        description: "Color card selected",
      });
    }
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

            {/* Rolling Animation */}
            {virtualStep === "rolling-animation" && (
              <Card className="border-2">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <Dices className="w-24 h-24 text-primary animate-bounce" />
                      <div className="absolute inset-0 animate-spin">
                        <Loader2 className="w-24 h-24 text-primary/30" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">Rolling the Dice...</h3>
                      <p className="text-muted-foreground animate-pulse">
                        Determining market phase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Show Phase, Card Drawn (Returns Hidden) */}
            {virtualStep === "draw-card" && drawnCard && (
              <>
                <Card className={`mb-6 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].bg} border-2 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].border}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}>Phase Selected</CardTitle>
                      <PhaseBadge phase={drawnCard.phase.toUpperCase() as any} />
                    </div>
                  </CardHeader>
                </Card>

                <Card className={`mb-6 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].bg} border-2 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].border}`}>
                  <CardHeader>
                    <CardTitle className={PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}>Color Card Drawn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className={`text-sm mb-1 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].textMuted}`}>Card Number</div>
                        <div className={`font-mono font-semibold ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}`} data-testid="text-card-number">{drawnCard.cardNumber}</div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].textMuted}`}>Market Event</div>
                        <div className={`text-base ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}`} data-testid="text-card-text">{drawnCard.cardText}</div>
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
                  <CardTitle>Select Phase & Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Market Phase</label>
                    <RadioGroup value={selectedPhase} onValueChange={(value) => {
                      setSelectedPhase(value);
                      setSelectedCardNumber(""); // Reset card selection when phase changes
                    }}>
                      {PHASES.map(phase => (
                        <div key={phase.value} className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value={phase.value} id={phase.value} data-testid={`radio-phase-${phase.value}`} />
                          <Label htmlFor={phase.value} className={`cursor-pointer font-medium ${phase.color}`}>
                            {phase.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {selectedPhase && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color Card Number</label>
                      <Select value={selectedCardNumber} onValueChange={setSelectedCardNumber}>
                        <SelectTrigger data-testid="select-color-card-number">
                          <SelectValue placeholder="Select card number" />
                        </SelectTrigger>
                        <SelectContent>
                          {phaseColorCards.map(card => (
                            <SelectItem key={card.id} value={card.cardNumber}>
                              {card.cardNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCardNumber && (
                        <div className={`mt-4 p-4 rounded-lg ${PHASE_COLORS[selectedPhase as keyof typeof PHASE_COLORS].bg} border-2 ${PHASE_COLORS[selectedPhase as keyof typeof PHASE_COLORS].border}`}>
                          <div className={`text-sm mb-2 ${PHASE_COLORS[selectedPhase as keyof typeof PHASE_COLORS].textMuted}`}>Card Text</div>
                          <div className={`text-sm ${PHASE_COLORS[selectedPhase as keyof typeof PHASE_COLORS].text}`}>
                            {phaseColorCards.find(c => c.cardNumber === selectedCardNumber)?.cardText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleInPersonCardSelect} 
                    disabled={!selectedCardNumber}
                    className="w-full" 
                    size="lg" 
                    data-testid="button-select-card"
                  >
                    Select Card
                  </Button>
                </CardContent>
              </Card>
            )}

            {drawnCard && (
              <>
                <Card className={`mb-6 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].bg} border-2 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].border}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}>Color Card Selected</CardTitle>
                      <PhaseBadge phase={drawnCard.phase.toUpperCase() as any} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className={`text-sm mb-1 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].textMuted}`}>Card Number</div>
                        <div className={`font-mono font-semibold ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}`} data-testid="text-card-number">{drawnCard.cardNumber}</div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].textMuted}`}>Market Event</div>
                        <div className={`text-base ${PHASE_COLORS[drawnCard.phase as keyof typeof PHASE_COLORS].text}`} data-testid="text-card-text">{drawnCard.cardText}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDrawnCard(null);
                      setSelectedCardNumber("");
                    }} 
                    className="flex-1" 
                    data-testid="button-redraw"
                  >
                    Select Different Card
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
