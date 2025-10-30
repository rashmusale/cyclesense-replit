import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface RoundInputCardProps {
  teamId: number;
  teamName: string;
  data: TeamInputData;
  onChange: (teamId: number, data: TeamInputData) => void;
}

const emotionTokens = ['Confidence', 'Discipline', 'Patience', 'Conviction', 'Adaptability'];

export default function RoundInputCard({ teamId, teamName, data, onChange }: RoundInputCardProps) {
  const allocationSum = data.allocationEquity + data.allocationDebt + data.allocationGold + data.allocationCash;
  const isAllocationValid = Math.abs(allocationSum - 100) < 0.01;

  const handleChange = (field: keyof TeamInputData, value: number | string) => {
    onChange(teamId, { ...data, [field]: value });
  };

  return (
    <Card data-testid={`card-team-input-${teamId}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold" data-testid={`text-team-name-${teamId}`}>
          {teamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">Portfolio Allocation (%)</Label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label htmlFor={`equity-${teamId}`} className="text-xs text-muted-foreground">Equity</Label>
              <Input
                id={`equity-${teamId}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={data.allocationEquity}
                onChange={(e) => handleChange('allocationEquity', parseFloat(e.target.value) || 0)}
                data-testid={`input-equity-${teamId}`}
              />
            </div>
            <div>
              <Label htmlFor={`debt-${teamId}`} className="text-xs text-muted-foreground">Debt</Label>
              <Input
                id={`debt-${teamId}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={data.allocationDebt}
                onChange={(e) => handleChange('allocationDebt', parseFloat(e.target.value) || 0)}
                data-testid={`input-debt-${teamId}`}
              />
            </div>
            <div>
              <Label htmlFor={`gold-${teamId}`} className="text-xs text-muted-foreground">Gold</Label>
              <Input
                id={`gold-${teamId}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={data.allocationGold}
                onChange={(e) => handleChange('allocationGold', parseFloat(e.target.value) || 0)}
                data-testid={`input-gold-${teamId}`}
              />
            </div>
            <div>
              <Label htmlFor={`cash-${teamId}`} className="text-xs text-muted-foreground">Cash</Label>
              <Input
                id={`cash-${teamId}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={data.allocationCash}
                onChange={(e) => handleChange('allocationCash', parseFloat(e.target.value) || 0)}
                data-testid={`input-cash-${teamId}`}
              />
            </div>
          </div>
          <p className={`text-xs mt-2 ${isAllocationValid ? 'text-muted-foreground' : 'text-destructive font-semibold'}`}>
            Total: {allocationSum.toFixed(1)}% {!isAllocationValid && '(must equal 100%)'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`rebalance-${teamId}`} className="text-sm font-medium">Rebalance % (0-20)</Label>
            <Input
              id={`rebalance-${teamId}`}
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={data.rebalancePct}
              onChange={(e) => handleChange('rebalancePct', Math.min(20, parseFloat(e.target.value) || 0))}
              data-testid={`input-rebalance-${teamId}`}
            />
          </div>

          <div>
            <Label htmlFor={`emotion-token-${teamId}`} className="text-sm font-medium">Emotion Token</Label>
            <Select 
              value={data.emotionToken} 
              onValueChange={(value) => handleChange('emotionToken', value)}
            >
              <SelectTrigger id={`emotion-token-${teamId}`} data-testid={`select-emotion-${teamId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emotionTokens.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`pitch-${teamId}`} className="text-sm font-medium">Pitch Points (0-5)</Label>
            <Input
              id={`pitch-${teamId}`}
              type="number"
              min="0"
              max="5"
              step="1"
              value={data.pitchPoints}
              onChange={(e) => handleChange('pitchPoints', Math.min(5, parseInt(e.target.value) || 0))}
              data-testid={`input-pitch-${teamId}`}
            />
          </div>

          <div>
            <Label htmlFor={`emotion-${teamId}`} className="text-sm font-medium">Emotion Points (0-5)</Label>
            <Input
              id={`emotion-${teamId}`}
              type="number"
              min="0"
              max="5"
              step="1"
              value={data.emotionPoints}
              onChange={(e) => handleChange('emotionPoints', Math.min(5, parseInt(e.target.value) || 0))}
              data-testid={`input-emotion-points-${teamId}`}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`return-${teamId}`} className="text-sm font-medium">Portfolio Return (%)</Label>
          <Input
            id={`return-${teamId}`}
            type="number"
            step="0.01"
            value={data.portfolioReturn}
            onChange={(e) => handleChange('portfolioReturn', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 2.5 or -1.0"
            className="text-lg font-mono"
            data-testid={`input-return-${teamId}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
