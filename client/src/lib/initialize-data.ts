import { storageService } from "./storage";
import { sampleColorCards, sampleBlackCards } from "./sample-cards";

/**
 * Initialize default data on first app load
 * Creates default game state and cards if localStorage is empty
 */
export async function initializeDefaultData(): Promise<void> {
  // Initialize game state if it doesn't exist
  const existingGameState = await storageService.getGameState();
  if (!existingGameState) {
    console.log("Initializing default game state...");
    await storageService.createGameState({
      id: crypto.randomUUID(),
      isActive: false,
      mode: "virtual",
      currentRound: 0,
      numberOfTeams: 0,
    });
  }

  const existingColorCards = await storageService.getAllColorCards();
  const existingBlackCards = await storageService.getAllBlackCards();

  // Only initialize if no cards exist
  if (existingColorCards.length === 0) {
    console.log("Initializing default color cards...");
    await storageService.bulkCreateColorCards(sampleColorCards);
    console.log(`Loaded ${sampleColorCards.length} color cards`);
  }

  if (existingBlackCards.length === 0) {
    console.log("Initializing default black cards...");
    await storageService.bulkCreateBlackCards(sampleBlackCards);
    console.log(`Loaded ${sampleBlackCards.length} black cards`);
  }
}
