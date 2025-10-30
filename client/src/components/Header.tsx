import { Button } from "@/components/ui/button";
import logoUrl from "@assets/CycleSense LOGO_1761839230730.png";

interface HeaderProps {
  currentRound?: number;
  onNewRound?: () => void;
  onConfigureTeams?: () => void;
  onNewGame?: () => void;
}

export default function Header({ currentRound, onNewRound, onConfigureTeams, onNewGame }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="CycleSense" className="h-10 w-10" />
            <h1 className="text-2xl font-bold">CycleSense Leaderboard</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {currentRound !== undefined && currentRound > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-card rounded-md border border-card-border">
                <span className="text-sm font-medium text-muted-foreground">Round</span>
                <span className="text-lg font-bold font-mono">{currentRound}</span>
              </div>
            )}
            
            {onNewGame && (
              <Button 
                variant="outline" 
                onClick={onNewGame}
                data-testid="button-new-game"
              >
                New Game
              </Button>
            )}
            
            {onConfigureTeams && (
              <Button 
                variant="outline" 
                onClick={onConfigureTeams}
                data-testid="button-configure-teams"
              >
                Configure Teams
              </Button>
            )}
            
            {onNewRound && (
              <Button 
                onClick={onNewRound}
                data-testid="button-new-round"
              >
                Start Next Round
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
