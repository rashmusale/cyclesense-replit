import { 
  type GameState, 
  type InsertGameState,
  type Team, 
  type InsertTeam,
  type ColorCard,
  type InsertColorCard,
  type BlackCard,
  type InsertBlackCard,
  type Round,
  type InsertRound,
  type TeamAllocation,
  type InsertTeamAllocation,
  colorCards,
  blackCards
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Game State
  getGameState(): Promise<GameState | undefined>;
  createGameState(state: InsertGameState): Promise<GameState>;
  updateGameState(id: string, updates: Partial<InsertGameState>): Promise<GameState | undefined>;
  resetGame(): Promise<void>;
  
  // Teams
  getAllTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Omit<Team, 'id'>>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
  deleteAllTeams(): Promise<void>;
  
  // Color Cards
  getAllColorCards(): Promise<ColorCard[]>;
  getColorCardsByPhase(phase: string): Promise<ColorCard[]>;
  getColorCard(id: string): Promise<ColorCard | undefined>;
  createColorCard(card: InsertColorCard): Promise<ColorCard>;
  deleteAllColorCards(): Promise<void>;
  bulkCreateColorCards(cards: InsertColorCard[]): Promise<ColorCard[]>;
  
  // Black Cards
  getAllBlackCards(): Promise<BlackCard[]>;
  getBlackCard(id: string): Promise<BlackCard | undefined>;
  createBlackCard(card: InsertBlackCard): Promise<BlackCard>;
  deleteAllBlackCards(): Promise<void>;
  bulkCreateBlackCards(cards: InsertBlackCard[]): Promise<BlackCard[]>;
  
  // Rounds
  getAllRounds(): Promise<Round[]>;
  getRound(id: string): Promise<Round | undefined>;
  getCurrentRound(): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: string, updates: Partial<InsertRound>): Promise<Round | undefined>;
  
  // Team Allocations
  getAllocationsForRound(roundId: string): Promise<TeamAllocation[]>;
  getAllocationsForTeam(teamId: string): Promise<TeamAllocation[]>;
  getTeamAllocation(id: string): Promise<TeamAllocation | undefined>;
  createTeamAllocation(allocation: InsertTeamAllocation): Promise<TeamAllocation>;
  updateTeamAllocation(id: string, updates: Partial<InsertTeamAllocation>): Promise<TeamAllocation | undefined>;
  deleteAllocationsForRound(roundId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private gameStates: Map<string, GameState>;
  private teams: Map<string, Team>;
  private rounds: Map<string, Round>;
  private teamAllocations: Map<string, TeamAllocation>;

  constructor() {
    this.gameStates = new Map();
    this.teams = new Map();
    this.rounds = new Map();
    this.teamAllocations = new Map();
  }

  // Game State
  async getGameState(): Promise<GameState | undefined> {
    const states = Array.from(this.gameStates.values());
    return states[0]; // Singleton
  }

  async createGameState(insertState: InsertGameState): Promise<GameState> {
    const id = randomUUID();
    const state: GameState = { 
      id,
      mode: insertState.mode,
      currentRound: insertState.currentRound ?? 0,
      isActive: insertState.isActive ?? false
    };
    this.gameStates.set(id, state);
    return state;
  }

  async updateGameState(id: string, updates: Partial<InsertGameState>): Promise<GameState | undefined> {
    const state = this.gameStates.get(id);
    if (!state) return undefined;
    const updated: GameState = { ...state, ...updates };
    this.gameStates.set(id, updated);
    return updated;
  }

  async resetGame(): Promise<void> {
    this.gameStates.clear();
    this.teams.clear();
    this.rounds.clear();
    this.teamAllocations.clear();
  }

  // Teams
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { 
      ...insertTeam, 
      id,
      currentNav: '10.00',
      pitchTotal: 0,
      emotionTotal: 0
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Omit<Team, 'id'>>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updated: Team = { ...team, ...updates };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  async deleteAllTeams(): Promise<void> {
    this.teams.clear();
  }

  // Color Cards - DATABASE BACKED
  async getAllColorCards(): Promise<ColorCard[]> {
    return await db.select().from(colorCards);
  }

  async getColorCardsByPhase(phase: string): Promise<ColorCard[]> {
    return await db.select().from(colorCards).where(eq(colorCards.phase, phase));
  }

  async getColorCard(id: string): Promise<ColorCard | undefined> {
    const results = await db.select().from(colorCards).where(eq(colorCards.id, id));
    return results[0];
  }

  async createColorCard(insertCard: InsertColorCard): Promise<ColorCard> {
    const [card] = await db.insert(colorCards).values(insertCard).returning();
    return card;
  }

  async deleteAllColorCards(): Promise<void> {
    await db.delete(colorCards);
  }

  async bulkCreateColorCards(cards: InsertColorCard[]): Promise<ColorCard[]> {
    if (cards.length === 0) return [];
    return await db.insert(colorCards).values(cards).returning();
  }

  // Black Cards - DATABASE BACKED
  async getAllBlackCards(): Promise<BlackCard[]> {
    return await db.select().from(blackCards);
  }

  async getBlackCard(id: string): Promise<BlackCard | undefined> {
    const results = await db.select().from(blackCards).where(eq(blackCards.id, id));
    return results[0];
  }

  async createBlackCard(insertCard: InsertBlackCard): Promise<BlackCard> {
    const [card] = await db.insert(blackCards).values(insertCard).returning();
    return card;
  }

  async deleteAllBlackCards(): Promise<void> {
    await db.delete(blackCards);
  }

  async bulkCreateBlackCards(cards: InsertBlackCard[]): Promise<BlackCard[]> {
    if (cards.length === 0) return [];
    return await db.insert(blackCards).values(cards).returning();
  }

  // Rounds
  async getAllRounds(): Promise<Round[]> {
    return Array.from(this.rounds.values()).sort((a, b) => a.roundNumber - b.roundNumber);
  }

  async getRound(id: string): Promise<Round | undefined> {
    return this.rounds.get(id);
  }

  async getCurrentRound(): Promise<Round | undefined> {
    const gameState = await this.getGameState();
    if (!gameState) return undefined;
    const rounds = await this.getAllRounds();
    return rounds.find(r => r.roundNumber === gameState.currentRound);
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = randomUUID();
    const round: Round = { 
      ...insertRound, 
      id,
      blackCardId: insertRound.blackCardId ?? null
    };
    this.rounds.set(id, round);
    return round;
  }

  async updateRound(id: string, updates: Partial<InsertRound>): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    const updated: Round = { ...round, ...updates };
    this.rounds.set(id, updated);
    return updated;
  }

  // Team Allocations
  async getAllocationsForRound(roundId: string): Promise<TeamAllocation[]> {
    return Array.from(this.teamAllocations.values()).filter(a => a.roundId === roundId);
  }

  async getAllocationsForTeam(teamId: string): Promise<TeamAllocation[]> {
    return Array.from(this.teamAllocations.values())
      .filter(a => a.teamId === teamId)
      .sort((a, b) => {
        // Sort by round number
        const roundA = this.rounds.get(a.roundId);
        const roundB = this.rounds.get(b.roundId);
        if (!roundA || !roundB) return 0;
        return roundA.roundNumber - roundB.roundNumber;
      });
  }

  async getTeamAllocation(id: string): Promise<TeamAllocation | undefined> {
    return this.teamAllocations.get(id);
  }

  async createTeamAllocation(insertAllocation: InsertTeamAllocation): Promise<TeamAllocation> {
    const id = randomUUID();
    const allocation: TeamAllocation = { 
      ...insertAllocation, 
      id,
      pitchScore: insertAllocation.pitchScore ?? 0,
      emotionScore: insertAllocation.emotionScore ?? 0
    };
    this.teamAllocations.set(id, allocation);
    return allocation;
  }

  async updateTeamAllocation(id: string, updates: Partial<InsertTeamAllocation>): Promise<TeamAllocation | undefined> {
    const allocation = this.teamAllocations.get(id);
    if (!allocation) return undefined;
    const updated: TeamAllocation = { ...allocation, ...updates };
    this.teamAllocations.set(id, updated);
    return updated;
  }

  async deleteAllocationsForRound(roundId: string): Promise<void> {
    const allocationsToDelete = Array.from(this.teamAllocations.values())
      .filter(a => a.roundId === roundId);
    
    // Rollback team NAV totals to pre-round state before deleting
    for (const alloc of allocationsToDelete) {
      const team = this.teams.get(alloc.teamId);
      if (team) {
        // Restore team to the state before this round was calculated
        team.currentNav = alloc.navBefore;
        team.pitchTotal = team.pitchTotal - alloc.pitchScore;
        team.emotionTotal = team.emotionTotal - alloc.emotionScore;
        this.teams.set(team.id, team);
      }
      this.teamAllocations.delete(alloc.id);
    }
  }
}

export const storage = new MemStorage();
