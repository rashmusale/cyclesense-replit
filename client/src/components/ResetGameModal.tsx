import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ResetGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (keepTeams: boolean) => void;
}

export default function ResetGameModal({ open, onOpenChange, onConfirm }: ResetGameModalProps) {
  const [keepTeams, setKeepTeams] = useState(true);

  const handleConfirm = () => {
    onConfirm(keepTeams);
    onOpenChange(false);
    setKeepTeams(true);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="modal-reset-game">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Reset Game</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>This will clear all round data from the current game. This action cannot be undone.</p>
            
            <div className="flex items-center gap-2 py-3">
              <Checkbox 
                id="keep-teams" 
                checked={keepTeams}
                onCheckedChange={(checked) => setKeepTeams(checked as boolean)}
                data-testid="checkbox-keep-teams"
              />
              <Label 
                htmlFor="keep-teams" 
                className="text-sm font-medium cursor-pointer"
              >
                Keep teams (clear rounds only)
              </Label>
            </div>

            {!keepTeams && (
              <p className="text-sm text-destructive font-semibold">
                ⚠️ All teams and rounds will be permanently deleted
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-reset"
          >
            Reset Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
