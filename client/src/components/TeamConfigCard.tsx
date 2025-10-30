import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface Team {
  id: number;
  name: string;
  navCurrent: number;
}

interface TeamConfigCardProps {
  team: Team;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onResetNav: (id: number) => void;
}

export default function TeamConfigCard({ team, onUpdate, onDelete, onResetNav }: TeamConfigCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(team.id, editName);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(team.name);
    setIsEditing(false);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-team-${team.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`team-name-${team.id}`} className="sr-only">Team Name</Label>
                <Input
                  id={`team-name-${team.id}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                  data-testid={`input-team-name-${team.id}`}
                />
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleSave}
                data-testid={`button-save-${team.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleCancel}
                data-testid={`button-cancel-${team.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h3 className="text-lg font-semibold" data-testid={`text-team-name-${team.id}`}>
                  {team.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current NAV: <span className="font-mono font-bold" data-testid={`text-nav-${team.id}`}>{team.navCurrent.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onResetNav(team.id)}
                  data-testid={`button-reset-nav-${team.id}`}
                >
                  Reset NAV
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)}
                  data-testid={`button-edit-${team.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => onDelete(team.id)}
                  data-testid={`button-delete-${team.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
