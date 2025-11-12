import type {
  GameState,
  InsertGameState,
  Team,
  InsertTeam,
  ColorCard,
  InsertColorCard,
  BlackCard,
  InsertBlackCard,
  Round,
  InsertRound,
  TeamAllocation,
  InsertTeamAllocation,
} from "@shared/schema";

// Storage keys
const KEYS = {
  GAME_STATE: 'cyclesense_game_state',
  TEAMS: 'cyclesense_teams',
  ROUNDS: 'cyclesense_rounds',
  ALLOCATIONS: 'cyclesense_allocations',
  COLOR_CARDS: 'cyclesense_color_cards',
  BLACK_CARDS: 'cyclesense_black_cards',
} as const;

// Helper to generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get data from localStorage
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper to save data to localStorage
function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

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

export class LocalStorageService implements IStorage {
  // ============ GAME STATE ============
  
  async getGameState(): Promise<GameState | undefined> {
    const states = getFromStorage<GameState>(KEYS.GAME_STATE);
    return states[0]; // Singleton
  }

  async createGameState(insertState: InsertGameState): Promise<GameState> {
    const id = generateId();
    const state: GameState = {
      id,
      mode: insertState.mode,
      currentRound: insertState.currentRound ?? 0,
      isActive: insertState.isActive ?? false,
    };
    
    // Replace existing state (singleton)
    saveToStorage(KEYS.GAME_STATE, [state]);
    return state;
  }

  async updateGameState(id: string, updates: Partial<InsertGameState>): Promise<GameState | undefined> {
    const states = getFromStorage<GameState>(KEYS.GAME_STATE);
    const state = states.find(s => s.id === id);
    if (!state) return undefined;
    
    const updated: GameState = { ...state, ...updates };
    saveToStorage(KEYS.GAME_STATE, [updated]);
    return updated;
  }

  async resetGame(): Promise<void> {
    localStorage.removeItem(KEYS.GAME_STATE);
    localStorage.removeItem(KEYS.TEAMS);
    localStorage.removeItem(KEYS.ROUNDS);
    localStorage.removeItem(KEYS.ALLOCATIONS);
  }

  // ============ TEAMS ============
  
