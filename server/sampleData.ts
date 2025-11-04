import { storage } from "./storage";
import type { InsertColorCard, InsertBlackCard } from "@shared/schema";

// Sample Color Cards for each phase
const sampleColorCards: InsertColorCard[] = [
  // GREEN Phase Cards (Bull Market)
  {
    cardNumber: "G1",
    phase: "green",
    title: "Bull Market Rally",
    cardText: "Markets surge on strong economic data. Equity markets hit all-time highs.",
    equityReturn: "15.00",
    debtReturn: "2.00",
    goldReturn: "-3.00",
    cashReturn: "1.00",
    imageUrl: null
  },
  {
    cardNumber: "G2",
    phase: "green",
    title: "Tech Boom",
    cardText: "Technology sector leads market gains. Innovation drives investor confidence.",
    equityReturn: "12.00",
    debtReturn: "3.00",
    goldReturn: "-2.00",
    cashReturn: "1.50",
    imageUrl: null
  },
  {
    cardNumber: "G3",
    phase: "green",
    title: "Economic Expansion",
    cardText: "GDP growth exceeds expectations. Consumer spending reaches record levels.",
    equityReturn: "10.00",
    debtReturn: "4.00",
    goldReturn: "0.00",
    cashReturn: "2.00",
    imageUrl: null
  },
  
  // BLUE Phase Cards (Stable Market)
  {
    cardNumber: "B1",
    phase: "blue",
    title: "Steady Growth",
    cardText: "Markets move sideways with balanced economic indicators.",
    equityReturn: "5.00",
    debtReturn: "4.00",
    goldReturn: "3.00",
    cashReturn: "2.50",
    imageUrl: null
  },
  {
    cardNumber: "B2",
    phase: "blue",
    title: "Policy Stability",
    cardText: "Central banks maintain status quo. Markets digest recent gains.",
    equityReturn: "6.00",
    debtReturn: "5.00",
    goldReturn: "2.00",
    cashReturn: "2.00",
    imageUrl: null
  },
  {
    cardNumber: "B3",
    phase: "blue",
    title: "Balanced Portfolio",
    cardText: "Diversification pays off as all asset classes show modest gains.",
    equityReturn: "4.00",
    debtReturn: "4.00",
    goldReturn: "4.00",
    cashReturn: "3.00",
    imageUrl: null
  },
  
  // ORANGE Phase Cards (Market Correction)
  {
    cardNumber: "O1",
    phase: "orange",
    title: "Market Volatility",
    cardText: "Uncertainty drives investors to safer assets. Equity markets face headwinds.",
    equityReturn: "-5.00",
    debtReturn: "3.00",
    goldReturn: "8.00",
    cashReturn: "2.00",
    imageUrl: null
  },
  {
    cardNumber: "O2",
    phase: "orange",
    title: "Profit Taking",
    cardText: "Investors book profits after prolonged rally. Defensive assets gain favor.",
    equityReturn: "-3.00",
    debtReturn: "4.00",
    goldReturn: "6.00",
    cashReturn: "2.50",
    imageUrl: null
  },
  {
    cardNumber: "O3",
    phase: "orange",
    title: "Trade Tensions",
    cardText: "Global trade concerns weigh on markets. Safe havens see inflows.",
    equityReturn: "-6.00",
    debtReturn: "2.00",
    goldReturn: "10.00",
    cashReturn: "3.00",
    imageUrl: null
  },
  
  // RED Phase Cards (Bear Market)
  {
    cardNumber: "R1",
    phase: "red",
    title: "Market Crash",
    cardText: "Panic selling grips markets. Flight to safety as fear dominates.",
    equityReturn: "-15.00",
    debtReturn: "-2.00",
    goldReturn: "15.00",
    cashReturn: "5.00",
    imageUrl: null
  },
  {
    cardNumber: "R2",
    phase: "red",
    title: "Recession Alert",
    cardText: "Economic indicators point to downturn. Only cash and gold preserve value.",
    equityReturn: "-12.00",
    debtReturn: "-5.00",
    goldReturn: "12.00",
    cashReturn: "4.00",
    imageUrl: null
  },
  {
    cardNumber: "R3",
    phase: "red",
    title: "Credit Crisis",
    cardText: "Debt markets freeze. Liquidity is king as all risky assets tumble.",
    equityReturn: "-18.00",
    debtReturn: "-8.00",
    goldReturn: "10.00",
    cashReturn: "6.00",
    imageUrl: null
  },
];

// Sample Black Cards (market events/modifiers)
const sampleBlackCards: InsertBlackCard[] = [
  {
    cardNumber: "BC1",
    title: "Interest Rate Hike",
    cardText: "Central bank raises rates unexpectedly. Debt and equity markets react negatively.",
    equityModifier: "-3.00",
    debtModifier: "-4.00",
    goldModifier: "2.00",
    cashModifier: "3.00",
    imageUrl: null
  },
  {
    cardNumber: "BC2",
    title: "Currency Devaluation",
    cardText: "Local currency weakens significantly. Gold and foreign cash holdings gain value.",
    equityModifier: "2.00",
    debtModifier: "-2.00",
    goldModifier: "8.00",
    cashModifier: "5.00",
    imageUrl: null
  },
  {
    cardNumber: "BC3",
    title: "Corporate Scandal",
    cardText: "Major corporate fraud shakes investor confidence across equity markets.",
    equityModifier: "-6.00",
    debtModifier: "1.00",
    goldModifier: "3.00",
    cashModifier: "2.00",
    imageUrl: null
  },
  {
    cardNumber: "BC4",
    title: "Commodity Boom",
    cardText: "Gold prices surge on supply concerns. Precious metals rally continues.",
    equityModifier: "1.00",
    debtModifier: "0.00",
    goldModifier: "12.00",
    cashModifier: "-1.00",
    imageUrl: null
  },
  {
    cardNumber: "BC5",
    title: "Fiscal Stimulus",
    cardText: "Government announces massive spending package. Markets celebrate new liquidity.",
    equityModifier: "8.00",
    debtModifier: "3.00",
    goldModifier: "-2.00",
    cashModifier: "-1.00",
    imageUrl: null
  },
  {
    cardNumber: "BC6",
    title: "Geopolitical Crisis",
    cardText: "International tensions escalate. Flight to quality dominates trading.",
    equityModifier: "-5.00",
    debtModifier: "2.00",
    goldModifier: "10.00",
    cashModifier: "4.00",
    imageUrl: null
  },
];

export async function initializeSampleData() {
  // Check if cards already exist
  const existingColorCards = await storage.getAllColorCards();
  const existingBlackCards = await storage.getAllBlackCards();
  
  // Only initialize if no cards exist
  if (existingColorCards.length === 0) {
    console.log("Initializing sample color cards...");
    for (const card of sampleColorCards) {
      await storage.createColorCard(card);
    }
    console.log(`Created ${sampleColorCards.length} color cards`);
  }
  
  if (existingBlackCards.length === 0) {
    console.log("Initializing sample black cards...");
    for (const card of sampleBlackCards) {
      await storage.createBlackCard(card);
    }
    console.log(`Created ${sampleBlackCards.length} black cards`);
  }
}
