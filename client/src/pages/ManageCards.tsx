import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ColorCard, InsertColorCard } from "@shared/schema";
import { Table2, Upload, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ParsedCard {
  cardNumber: string;
  cardText: string;
  equityReturn: string;
  debtReturn: string;
  goldReturn: string;
  cashReturn: string;
  phase?: string;
}

export default function ManageCards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pastedData, setPastedData] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: existingCards = [] } = useQuery<ColorCard[]>({
    queryKey: ["/api/color-cards"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/color-cards", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-cards"] });
      toast({
        title: "All Cards Deleted",
        description: "All existing color cards have been removed",
      });
      setDeleteDialogOpen(false);
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (cards: InsertColorCard[]) => {
      const response = await apiRequest("POST", "/api/color-cards/bulk", cards);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-cards"] });
      toast({
        title: "Cards Imported Successfully",
        description: `Imported ${data.length} color cards`,
      });
      setPastedData("");
      setParsedCards([]);
      setShowPreview(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import cards. Please check your data.",
        variant: "destructive",
      });
    },
  });

  const parseData = () => {
    if (!pastedData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste data from Excel",
        variant: "destructive",
      });
      return;
    }

    const lines = pastedData.trim().split("\n");
    const parsed: ParsedCard[] = [];
    let startLine = 0;

    // Auto-detect and skip header row
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      const headerKeywords = ["card number", "card text", "equity", "debt", "gold", "cash", "return"];
      const matchCount = headerKeywords.filter(keyword => firstLine.includes(keyword)).length;
      if (matchCount >= 3) {
        startLine = 1; // Skip first line (header)
        toast({
          title: "Header Detected",
          description: "Skipping first row (header row)",
        });
      }
    }

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Support both tab-separated and comma-separated
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      
      if (parts.length < 6) {
        toast({
          title: "Parse Error",
          description: `Line ${i + 1} has only ${parts.length} columns. Expected 6 columns: Card Number, Card Text, Equity Return, Debt Return, Gold Return, Cash Return`,
          variant: "destructive",
        });
        return;
      }

      const cardNumber = parts[0].trim();
      const cardText = parts[1].trim();
      const equityReturn = parts[2].trim();
      const debtReturn = parts[3].trim();
      const goldReturn = parts[4].trim();
      const cashReturn = parts[5].trim();

      // Validate numeric fields
      const numericFields = [
        { name: "Equity Return", value: equityReturn },
        { name: "Debt Return", value: debtReturn },
        { name: "Gold Return", value: goldReturn },
        { name: "Cash Return", value: cashReturn },
      ];

      for (const field of numericFields) {
        if (isNaN(parseFloat(field.value))) {
          toast({
            title: "Invalid Data",
            description: `Line ${i + 1}: ${field.name} "${field.value}" is not a valid number`,
            variant: "destructive",
          });
          return;
        }
      }

      // Auto-detect phase from card number prefix (G=green, B=blue, O=orange, R=red)
      let phase = "green";
      const firstChar = cardNumber.charAt(0).toUpperCase();
      if (firstChar === "G") phase = "green";
      else if (firstChar === "B") phase = "blue";
      else if (firstChar === "O") phase = "orange";
      else if (firstChar === "R") phase = "red";

      parsed.push({
        cardNumber,
        cardText,
        equityReturn,
        debtReturn,
        goldReturn,
        cashReturn,
        phase,
      });
    }

    if (parsed.length === 0) {
      toast({
        title: "No Data Found",
        description: "No valid card data was found. Please check your input.",
        variant: "destructive",
      });
      return;
    }

    setParsedCards(parsed);
    setShowPreview(true);
    toast({
      title: "Data Parsed Successfully",
      description: `Found ${parsed.length} cards`,
    });
  };

  const updatePhase = (index: number, phase: string) => {
    const updated = [...parsedCards];
    updated[index].phase = phase;
    setParsedCards(updated);
  };

  const handleImport = () => {
    const cardsToImport: InsertColorCard[] = parsedCards.map((card) => ({
      cardNumber: card.cardNumber,
      phase: card.phase || "green",
      title: card.cardNumber, // Using card number as title
      cardText: card.cardText,
      equityReturn: card.equityReturn,
      debtReturn: card.debtReturn,
      goldReturn: card.goldReturn,
      cashReturn: card.cashReturn,
      imageUrl: null,
    }));

    bulkImportMutation.mutate(cardsToImport);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Color Cards</h1>
            <p className="text-muted-foreground">
              Import card data from Excel or view existing cards
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back">
            Back to Dashboard
          </Button>
        </div>

        {/* Current Cards Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Cards</CardTitle>
              {existingCards.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  data-testid="button-delete-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Cards
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{existingCards.length} Cards</div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div>Green: {existingCards.filter(c => c.phase === "green").length}</div>
              <div>Blue: {existingCards.filter(c => c.phase === "blue").length}</div>
              <div>Orange: {existingCards.filter(c => c.phase === "orange").length}</div>
              <div>Red: {existingCards.filter(c => c.phase === "red").length}</div>
            </div>
          </CardContent>
        </Card>

        {/* Import Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import from Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Instructions:</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>In Excel, select your card data (6 columns, with or without headers)</li>
                  <li>Copy the data (Ctrl+C or Cmd+C)</li>
                  <li>Paste it into the box below</li>
                  <li>Columns: Card Number, Card Text, Equity Return, Debt Return, Gold Return, Cash Return</li>
                  <li>Phase is auto-detected from card number (G=Green, B=Blue, O=Orange, R=Red)</li>
                  <li>Headers are automatically detected and skipped</li>
                </ul>
              </div>

              <Textarea
                placeholder="Paste your Excel data here (tab-separated or comma-separated)&#10;Example:&#10;G1  Bull Market Rally       15.00   2.00    -3.00   1.00&#10;B1     Steady Growth   5.00    4.00    3.00    2.50&#10;O1     Market Volatility       -5.00   3.00    8.00    2.00"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-paste-data"
              />

              <div className="flex gap-3">
                <Button onClick={parseData} data-testid="button-parse">
                  <Table2 className="w-4 h-4 mr-2" />
                  Parse Data
                </Button>
                {pastedData && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPastedData("");
                      setParsedCards([]);
                      setShowPreview(false);
                    }}
                    data-testid="button-clear"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview & Import */}
        {showPreview && parsedCards.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Preview ({parsedCards.length} cards)
                </CardTitle>
                <Button
                  onClick={handleImport}
                  disabled={bulkImportMutation.isPending}
                  data-testid="button-import"
                >
                  {bulkImportMutation.isPending ? "Importing..." : "Import Cards"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold">Card #</th>
                        <th className="text-left p-3 font-semibold">Phase</th>
                        <th className="text-left p-3 font-semibold">Card Text</th>
                        <th className="text-right p-3 font-semibold">Equity %</th>
                        <th className="text-right p-3 font-semibold">Debt %</th>
                        <th className="text-right p-3 font-semibold">Gold %</th>
                        <th className="text-right p-3 font-semibold">Cash %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCards.map((card, idx) => (
                        <tr key={idx} className="border-t" data-testid={`row-preview-${idx}`}>
                          <td className="p-3 font-mono">{card.cardNumber}</td>
                          <td className="p-3">
                            <Select
                              value={card.phase}
                              onValueChange={(value) => updatePhase(idx, value)}
                            >
                              <SelectTrigger className="w-28" data-testid={`select-phase-${idx}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="orange">Orange</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 max-w-md truncate">{card.cardText}</td>
                          <td className="p-3 text-right font-mono">{card.equityReturn}</td>
                          <td className="p-3 text-right font-mono">{card.debtReturn}</td>
                          <td className="p-3 text-right font-mono">{card.goldReturn}</td>
                          <td className="p-3 text-right font-mono">{card.cashReturn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Card numbers starting with G, B, O, or R will auto-detect the phase (Green, Blue, Orange, Red)</p>
            <p>• Returns should be entered as decimals (e.g., 15.00 for 15%, -5.00 for -5%)</p>
            <p>• You can adjust the phase for each card in the preview table before importing</p>
            <p>• Importing new cards will add to existing cards. Use "Delete All Cards" first to replace the entire deck</p>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Color Cards?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {existingCards.length} color cards. This action cannot be undone.
                You can re-import cards after deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAllMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteAllMutation.isPending ? "Deleting..." : "Delete All Cards"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
