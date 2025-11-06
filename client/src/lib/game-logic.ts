import type { ColorCard, BlackCard, TeamAllocation } from "@shared/schema";
import { storageService } from "./storage";

/**
 * Calculate weighted return from color card and allocation percentages
 */
export function calculateWeightedReturn(
  allocation: { equity: number; debt: number; gold: number; cash: number },
  colorCard: ColorCard
): number {
  const equityReturn = parseFloat(colorCard.equityReturn);
  const debtReturn = parseFloat(colorCard.debtReturn);
  const goldReturn = parseFloat(colorCard.goldReturn);
  const cashReturn = parseFloat(colorCard.cashReturn);

  return (
    (allocation.equity / 100) * equityReturn +
    (allocation.debt / 100) * debtReturn +
    (allocation.gold / 100) * goldReturn +
    (allocation.cash / 100) * cashReturn
  );
}

/**
 * Calculate NAV after applying color card returns and pitch/emotion scores
 * Formula: NAV After = NAV Before × (1 + Weighted Return / 100) + Pitch Score + Emotion Score
 */
export function calculateNavAfterColorCard(
  navBefore: number,
  weightedReturn: number,
  pitchScore: number = 0,
  emotionScore: number = 0
): number {
  return navBefore * (1 + weightedReturn / 100) + pitchScore + emotionScore;
}

/**
 * Calculate total modifier from black card and allocation percentages
 */
export function calculateBlackCardModifier(
  allocation: { equity: number; debt: number; gold: number; cash: number },
  blackCard: BlackCard
): number {
  const equityMod = parseFloat(blackCard.equityModifier);
  const debtMod = parseFloat(blackCard.debtModifier);
  const goldMod = parseFloat(blackCard.goldModifier);
  const cashMod = parseFloat(blackCard.cashModifier);

  return (
    (allocation.equity / 100) * equityMod +
    (allocation.debt / 100) * debtMod +
    (allocation.gold / 100) * goldMod +
    (allocation.cash / 100) * cashMod
  );
}

/**
 * Calculate final NAV after applying black card modifier
 * Formula: Final NAV = NAV After Color Card × (1 + Total Modifier / 100)
 */
export function calculateNavAfterBlackCard(
  navAfterColorCard: number,
  totalModifier: number
): number {
  return navAfterColorCard * (1 + totalModifier / 100);
}

/**
 * Calculate complete NAV for a team allocation with color card and optional black card
 */
export async function calculateTeamNav(params: {
  navBefore: number;
  allocation: { equity: number; debt: number; gold: number; cash: number };
  colorCardId: string;
  blackCardId?: string | null;
  pitchScore?: number;
  emotionScore?: number;
}): Promise<number> {
  const { navBefore, allocation, colorCardId, blackCardId, pitchScore = 0, emotionScore = 0 } = params;

  // Get color card
  const colorCard = await storageService.getColorCard(colorCardId);
  if (!colorCard) {
    throw new Error("Color card not found");
  }

  // Calculate weighted return
  const weightedReturn = calculateWeightedReturn(allocation, colorCard);

  // Calculate NAV after color card
  let navAfter = calculateNavAfterColorCard(navBefore, weightedReturn, pitchScore, emotionScore);

  // Apply black card if present
  if (blackCardId) {
    const blackCard = await storageService.getBlackCard(blackCardId);
    if (blackCard) {
      const totalModifier = calculateBlackCardModifier(allocation, blackCard);
      navAfter = calculateNavAfterBlackCard(navAfter, totalModifier);
    }
  }

  return navAfter;
}

/**
 * Draw a random color card for virtual mode
 * Returns both the randomly selected phase and the card
 */
export async function drawRandomColorCard(): Promise<{
  phase: string;
  card: ColorCard;
}> {
  const phases = ["green", "blue", "orange", "red"];
  const selectedPhase = phases[Math.floor(Math.random() * 4)];

  const phaseCards = await storageService.getColorCardsByPhase(selectedPhase);
  if (phaseCards.length === 0) {
    throw new Error(`No cards found for ${selectedPhase} phase`);
  }

  const randomCard = phaseCards[Math.floor(Math.random() * phaseCards.length)];
  return { phase: selectedPhase, card: randomCard };
}

/**
 * Draw a random black card
 */
export async function drawRandomBlackCard(): Promise<BlackCard> {
  const blackCards = await storageService.getAllBlackCards();
  if (blackCards.length === 0) {
    throw new Error("No black cards available");
  }

  return blackCards[Math.floor(Math.random() * blackCards.length)];
}

/**
 * Create team allocation with automatic NAV calculation
 */
export async function createTeamAllocationWithNav(params: {
  teamId: string;
  roundId: string;
  equity: number;
  debt: number;
  gold: number;
  cash: number;
  pitchScore?: number;
  emotionScore?: number;
}): Promise<TeamAllocation> {
  const { teamId, roundId, equity, debt, gold, cash, pitchScore = 0, emotionScore = 0 } = params;

  // Validate allocation totals 100%
  const total = equity + debt + gold + cash;
  if (total !== 100) {
    throw new Error(`Allocations must total 100% (got ${total}%)`);
  }

  // Get team's current NAV
  const team = await storageService.getTeam(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const navBefore = parseFloat(team.currentNav);

  // Get round and color card
  const round = await storageService.getRound(roundId);
  if (!round) {
    throw new Error("Round not found");
  }

  // Calculate final NAV
  const navAfter = await calculateTeamNav({
    navBefore,
    allocation: { equity, debt, gold, cash },
    colorCardId: round.colorCardId,
    blackCardId: round.blackCardId,
    pitchScore,
    emotionScore,
  });

  // Create allocation
  const allocation = await storageService.createTeamAllocation({
    teamId,
    roundId,
    equity,
    debt,
    gold,
    cash,
    pitchScore,
    emotionScore,
    navBefore: navBefore.toFixed(2),
    navAfter: navAfter.toFixed(2),
  });

  // Update team's current NAV and totals
  await storageService.updateTeam(teamId, {
    currentNav: navAfter.toFixed(2),
    pitchTotal: team.pitchTotal + pitchScore,
    emotionTotal: team.emotionTotal + emotionScore,
  });

  return allocation;
}

/**
 * Apply black card modifiers to all allocations in a round
 */
export async function applyBlackCardToRound(roundId: string, blackCardId: string): Promise<void> {
  const blackCard = await storageService.getBlackCard(blackCardId);
  if (!blackCard) {
    throw new Error("Black card not found");
  }

  const allocations = await storageService.getAllocationsForRound(roundId);

  for (const allocation of allocations) {
    const currentNav = parseFloat(allocation.navAfter);

    // Calculate modifier effect
    const totalModifier = calculateBlackCardModifier(
      {
        equity: allocation.equity,
        debt: allocation.debt,
        gold: allocation.gold,
        cash: allocation.cash,
      },
      blackCard
    );

    const finalNav = calculateNavAfterBlackCard(currentNav, totalModifier);

    // Update allocation
    await storageService.updateTeamAllocation(allocation.id, {
      navAfter: finalNav.toFixed(2),
    });

    // Update team's NAV
    await storageService.updateTeam(allocation.teamId, {
      currentNav: finalNav.toFixed(2),
    });
  }
}
