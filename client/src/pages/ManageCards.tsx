import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ColorCard, InsertColorCard, BlackCard, InsertBlackCard } from "@shared/schema";
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

interface ParsedColorCard {
  cardNumber: string;
  cardText: string;
  equityReturn: string;
  debtReturn: string;
  goldReturn: string;
  cashReturn: string;
  phase?: string;
}

interface ParsedBlackCard {
  cardNumber: string;
  cardText: string;
  equityModifier: string;
  debtModifier: string;
  goldModifier: string;
  cashModifier: string;
}

export default function ManageCards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Color Cards state
  const [colorPastedData, setColorPastedData] = useState("");
  const [parsedColorCards, setParsedColorCards] = useState<ParsedColorCard[]>([]);
  const [showColorPreview, setShowColorPreview] = useState(false);
  const [deleteColorDialogOpen, setDeleteColorDialogOpen] = useState(false);
  
  // Black Cards state
  const [blackPastedData, setBlackPastedData] = useState("");
  const [parsedBlackCards, setParsedBlackCards] = useState<ParsedBlackCard[]>([]);
  const [showBlackPreview, setShowBlackPreview] = useState(false);
  const [deleteBlackDialogOpen, setDeleteBlackDialogOpen] = useState(false);

  const { data: existingColorCards = [] } = useQuery<ColorCard[]>({
    queryKey: ["/api/color-cards"],
  });

  const { data: existingBlackCards = [] } = useQuery<BlackCard[]>({
    queryKey: ["/api/black-cards"],
  });

  // Color Cards mutations
  const deleteAllColorMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/color-cards", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-cards"] });
      toast({
        title: "All Color Cards Deleted",
        description: "All existing color cards have been removed",
      });
      setDeleteColorDialogOpen(false);
    },
  });

  const bulkImportColorMutation = useMutation({
    mutationFn: async (cards: InsertColorCard[]) => {
      const response = await apiRequest("POST", "/api/color-cards/bulk", cards);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-cards"] });
      toast({
        title: "Color Cards Imported Successfully",
        description: `Imported ${data.length} color cards`,
      });
      setColorPastedData("");
      setParsedColorCards([]);
      setShowColorPreview(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import cards. Please check your data.",
        variant: "destructive",
      });
    },
  });

  // Black Cards mutations
  const deleteAllBlackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/black-cards", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/black-cards"] });
      toast({
        title: "All Black Cards Deleted",
        description: "All existing black cards have been removed",
      });
      setDeleteBlackDialogOpen(false);
    },
  });

  const bulkImportBlackMutation = useMutation({
    mutationFn: async (cards: InsertBlackCard[]) => {
      const response = await apiRequest("POST", "/api/black-cards/bulk", cards);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/black-cards"] });
      toast({
        title: "Black Cards Imported Successfully",
        description: `Imported ${data.length} black cards`,
      });
      setBlackPastedData("");
      setParsedBlackCards([]);
      setShowBlackPreview(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import cards. Please check your data.",
        variant: "destructive",
      });
    },
  });

  const parseColorData = () => {
    if (!colorPastedData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste data from Excel",
        variant: "destructive",
      });
      return;
    }

    const lines = colorPastedData.trim().split("\n");
    const parsed: ParsedColorCard[] = [];
    let startLine = 0;

    // Auto-detect and skip header row
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      const headerKeywords = ["card number", "card text", "equity", "debt", "gold", "cash", "return", "modifier"];
      const matchCount = headerKeywords.filter(keyword => firstLine.includes(keyword)).length;
      if (matchCount >= 3) {
        startLine = 1;
        toast({
          title: "Header Detected",
          description: "Skipping first row (header row)",
        });
      }
    }

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

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

      // Auto-detect phase from card number prefix
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

    setParsedColorCards(parsed);
    setShowColorPreview(true);
    toast({
      title: "Data Parsed Successfully",
      description: `Found ${parsed.length} color cards`,
    });
  };

  const parseBlackData = () => {
    if (!blackPastedData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste data from Excel",
        variant: "destructive",
      });
      return;
    }

    const lines = blackPastedData.trim().split("\n");
    const parsed: ParsedBlackCard[] = [];
    let startLine = 0;

    // Auto-detect and skip header row
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      const headerKeywords = ["card number", "card text", "equity", "debt", "gold", "cash", "modifier"];
      const matchCount = headerKeywords.filter(keyword => firstLine.includes(keyword)).length;
      if (matchCount >= 3) {
        startLine = 1;
        toast({
          title: "Header Detected",
          description: "Skipping first row (header row)",
        });
      }
    }

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      
      if (parts.length < 6) {
        toast({
          title: "Parse Error",
          description: `Line ${i + 1} has only ${parts.length} columns. Expected 6 columns: Card Number, Card Text, Equity Modifier, Debt Modifier, Gold Modifier, Cash Modifier`,
          variant: "destructive",
        });
        return;
      }

      const cardNumber = parts[0].trim();
      const cardText = parts[1].trim();
      const equityModifier = parts[2].trim();
      const debtModifier = parts[3].trim();
      const goldModifier = parts[4].trim();
      const cashModifier = parts[5].trim();

      // Validate numeric fields
      const numericFields = [
        { name: "Equity Modifier", value: equityModifier },
        { name: "Debt Modifier", value: debtModifier },
        { name: "Gold Modifier", value: goldModifier },
        { name: "Cash Modifier", value: cashModifier },
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

      parsed.push({
        cardNumber,
        cardText,
        equityModifier,
        debtModifier,
        goldModifier,
        cashModifier,
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

    setParsedBlackCards(parsed);
    setShowBlackPreview(true);
    toast({
      title: "Data Parsed Successfully",
      description: `Found ${parsed.length} black cards`,
    });
  };

  const updatePhase = (index: number, phase: string) => {
    const updated = [...parsedColorCards];
    updated[index].phase = phase;
    setParsedColorCards(updated);
  };

  const handleColorImport = () => {
    const cardsToImport: InsertColorCard[] = parsedColorCards.map((card) => ({
      cardNumber: card.cardNumber,
      phase: card.phase || "green",
      title: card.cardNumber,
      cardText: card.cardText,
      equityReturn: card.equityReturn,
      debtReturn: card.debtReturn,
      goldReturn: card.goldReturn,
      cashReturn: card.cashReturn,
      imageUrl: null,
    }));

    bulkImportColorMutation.mutate(cardsToImport);
  };

  const handleBlackImport = () => {
    const cardsToImport: InsertBlackCard[] = parsedBlackCards.map((card) => ({
      cardNumber: card.cardNumber,
      title: card.cardNumber,
      cardText: card.cardText,
      equityModifier: card.equityModifier,
      debtModifier: card.debtModifier,
      goldModifier: card.goldModifier,
      cashModifier: card.cashModifier,
      imageUrl: null,
    }));

    bulkImportBlackMutation.mutate(cardsToImport);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Cards</h1>
            <p className="text-muted-foreground">
              Import card data from Excel or view existing cards
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back">
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="color" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="color" data-testid="tab-color-cards">
              Color Cards
            </TabsTrigger>
            <TabsTrigger value="black" data-testid="tab-black-cards">
              Black Cards
            </TabsTrigger>
          </TabsList>

          {/* COLOR CARDS TAB */}
          <TabsContent value="color">
            {/* Current Cards Summary */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Color Cards</CardTitle>
                  {existingColorCards.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteColorDialogOpen(true)}
                      data-testid="button-delete-all-color"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Color Cards
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{existingColorCards.length} Cards</div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div>Green: {existingColorCards.filter(c => c.phase === "green").length}</div>
                  <div>Blue: {existingColorCards.filter(c => c.phase === "blue").length}</div>
                  <div>Orange: {existingColorCards.filter(c => c.phase === "orange").length}</div>
                  <div>Red: {existingColorCards.filter(c => c.phase === "red").length}</div>
                </div>
              </CardContent>
            </Card>

            {/* Import Interface */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Color Cards from Excel
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
                    placeholder="Paste your Excel data here (tab-separated or comma-separated)&#10;Example:&#10;G1	Bull Market Rally	15.00	2.00	-3.00	1.00&#10;B1	Steady Growth	5.00	4.00	3.00	2.50&#10;O1	Market Volatility	-5.00	3.00	8.00	2.00"
                    value={colorPastedData}
                    onChange={(e) => setColorPastedData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="textarea-paste-color-data"
                  />

                  <div className="flex gap-3">
                    <Button onClick={parseColorData} data-testid="button-parse-color">
                      <Table2 className="w-4 h-4 mr-2" />
                      Parse Data
                    </Button>
                    {colorPastedData && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setColorPastedData("");
                          setParsedColorCards([]);
                          setShowColorPreview(false);
                        }}
                        data-testid="button-clear-color"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview & Import */}
            {showColorPreview && parsedColorCards.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Preview ({parsedColorCards.length} cards)
                    </CardTitle>
                    <Button
                      onClick={handleColorImport}
                      disabled={bulkImportColorMutation.isPending}
                      data-testid="button-import-color"
                    >
                      {bulkImportColorMutation.isPending ? "Importing..." : "Import Color Cards"}
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
                          {parsedColorCards.map((card, idx) => (
                            <tr key={idx} className="border-t" data-testid={`row-color-preview-${idx}`}>
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
          </TabsContent>

          {/* BLACK CARDS TAB */}
          <TabsContent value="black">
            {/* Current Cards Summary */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Black Cards</CardTitle>
                  {existingBlackCards.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteBlackDialogOpen(true)}
                      data-testid="button-delete-all-black"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Black Cards
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{existingBlackCards.length} Cards</div>
              </CardContent>
            </Card>

            {/* Import Interface */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Black Cards from Excel
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
                      <li>Columns: Card Number, Card Text, Equity Modifier, Debt Modifier, Gold Modifier, Cash Modifier</li>
                      <li>Black cards typically start with "W" in the card number</li>
                      <li>Headers are automatically detected and skipped</li>
                    </ul>
                  </div>

                  <Textarea
                    placeholder="Paste your Excel data here (tab-separated or comma-separated)&#10;Example:&#10;W1	Market Crash	-10.00	5.00	15.00	0.00&#10;W2	Policy Change	5.00	-5.00	0.00	0.00"
                    value={blackPastedData}
                    onChange={(e) => setBlackPastedData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="textarea-paste-black-data"
                  />

                  <div className="flex gap-3">
                    <Button onClick={parseBlackData} data-testid="button-parse-black">
                      <Table2 className="w-4 h-4 mr-2" />
                      Parse Data
                    </Button>
                    {blackPastedData && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBlackPastedData("");
                          setParsedBlackCards([]);
                          setShowBlackPreview(false);
                        }}
                        data-testid="button-clear-black"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview & Import */}
            {showBlackPreview && parsedBlackCards.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Preview ({parsedBlackCards.length} cards)
                    </CardTitle>
                    <Button
                      onClick={handleBlackImport}
                      disabled={bulkImportBlackMutation.isPending}
                      data-testid="button-import-black"
                    >
                      {bulkImportBlackMutation.isPending ? "Importing..." : "Import Black Cards"}
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
                            <th className="text-left p-3 font-semibold">Card Text</th>
                            <th className="text-right p-3 font-semibold">Equity Mod</th>
                            <th className="text-right p-3 font-semibold">Debt Mod</th>
                            <th className="text-right p-3 font-semibold">Gold Mod</th>
                            <th className="text-right p-3 font-semibold">Cash Mod</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedBlackCards.map((card, idx) => (
                            <tr key={idx} className="border-t" data-testid={`row-black-preview-${idx}`}>
                              <td className="p-3 font-mono">{card.cardNumber}</td>
                              <td className="p-3 max-w-md truncate">{card.cardText}</td>
                              <td className="p-3 text-right font-mono">{card.equityModifier}</td>
                              <td className="p-3 text-right font-mono">{card.debtModifier}</td>
                              <td className="p-3 text-right font-mono">{card.goldModifier}</td>
                              <td className="p-3 text-right font-mono">{card.cashModifier}</td>
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
                <p>• Black cards are special market events that modify asset returns</p>
                <p>• Modifiers should be entered as decimals (e.g., -10.00 for -10%, 5.00 for +5%)</p>
                <p>• These modifiers are added to the base returns from color cards</p>
                <p>• Importing new cards will add to existing cards. Use "Delete All Cards" first to replace the entire deck</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialogs */}
        <AlertDialog open={deleteColorDialogOpen} onOpenChange={setDeleteColorDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Color Cards?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {existingColorCards.length} color cards. This action cannot be undone.
                You can re-import cards after deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-color">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAllColorMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-color"
              >
                {deleteAllColorMutation.isPending ? "Deleting..." : "Delete All Color Cards"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteBlackDialogOpen} onOpenChange={setDeleteBlackDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Black Cards?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {existingBlackCards.length} black cards. This action cannot be undone.
                You can re-import cards after deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-black">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAllBlackMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-black"
              >
                {deleteAllBlackMutation.isPending ? "Deleting..." : "Delete All Black Cards"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
