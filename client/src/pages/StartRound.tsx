import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import PhaseBadge from "@/components/PhaseBadge";
import RoundInputCard from "@/components/RoundInputCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PhaseColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED';

const phases: PhaseColor[] = ['GREEN', 'BLUE', 'ORANGE', 'RED'];
const scenarioCodes = {
  GREEN: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  BLUE: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'],
  ORANGE: ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10'],
  RED: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
};
const blackCards = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'];

interface TeamInputData {
  allocationEquity: number;
  allocationDebt: number;
  allocationGold: number;
  allocationCash: number;
  rebalancePct: number;
  emotionToken: string;
  pitchPoints: number;
  emotionPoints: number;
  portfolioReturn: number;
}

const defaultTeamData: TeamInputData = {
  allocationEquity: 25,
  allocationDebt: 25,
  allocationGold: 25,
  allocationCash: 25,
  rebalancePct: 0,
  emotionToken: 'Confidence',
  pitchPoints: 0,
  emotionPoints: 0,
  portfolioReturn: 0,
};

export default function StartRound() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [phase, setPhase] = useState<PhaseColor>('GREEN');
  const [scenarioCode, setScenarioCode] = useState('G1');
  const [blackCard, setBlackCard] = useState('');

  const mockTeams = [
    { id: 1, name: 'Team Alpha', navCurrent: 15.75 },
    { id: 2, name: 'Team Beta', navCurrent: 14.20 },
  ];

  const [teamData, setTeamData] = useState<Record<number, TeamInputData>>(
    Object.fromEntries(mockTeams.map(team => [team.id, { ...defaultTeamData }]))
  );

  const handlePhaseChange = (newPhase: PhaseColor) => {
    setPhase(newPhase);
    setScenarioCode(scenarioCodes[newPhase][0]);
  };

  const handleRandomize = () => {
    const randomPhase = phases[Math.floor(Math.random() * phases.length)];
    const codes = scenarioCodes[randomPhase];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    setPhase(randomPhase);
    setScenarioCode(randomCode);
    toast({
      title: "Randomized",
      description: `Selected ${randomPhase} phase with scenario ${randomCode}`,
    });
  };

  const handleTeamDataChange = (teamId: number, data: TeamInputData) => {
    setTeamData(prev => ({ ...prev, [teamId]: data }));
  };

  const handleSaveRound = () => {
    const allValid = mockTeams.every(team => {
      const data = teamData[team.id];
      const sum = data.allocationEquity + data.allocationDebt + data.allocationGold + data.allocationCash;
      return Math.abs(sum - 100) < 0.01 && data.rebalancePct <= 20;
    });

    if (!allValid) {
      toast({
        title: "Validation Error",
        description: "Please ensure all allocations sum to 100% and rebalance ≤ 20%",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Round Saved",
      description: "Processing team results...",
    });
    
    setTimeout(() => {
      setLocation('/round-summary');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-bold mb-2">Start Next Round</h2>
            <p className="text-muted-foreground">Configure phase and enter team data</p>
          </div>
          <Button onClick={() => setLocation('/')} variant="outline" data-testid="button-back">
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Round Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phase">Phase Color</Label>
                <Select value={phase} onValueChange={(value) => handlePhaseChange(value as PhaseColor)}>
                  <SelectTrigger id="phase" data-testid="select-phase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scenario">Scenario Code</Label>
                <Select value={scenarioCode} onValueChange={setScenarioCode}>
                  <SelectTrigger id="scenario" data-testid="select-scenario">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarioCodes[phase].map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="black-card">Black Card (Optional)</Label>
                <Select value={blackCard} onValueChange={setBlackCard}>
                  <SelectTrigger id="black-card" data-testid="select-black-card">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {blackCards.map((card) => (
                      <SelectItem key={card} value={card}>
                        {card}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleRandomize}
                data-testid="button-randomize"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize Phase & Scenario
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <PhaseBadge phase={phase} />
                <span className="font-mono font-semibold">{scenarioCode}</span>
                {blackCard && (
                  <>
                    <span className="text-muted-foreground">+</span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-card border border-card-border">
                      {blackCard}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-4">Team Input Data</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockTeams.map((team) => (
              <RoundInputCard
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                data={teamData[team.id]}
                onChange={handleTeamDataChange}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border py-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
          <div className="max-w-7xl mx-auto flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLocation('/')} data-testid="button-cancel-round">
              Cancel
            </Button>
            <Button onClick={handleSaveRound} size="lg" data-testid="button-save-round">
              Save Round & View Results
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
