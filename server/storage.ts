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
  type InsertTeamAllocation
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  // Black Cards
  getAllBlackCards(): Promise<BlackCard[]>;
  getBlackCard(id: string): Promise<BlackCard | undefined>;
  createBlackCard(card: InsertBlackCard): Promise<BlackCard>;
  
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
}

export class MemStorage implements IStorage {
  private gameStates: Map<string, GameState>;
  private teams: Map<string, Team>;
  private colorCards: Map<string, ColorCard>;
  private blackCards: Map<string, BlackCard>;
  private rounds: Map<string, Round>;
  private teamAllocations: Map<string, TeamAllocation>;

  constructor() {
    this.gameStates = new Map();
    this.teams = new Map();
    this.colorCards = new Map();
    this.blackCards = new Map();
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

  // Color Cards
  async getAllColorCards(): Promise<ColorCard[]> {
    return Array.from(this.colorCards.values());
  }

  async getColorCardsByPhase(phase: string): Promise<ColorCard[]> {
    return Array.from(this.colorCards.values()).filter(card => card.phase === phase);
  }

  async getColorCard(id: string): Promise<ColorCard | undefined> {
    return this.colorCards.get(id);
  }

  async createColorCard(insertCard: InsertColorCard): Promise<ColorCard> {
    const id = randomUUID();
    const card: ColorCard = { 
      ...insertCard, 
      id,
      imageUrl: insertCard.imageUrl ?? null
    };
    this.colorCards.set(id, card);
    return card;
  }

  // Black Cards
  async getAllBlackCards(): Promise<BlackCard[]> {
    return Array.from(this.blackCards.values());
  }

  async getBlackCard(id: string): Promise<BlackCard | undefined> {
    return this.blackCards.get(id);
  }

  async createBlackCard(insertCard: InsertBlackCard): Promise<BlackCard> {
    const id = randomUUID();
    const card: BlackCard = { 
      ...insertCard, 
      id,
      imageUrl: insertCard.imageUrl ?? null
    };
    this.blackCards.set(id, card);
    return card;
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
}

export const storage = new MemStorage();
