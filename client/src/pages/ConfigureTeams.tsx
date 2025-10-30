import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import TeamConfigCard from "@/components/TeamConfigCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: number;
  name: string;
  navCurrent: number;
}

export default function ConfigureTeams() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'Team Alpha', navCurrent: 15.75 },
    { id: 2, name: 'Team Beta', navCurrent: 14.20 },
    { id: 3, name: 'Team Gamma', navCurrent: 13.45 },
  ]);

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      const newTeam: Team = {
        id: Math.max(0, ...teams.map(t => t.id)) + 1,
        name: newTeamName,
        navCurrent: 10,
      };
      setTeams([...teams, newTeam]);
      setNewTeamName('');
      setShowAddForm(false);
      toast({
        title: "Team Added",
        description: `${newTeamName} has been added with NAV 10.00`,
      });
    }
  };

  const handleUpdateTeam = (id: number, name: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
    toast({
      title: "Team Updated",
      description: "Team name has been changed",
    });
  };

  const handleDeleteTeam = (id: number) => {
    const team = teams.find(t => t.id === id);
    setTeams(teams.filter(t => t.id !== id));
    toast({
      title: "Team Deleted",
      description: `${team?.name} has been removed`,
      variant: "destructive",
    });
  };

  const handleResetNav = (id: number) => {
    setTeams(teams.map(t => t.id === id ? { ...t, navCurrent: 10 } : t));
    toast({
      title: "NAV Reset",
      description: "Team NAV has been reset to 10.00",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onNewRound={() => setLocation('/start-round')}
        onConfigureTeams={() => setLocation('/configure-teams')}
        onNewGame={() => setLocation('/')}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-bold mb-2">Configure Teams</h2>
            <p className="text-muted-foreground">Add, edit, or remove teams from the game</p>
          </div>
          <Button onClick={() => setLocation('/')} variant="outline" data-testid="button-back">
            Back to Dashboard
          </Button>
        </div>

        {showAddForm ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTeam();
                    if (e.key === 'Escape') {
                      setShowAddForm(false);
                      setNewTeamName('');
                    }
                  }}
                  placeholder="Enter team name"
                  autoFocus
                  data-testid="input-new-team-name"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTeam} data-testid="button-save-team">
                  Add Team
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTeamName('');
                  }}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            className="mb-6 w-full"
            size="lg"
            data-testid="button-add-team"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Team
          </Button>
        )}

        <div className="space-y-4">
          {teams.map((team) => (
            <TeamConfigCard
              key={team.id}
              team={team}
              onUpdate={handleUpdateTeam}
              onDelete={handleDeleteTeam}
              onResetNav={handleResetNav}
            />
          ))}
        </div>

        {teams.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No teams configured yet</p>
              <Button onClick={() => setShowAddForm(true)} data-testid="button-add-first-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
