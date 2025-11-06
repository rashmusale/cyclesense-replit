import { storageService } from "./storage";
import { sampleColorCards, sampleBlackCards } from "./sample-cards";

/**
 * Initialize default cards on first app load
 * Only loads cards if localStorage is empty
 */
export async function initializeDefaultData(): Promise<void> {
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
