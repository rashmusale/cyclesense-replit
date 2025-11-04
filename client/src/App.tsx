import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import GameSetup from "@/pages/GameSetup";
import ConfigureTeams from "@/pages/ConfigureTeams";
import StartRound from "@/pages/StartRound";
import TeamInput from "@/pages/TeamInput";
import RoundSummary from "@/pages/RoundSummary";
import ManageCards from "@/pages/ManageCards";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/game-setup" component={GameSetup} />
      <Route path="/configure-teams" component={ConfigureTeams} />
      <Route path="/start-round" component={StartRound} />
      <Route path="/team-input" component={TeamInput} />
      <Route path="/round-summary" component={RoundSummary} />
      <Route path="/manage-cards" component={ManageCards} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
