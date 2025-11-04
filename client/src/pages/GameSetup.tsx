import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TeamSetup = {
  id?: string;
  name: string;
  equity: number;
  debt: number;
  gold: number;
  cash: number;
};

export default function GameSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"virtual" | "in-person">("virtual");
  const [teams, setTeams] = useState<TeamSetup[]>([
    { name: "", equity: 25, debt: 25, gold: 25, cash: 25 }
  ]);

  // Get existing game state
  const { data: gameState } = useQuery({
    queryKey: ["/api/game-state"],
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      // Validate all teams
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        if (!team.name.trim()) {
          throw new Error(`Team ${i + 1} needs a name`);
        }
        const total = team.equity + team.debt + team.gold + team.cash;
        if (total !== 100) {
          throw new Error(`${team.name}'s allocation must total 100% (currently ${total}%)`);
        }
      }

      // Create game state
      const gameStateRes = await apiRequest("POST", "/api/game-state", { mode, currentRound: 0, isActive: false });
      const gameStateResponse = await gameStateRes.json();

      // Create teams
      const createdTeams = [];
      for (const team of teams) {
        const teamRes = await apiRequest("POST", "/api/teams", { name: team.name });
        const teamResponse = await teamRes.json();
        createdTeams.push({ ...teamResponse, initialAllocation: team });
      }

      return { gameState: gameStateResponse, teams: createdTeams };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Game Started!",
        description: `${teams.length} teams registered. Ready to start first round.`,
      });
      setLocation("/start-round");
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTeam = () => {
    setTeams([...teams, { name: "", equity: 25, debt: 25, gold: 25, cash: 25 }]);
  };

  const removeTeam = (index: number) => {
    if (teams.length > 1) {
      setTeams(teams.filter((_, i) => i !== index));
    }
  };

  const updateTeam = (index: number, field: keyof TeamSetup, value: string | number) => {
    const updated = [...teams];
    updated[index] = { ...updated[index], [field]: value };
    setTeams(updated);
  };

  const getAllocationTotal = (team: TeamSetup) => {
    return team.equity + team.debt + team.gold + team.cash;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Game Setup</h1>
          <p className="text-muted-foreground">
            Configure your CycleSense investment simulation session
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Game Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "virtual" | "in-person")}>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="virtual" id="virtual" data-testid="radio-mode-virtual" />
                <Label htmlFor="virtual" className="cursor-pointer">
                  <div>
                    <div className="font-semibold">Virtual Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Die rolls and card draws happen automatically on screen
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" data-testid="radio-mode-in-person" />
                <Label htmlFor="in-person" className="cursor-pointer">
                  <div>
                    <div className="font-semibold">In-Person Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Facilitator manually inputs die rolls and card selections
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Configuration</CardTitle>
            <Button onClick={addTeam} variant="outline" size="sm" data-testid="button-add-team">
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {teams.map((team, index) => {
              const total = getAllocationTotal(team);
              const isValid = total === 100;
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Team {index + 1}</h3>
                    {teams.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeam(index)}
                        data-testid={`button-remove-team-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`team-name-${index}`}>Team Name</Label>
                      <Input
                        id={`team-name-${index}`}
                        value={team.name}
                        onChange={(e) => updateTeam(index, "name", e.target.value)}
                        placeholder="Enter team name"
                        data-testid={`input-team-name-${index}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Initial Allocation (must total 100%)</Label>
                        <span
                          className={`text-sm font-mono font-semibold ${
                            isValid ? "text-green-600" : "text-red-600"
                          }`}
                          data-testid={`text-allocation-total-${index}`}
                        >
                          Total: {total}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`equity-${index}`} className="text-[#2563EB]">Equity</Label>
                          <Input
                            id={`equity-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={team.equity}
                            onChange={(e) => updateTeam(index, "equity", parseInt(e.target.value) || 0)}
                            data-testid={`input-equity-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`debt-${index}`} className="text-[#DC2626]">Debt</Label>
                          <Input
                            id={`debt-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={team.debt}
                            onChange={(e) => updateTeam(index, "debt", parseInt(e.target.value) || 0)}
                            data-testid={`input-debt-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`gold-${index}`} className="text-[#F97316]">Gold</Label>
                          <Input
                            id={`gold-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={team.gold}
                            onChange={(e) => updateTeam(index, "gold", parseInt(e.target.value) || 0)}
                            data-testid={`input-gold-${index}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`cash-${index}`} className="text-[#16A34A]">Cash</Label>
                          <Input
                            id={`cash-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={team.cash}
                            onChange={(e) => updateTeam(index, "cash", parseInt(e.target.value) || 0)}
                            data-testid={`input-cash-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={() => startGameMutation.mutate()}
            disabled={startGameMutation.isPending}
            className="flex-1"
            data-testid="button-start-game"
          >
            {startGameMutation.isPending ? "Setting up..." : "Start Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
