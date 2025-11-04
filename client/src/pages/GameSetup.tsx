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
          <CardHeader>
            <CardTitle>Team Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">Initial allocations must total 100%</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#2563EB]/10 via-[#16A34A]/10 to-[#F97316]/10">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold uppercase tracking-wide">Team Name</th>
                    <th className="text-right p-3 text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Equity %</th>
                    <th className="text-right p-3 text-sm font-semibold uppercase tracking-wide text-[#DC2626]">Debt %</th>
                    <th className="text-right p-3 text-sm font-semibold uppercase tracking-wide text-[#F97316]">Gold %</th>
                    <th className="text-right p-3 text-sm font-semibold uppercase tracking-wide text-[#16A34A]">Cash %</th>
                    <th className="text-right p-3 text-sm font-semibold uppercase tracking-wide">Total</th>
                    <th className="text-center p-3 text-sm font-semibold uppercase tracking-wide w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => {
                    const total = getAllocationTotal(team);
                    const isValid = total === 100;
                    
                    return (
                      <tr key={index} className="border-t hover-elevate" data-testid={`row-team-${index}`}>
                        <td className="p-3">
                          <Input
                            value={team.name}
                            onChange={(e) => updateTeam(index, "name", e.target.value)}
                            placeholder="Enter team name"
                            className="h-8"
                            data-testid={`input-team-name-${index}`}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={team.equity}
                            onChange={(e) => updateTeam(index, "equity", parseInt(e.target.value) || 0)}
                            className="h-8 text-right"
                            data-testid={`input-equity-${index}`}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={team.debt}
                            onChange={(e) => updateTeam(index, "debt", parseInt(e.target.value) || 0)}
                            className="h-8 text-right"
                            data-testid={`input-debt-${index}`}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={team.gold}
                            onChange={(e) => updateTeam(index, "gold", parseInt(e.target.value) || 0)}
                            className="h-8 text-right"
                            data-testid={`input-gold-${index}`}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={team.cash}
                            onChange={(e) => updateTeam(index, "cash", parseInt(e.target.value) || 0)}
                            className="h-8 text-right"
                            data-testid={`input-cash-${index}`}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-mono font-semibold ${
                              isValid ? "text-green-600" : "text-red-600"
                            }`}
                            data-testid={`text-allocation-total-${index}`}
                          >
                            {total}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {teams.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTeam(index)}
                              data-testid={`button-remove-team-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button onClick={addTeam} variant="outline" size="sm" className="mt-4" data-testid="button-add-team">
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
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