  async getAllTeams(): Promise<Team[]> {
    return getFromStorage<Team>(KEYS.TEAMS);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const teams = getFromStorage<Team>(KEYS.TEAMS);
    return teams.find(t => t.id === id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = generateId();
    const team: Team = {
      id,
      name: insertTeam.name,
      currentNav: '10.00',
      pitchTotal: 0,
      emotionTotal: 0,
      initialEquity: insertTeam.initialEquity ?? 25,
      initialDebt: insertTeam.initialDebt ?? 25,
      initialGold: insertTeam.initialGold ?? 25,
      initialCash: insertTeam.initialCash ?? 25,
    };
    
    const teams = getFromStorage<Team>(KEYS.TEAMS);
    teams.push(team);
    saveToStorage(KEYS.TEAMS, teams);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Omit<Team, 'id'>>): Promise<Team | undefined> {
    const teams = getFromStorage<Team>(KEYS.TEAMS);
    const index = teams.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    const updated: Team = { ...teams[index], ...updates };
    teams[index] = updated;
    saveToStorage(KEYS.TEAMS, teams);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const teams = getFromStorage<Team>(KEYS.TEAMS);
    const filtered = teams.filter(t => t.id !== id);
    if (filtered.length === teams.length) return false;
    
    saveToStorage(KEYS.TEAMS, filtered);
    return true;
  }

  async deleteAllTeams(): Promise<void> {
    localStorage.removeItem(KEYS.TEAMS);
  }

  // ============ COLOR CARDS ============
  
  async getAllColorCards(): Promise<ColorCard[]> {
    return getFromStorage<ColorCard>(KEYS.COLOR_CARDS);
  }

  async getColorCardsByPhase(phase: string): Promise<ColorCard[]> {
    const cards = getFromStorage<ColorCard>(KEYS.COLOR_CARDS);
    return cards.filter(c => c.phase === phase);
  }

  async getColorCard(id: string): Promise<ColorCard | undefined> {
    const cards = getFromStorage<ColorCard>(KEYS.COLOR_CARDS);
    return cards.find(c => c.id === id);
  }

  async createColorCard(insertCard: InsertColorCard): Promise<ColorCard> {
    const id = generateId();
    const card: ColorCard = { 
      ...insertCard, 
      id,
      imageUrl: insertCard.imageUrl ?? null,
    };
    
    const cards = getFromStorage<ColorCard>(KEYS.COLOR_CARDS);
    cards.push(card);
    saveToStorage(KEYS.COLOR_CARDS, cards);
    return card;
  }

  async deleteAllColorCards(): Promise<void> {
    localStorage.removeItem(KEYS.COLOR_CARDS);
  }

  async bulkCreateColorCards(cards: InsertColorCard[]): Promise<ColorCard[]> {
    if (cards.length === 0) return [];
    
    const newCards: ColorCard[] = cards.map(card => ({
      ...card,
      id: generateId(),
      imageUrl: card.imageUrl ?? null,
    }));
    
    const existing = getFromStorage<ColorCard>(KEYS.COLOR_CARDS);
    saveToStorage(KEYS.COLOR_CARDS, [...existing, ...newCards]);
    return newCards;
  }

  // ============ BLACK CARDS ============
  
  async getAllBlackCards(): Promise<BlackCard[]> {
    return getFromStorage<BlackCard>(KEYS.BLACK_CARDS);
  }

  async getBlackCard(id: string): Promise<BlackCard | undefined> {
    const cards = getFromStorage<BlackCard>(KEYS.BLACK_CARDS);
    return cards.find(c => c.id === id);
  }

  async createBlackCard(insertCard: InsertBlackCard): Promise<BlackCard> {
    const id = generateId();
    const card: BlackCard = { 
      ...insertCard, 
      id,
      imageUrl: insertCard.imageUrl ?? null,
    };
    
    const cards = getFromStorage<BlackCard>(KEYS.BLACK_CARDS);
    cards.push(card);
    saveToStorage(KEYS.BLACK_CARDS, cards);
    return card;
  }

  async deleteAllBlackCards(): Promise<void> {
    localStorage.removeItem(KEYS.BLACK_CARDS);
  }

  async bulkCreateBlackCards(cards: InsertBlackCard[]): Promise<BlackCard[]> {
    if (cards.length === 0) return [];
    
    const newCards: BlackCard[] = cards.map(card => ({
      ...card,
      id: generateId(),
      imageUrl: card.imageUrl ?? null,
    }));
    
    const existing = getFromStorage<BlackCard>(KEYS.BLACK_CARDS);
    saveToStorage(KEYS.BLACK_CARDS, [...existing, ...newCards]);
    return newCards;
  }

  // ============ ROUNDS ============
  
  async getAllRounds(): Promise<Round[]> {
    const rounds = getFromStorage<Round>(KEYS.ROUNDS);
    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  }

  async getRound(id: string): Promise<Round | undefined> {
    const rounds = getFromStorage<Round>(KEYS.ROUNDS);
    return rounds.find(r => r.id === id);
  }

  async getCurrentRound(): Promise<Round | undefined> {
    const gameState = await this.getGameState();
    if (!gameState) return undefined;
    
    const rounds = await this.getAllRounds();
    return rounds.find(r => r.roundNumber === gameState.currentRound);
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = generateId();
    const round: Round = {
      ...insertRound,
      id,
      blackCardId: insertRound.blackCardId ?? null,
    };
    
    const rounds = getFromStorage<Round>(KEYS.ROUNDS);
    rounds.push(round);
    saveToStorage(KEYS.ROUNDS, rounds);
    return round;
  }

  async updateRound(id: string, updates: Partial<InsertRound>): Promise<Round | undefined> {
    const rounds = getFromStorage<Round>(KEYS.ROUNDS);
    const index = rounds.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    const updated: Round = { ...rounds[index], ...updates };
    rounds[index] = updated;
    saveToStorage(KEYS.ROUNDS, rounds);
    return updated;
  }

  // ============ TEAM ALLOCATIONS ============
  
  async getAllocationsForRound(roundId: string): Promise<TeamAllocation[]> {
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    return allocations.filter(a => a.roundId === roundId);
  }

  async getAllocationsForTeam(teamId: string): Promise<TeamAllocation[]> {
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    const rounds = await this.getAllRounds();
    
    return allocations
      .filter(a => a.teamId === teamId)
      .sort((a, b) => {
        const roundA = rounds.find(r => r.id === a.roundId);
        const roundB = rounds.find(r => r.id === b.roundId);
        if (!roundA || !roundB) return 0;
        return roundA.roundNumber - roundB.roundNumber;
      });
  }

  async getTeamAllocation(id: string): Promise<TeamAllocation | undefined> {
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    return allocations.find(a => a.id === id);
  }

  async createTeamAllocation(insertAllocation: InsertTeamAllocation): Promise<TeamAllocation> {
    const id = generateId();
    const allocation: TeamAllocation = {
      ...insertAllocation,
      id,
      pitchScore: insertAllocation.pitchScore ?? 0,
      emotionScore: insertAllocation.emotionScore ?? 0,
    };
    
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    allocations.push(allocation);
    saveToStorage(KEYS.ALLOCATIONS, allocations);
    return allocation;
  }

  async updateTeamAllocation(id: string, updates: Partial<InsertTeamAllocation>): Promise<TeamAllocation | undefined> {
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    const index = allocations.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    const updated: TeamAllocation = { ...allocations[index], ...updates };
    allocations[index] = updated;
    saveToStorage(KEYS.ALLOCATIONS, allocations);
    return updated;
  }

  async deleteAllocationsForRound(roundId: string): Promise<void> {
    const allocations = getFromStorage<TeamAllocation>(KEYS.ALLOCATIONS);
    const allocationsToDelete = allocations.filter(a => a.roundId === roundId);
    
    // Rollback team NAV totals to pre-round state before deleting
    for (const alloc of allocationsToDelete) {
      const team = await this.getTeam(alloc.teamId);
      if (team) {
        await this.updateTeam(team.id, {
          currentNav: alloc.navBefore,
          pitchTotal: team.pitchTotal - alloc.pitchScore,
        });
      }
    }
    
    const remaining = allocations.filter(a => a.roundId !== roundId);
    saveToStorage(KEYS.ALLOCATIONS, remaining);
  }
}

// Export singleton instance
export const storageService = new LocalStorageService();
