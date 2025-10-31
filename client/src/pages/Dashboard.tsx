import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResetGameModal from "@/components/ResetGameModal";
import { Download, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const mockTeams = [
    { 
      id: 1, 
      name: 'Team Alpha', 
      navCurrent: 15.75, 
      pitchTotal: 12, 
      emotionTotal: 8,
      latestAllocation: { equity: 40, debt: 30, gold: 20, cash: 10 }
    },
    { 
      id: 2, 
      name: 'Team Beta', 
      navCurrent: 14.20, 
      pitchTotal: 10, 
      emotionTotal: 11,
      latestAllocation: { equity: 50, debt: 25, gold: 15, cash: 10 }
    },
    { 
      id: 3, 
      name: 'Team Gamma', 
      navCurrent: 13.45, 
      pitchTotal: 9, 
      emotionTotal: 9,
      latestAllocation: { equity: 35, debt: 35, gold: 20, cash: 10 }
    },
    { 
      id: 4, 
      name: 'Team Delta', 
      navCurrent: 12.80, 
      pitchTotal: 11, 
      emotionTotal: 7,
      latestAllocation: { equity: 30, debt: 40, gold: 20, cash: 10 }
    },
  ];

  const currentRound = 3;
  
  // Calculate return as (latest NAV / 10) - 1
  const teamsWithReturns = mockTeams.map(team => ({
    ...team,
    returnPct: ((team.navCurrent / 10) - 1) * 100
  }));

  // Mock NAV progression data for line chart
  const navProgressionData = [
    { round: 0, 'Team Alpha': 10, 'Team Beta': 10, 'Team Gamma': 10, 'Team Delta': 10 },
    { round: 1, 'Team Alpha': 11.2, 'Team Beta': 10.8, 'Team Gamma': 10.5, 'Team Delta': 10.3 },
    { round: 2, 'Team Alpha': 13.5, 'Team Beta': 12.1, 'Team Gamma': 11.8, 'Team Delta': 11.2 },
    { round: 3, 'Team Alpha': 15.75, 'Team Beta': 14.20, 'Team Gamma': 13.45, 'Team Delta': 12.80 },
  ];

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Downloading game data as CSV...",
    });
    console.log('Export CSV triggered');
  };

  const handleResetGame = (keepTeams: boolean) => {
    toast({
      title: "Game Reset",
      description: keepTeams ? "All rounds cleared. Teams preserved." : "All data cleared.",
    });
    console.log('Reset game, keep teams:', keepTeams);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentRound={currentRound}
        onNewRound={() => setLocation('/start-round')}
        onConfigureTeams={() => setLocation('/configure-teams')}
        onNewGame={() => setResetModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">Current Leaderboard</h2>
              <p className="text-muted-foreground">Round {currentRound} Complete</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExport}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">NAV Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={navProgressionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="round" 
                    label={{ value: 'Round', position: 'insideBottom', offset: -5 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    label={{ value: 'NAV', angle: -90, position: 'insideLeft' }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Team Alpha" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 4 }} />
                  <Line type="monotone" dataKey="Team Beta" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
                  <Line type="monotone" dataKey="Team Gamma" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A', r: 4 }} />
                  <Line type="monotone" dataKey="Team Delta" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="allocations" data-testid="tab-allocations">
                Current Allocations
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                Allocation History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard">
              <LeaderboardTable teams={teamsWithReturns} />
            </TabsContent>

            <TabsContent value="allocations">
              <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2563EB]/10 via-[#16A34A]/10 to-[#F97316]/10">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">Team</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Equity</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#DC2626]">Debt</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#F97316]">Gold</th>
                        <th className="text-right p-4 text-sm font-semibold uppercase tracking-wide text-[#16A34A]">Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsWithReturns.map((team) => (
                        <tr key={team.id} className="border-t hover-elevate" data-testid={`row-allocation-${team.id}`}>
                          <td className="p-4 font-semibold">{team.name}</td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-semibold text-[#2563EB]">{team.latestAllocation.equity}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-semibold text-[#DC2626]">{team.latestAllocation.debt}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-semibold text-[#F97316]">{team.latestAllocation.gold}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-semibold text-[#16A34A]">{team.latestAllocation.cash}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Historical Allocations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {teamsWithReturns.map((team) => (
                      <div key={team.id} className="space-y-3">
                        <h4 className="font-semibold text-lg">{team.name}</h4>
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-3 font-medium">Round</th>
                                <th className="text-right p-3 font-medium">Equity</th>
                                <th className="text-right p-3 font-medium">Debt</th>
                                <th className="text-right p-3 font-medium">Gold</th>
                                <th className="text-right p-3 font-medium">Cash</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t">
                                <td className="p-3">Round 1</td>
                                <td className="p-3 text-right font-mono">25%</td>
                                <td className="p-3 text-right font-mono">25%</td>
                                <td className="p-3 text-right font-mono">25%</td>
                                <td className="p-3 text-right font-mono">25%</td>
                              </tr>
                              <tr className="border-t">
                                <td className="p-3">Round 2</td>
                                <td className="p-3 text-right font-mono">35%</td>
                                <td className="p-3 text-right font-mono">30%</td>
                                <td className="p-3 text-right font-mono">20%</td>
                                <td className="p-3 text-right font-mono">15%</td>
                              </tr>
                              <tr className="border-t bg-muted/30">
                                <td className="p-3 font-semibold">Round 3 (Current)</td>
                                <td className="p-3 text-right font-mono font-semibold">{team.latestAllocation.equity}%</td>
                                <td className="p-3 text-right font-mono font-semibold">{team.latestAllocation.debt}%</td>
                                <td className="p-3 text-right font-mono font-semibold">{team.latestAllocation.gold}%</td>
                                <td className="p-3 text-right font-mono font-semibold">{team.latestAllocation.cash}%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ResetGameModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        onConfirm={handleResetGame}
      />
    </div>
  );
}
