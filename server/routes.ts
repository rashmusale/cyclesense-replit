import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStateSchema, insertTeamSchema, insertRoundSchema, insertTeamAllocationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============ GAME STATE ROUTES ============
  
  // Get current game state
  app.get("/api/game-state", async (req, res) => {
    const state = await storage.getGameState();
    res.json(state);
  });

  // Initialize new game
  app.post("/api/game-state", async (req, res) => {
    try {
      const data = insertGameStateSchema.parse(req.body);
      // Reset everything first
      await storage.resetGame();
      const state = await storage.createGameState(data);
      res.json(state);
    } catch (error) {
      res.status(400).json({ error: "Invalid game state data" });
    }
  });

  // Update game state
  app.patch("/api/game-state/:id", async (req, res) => {
    const updated = await storage.updateGameState(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Game state not found" });
      return;
    }
    res.json(updated);
  });

  // Reset entire game
  app.post("/api/game/reset", async (req, res) => {
    await storage.resetGame();
    res.json({ success: true });
  });

  // ============ TEAM ROUTES ============
  
  // Get all teams
  app.get("/api/teams", async (req, res) => {
    const teams = await storage.getAllTeams();
    res.json(teams);
  });

  // Get single team
  app.get("/api/teams/:id", async (req, res) => {
    const team = await storage.getTeam(req.params.id);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json(team);
  });

  // Create team
  app.post("/api/teams", async (req, res) => {
    try {
      const data = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(data);
      res.json(team);
    } catch (error) {
      res.status(400).json({ error: "Invalid team data" });
    }
  });

  // Update team
  app.patch("/api/teams/:id", async (req, res) => {
    const updated = await storage.updateTeam(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json(updated);
  });

  // Delete team
  app.delete("/api/teams/:id", async (req, res) => {
    const deleted = await storage.deleteTeam(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json({ success: true });
  });

  // ============ COLOR CARD ROUTES ============
  
  // Get all color cards
  app.get("/api/color-cards", async (req, res) => {
    const cards = await storage.getAllColorCards();
    res.json(cards);
  });

  // Get color cards by phase
  app.get("/api/color-cards/phase/:phase", async (req, res) => {
    const cards = await storage.getColorCardsByPhase(req.params.phase);
    res.json(cards);
  });

  // Get single color card
  app.get("/api/color-cards/:id", async (req, res) => {
    const card = await storage.getColorCard(req.params.id);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.json(card);
  });

  // ============ BLACK CARD ROUTES ============
  
  // Get all black cards
  app.get("/api/black-cards", async (req, res) => {
    const cards = await storage.getAllBlackCards();
    res.json(cards);
  });

  // Get single black card
  app.get("/api/black-cards/:id", async (req, res) => {
    const card = await storage.getBlackCard(req.params.id);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.json(card);
  });

  // ============ ROUND ROUTES ============
  
  // Get all rounds
  app.get("/api/rounds", async (req, res) => {
    const rounds = await storage.getAllRounds();
    res.json(rounds);
  });

  // Get current round
  app.get("/api/rounds/current", async (req, res) => {
    const round = await storage.getCurrentRound();
    res.json(round);
  });

  // Get single round
  app.get("/api/rounds/:id", async (req, res) => {
    const round = await storage.getRound(req.params.id);
    if (!round) {
      res.status(404).json({ error: "Round not found" });
      return;
    }
    res.json(round);
  });

  // Draw color card (server-side card selection)
  app.post("/api/rounds/draw-card", async (req, res) => {
    try {
      const { phase, isVirtual } = req.body;
      
      // In virtual mode, randomly select phase
      let selectedPhase = phase;
      if (isVirtual) {
        const phases = ["green", "blue", "orange", "red"];
        selectedPhase = phases[Math.floor(Math.random() * 4)];
      }

      if (!selectedPhase) {
        res.status(400).json({ error: "Phase is required" });
        return;
      }

      // Get all cards for this phase and randomly select one
      const phaseCards = await storage.getColorCardsByPhase(selectedPhase);
      if (phaseCards.length === 0) {
        res.status(404).json({ error: `No cards found for ${selectedPhase} phase` });
        return;
      }

      const randomCard = phaseCards[Math.floor(Math.random() * phaseCards.length)];
      res.json({ phase: selectedPhase, card: randomCard });
    } catch (error) {
      res.status(500).json({ error: "Failed to draw card" });
    }
  });

  // Create new round
  app.post("/api/rounds", async (req, res) => {
    try {
      const data = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(data);
      
      // Update game state current round
      const gameState = await storage.getGameState();
      if (gameState) {
        await storage.updateGameState(gameState.id, { 
          currentRound: data.roundNumber,
          isActive: true 
        });
      }
      
      res.json(round);
    } catch (error) {
      res.status(400).json({ error: "Invalid round data" });
    }
  });

  // Update round (e.g., add black card)
  app.patch("/api/rounds/:id", async (req, res) => {
    const updated = await storage.updateRound(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Round not found" });
      return;
    }
    res.json(updated);
  });

  // ============ TEAM ALLOCATION ROUTES ============
  
  // Get allocations for a round
  app.get("/api/allocations/round/:roundId", async (req, res) => {
    const allocations = await storage.getAllocationsForRound(req.params.roundId);
    res.json(allocations);
  });

  // Get allocations for a team
  app.get("/api/allocations/team/:teamId", async (req, res) => {
    const allocations = await storage.getAllocationsForTeam(req.params.teamId);
    res.json(allocations);
  });

  // Create team allocation with automatic NAV calculation
  app.post("/api/allocations", async (req, res) => {
    try {
      // Validate allocation totals 100%
      const { equity, debt, gold, cash, teamId, roundId, pitchScore, emotionScore } = req.body;
      const total = equity + debt + gold + cash;
      if (total !== 100) {
        res.status(400).json({ error: `Allocations must total 100% (got ${total}%)` });
        return;
      }

      // Get team's current NAV
      const team = await storage.getTeam(teamId);
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }
      
      const navBefore = parseFloat(team.currentNav);

      // Get round and color card for returns
      const round = await storage.getRound(roundId);
      if (!round) {
        res.status(404).json({ error: "Round not found" });
        return;
      }

      const colorCard = await storage.getColorCard(round.colorCardId);
      if (!colorCard) {
        res.status(404).json({ error: "Color card not found" });
        return;
      }

      // Calculate NAV after color card returns
      const equityReturn = parseFloat(colorCard.equityReturn);
      const debtReturn = parseFloat(colorCard.debtReturn);
      const goldReturn = parseFloat(colorCard.goldReturn);
      const cashReturn = parseFloat(colorCard.cashReturn);
      
      const weightedReturn = (
        (equity / 100) * equityReturn +
        (debt / 100) * debtReturn +
        (gold / 100) * goldReturn +
        (cash / 100) * cashReturn
      );
      
      let navAfter = navBefore * (1 + weightedReturn / 100);

      // Apply black card if present
      if (round.blackCardId) {
        const blackCard = await storage.getBlackCard(round.blackCardId);
        if (blackCard) {
          const equityMod = parseFloat(blackCard.equityModifier);
          const debtMod = parseFloat(blackCard.debtModifier);
          const goldMod = parseFloat(blackCard.goldModifier);
          const cashMod = parseFloat(blackCard.cashModifier);
          
          const totalModifier = (
            (equity / 100) * equityMod +
            (debt / 100) * debtMod +
            (gold / 100) * goldMod +
            (cash / 100) * cashMod
          );
          
          navAfter = navAfter * (1 + totalModifier / 100);
        }
      }

      // Create allocation with calculated NAV
      const allocation = await storage.createTeamAllocation({
        teamId,
        roundId,
        equity,
        debt,
        gold,
        cash,
        pitchScore: pitchScore || 0,
        emotionScore: emotionScore || 0,
        navBefore: navBefore.toFixed(2),
        navAfter: navAfter.toFixed(2)
      });

      // Update team's current NAV and totals
      await storage.updateTeam(teamId, {
        currentNav: navAfter.toFixed(2),
        pitchTotal: team.pitchTotal + (pitchScore || 0),
        emotionTotal: team.emotionTotal + (emotionScore || 0)
      });

      res.json(allocation);
    } catch (error) {
      res.status(400).json({ error: "Invalid allocation data" });
    }
  });

  // Update team allocation (for pitch/emotion scores)
  app.patch("/api/allocations/:id", async (req, res) => {
    const updated = await storage.updateTeamAllocation(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Allocation not found" });
      return;
    }
    res.json(updated);
  });

  // ============ SCORING ENGINE ============
  
  // Calculate and apply round scores
  app.post("/api/rounds/:roundId/calculate-scores", async (req, res) => {
    try {
      const round = await storage.getRound(req.params.roundId);
      if (!round) {
        res.status(404).json({ error: "Round not found" });
        return;
      }

      const colorCard = await storage.getColorCard(round.colorCardId);
      if (!colorCard) {
        res.status(404).json({ error: "Color card not found" });
        return;
      }

      const allocations = await storage.getAllocationsForRound(req.params.roundId);
      
      // Calculate NAV for each team based on allocations and card returns
      for (const allocation of allocations) {
        const navBefore = parseFloat(allocation.navBefore);
        
        // Calculate weighted return
        const equityReturn = parseFloat(colorCard.equityReturn);
        const debtReturn = parseFloat(colorCard.debtReturn);
        const goldReturn = parseFloat(colorCard.goldReturn);
        const cashReturn = parseFloat(colorCard.cashReturn);
        
        const weightedReturn = (
          (allocation.equity / 100) * equityReturn +
          (allocation.debt / 100) * debtReturn +
          (allocation.gold / 100) * goldReturn +
          (allocation.cash / 100) * cashReturn
        );
        
        const navAfter = navBefore * (1 + weightedReturn / 100);
        
        // Update allocation with new NAV
        await storage.updateTeamAllocation(allocation.id, {
          navAfter: navAfter.toFixed(2)
        });
        
        // Update team's current NAV and scores
        const team = await storage.getTeam(allocation.teamId);
        if (team) {
          await storage.updateTeam(allocation.teamId, {
            currentNav: navAfter.toFixed(2),
            pitchTotal: team.pitchTotal + allocation.pitchScore,
            emotionTotal: team.emotionTotal + allocation.emotionScore
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Score calculation failed" });
    }
  });

  // Apply black card modifiers
  app.post("/api/rounds/:roundId/apply-black-card", async (req, res) => {
    try {
      const round = await storage.getRound(req.params.roundId);
      if (!round || !round.blackCardId) {
        res.status(404).json({ error: "Round or black card not found" });
        return;
      }

      const blackCard = await storage.getBlackCard(round.blackCardId);
      if (!blackCard) {
        res.status(404).json({ error: "Black card not found" });
        return;
      }

      const allocations = await storage.getAllocationsForRound(req.params.roundId);
      
      // Apply black card modifiers to each team's NAV
      for (const allocation of allocations) {
        const currentNav = parseFloat(allocation.navAfter);
        
        // Calculate modifier effect
        const equityMod = parseFloat(blackCard.equityModifier);
        const debtMod = parseFloat(blackCard.debtModifier);
        const goldMod = parseFloat(blackCard.goldModifier);
        const cashMod = parseFloat(blackCard.cashModifier);
        
        const totalModifier = (
          (allocation.equity / 100) * equityMod +
          (allocation.debt / 100) * debtMod +
          (allocation.gold / 100) * goldMod +
          (allocation.cash / 100) * cashMod
        );
        
        const finalNav = currentNav * (1 + totalModifier / 100);
        
        // Update allocation
        await storage.updateTeamAllocation(allocation.id, {
          navAfter: finalNav.toFixed(2)
        });
        
        // Update team's NAV
        await storage.updateTeam(allocation.teamId, {
          currentNav: finalNav.toFixed(2)
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Black card application failed" });
    }
  });

  // Reset game
  app.post("/api/game/reset", async (req, res) => {
    try {
      // Clear all allocations
      const allocations = await storage.getAllAllocations();
      for (const alloc of allocations) {
        await storage.deleteTeamAllocation(alloc.id.toString());
      }

      // Clear all rounds
      const rounds = await storage.getAllRounds();
      for (const round of rounds) {
        await storage.deleteRound(round.id.toString());
      }

      // Reset all teams to initial state
      const teams = await storage.getAllTeams();
      for (const team of teams) {
        await storage.updateTeam(team.id, {
          currentNav: "10.00",
          pitchTotal: 0,
          emotionTotal: 0
        });
      }

      // Reset game state
      const gameState = await storage.getGameState();
      if (gameState) {
        await storage.updateGameState(gameState.id, {
          currentRound: 0,
          isActive: true
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset game" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
