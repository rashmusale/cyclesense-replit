import type { InsertColorCard, InsertBlackCard } from "@shared/schema";

// Sample Color Cards for each phase
export const sampleColorCards: InsertColorCard[] = [
  // BLUE Phase Cards (B1-B5)
  {
    cardNumber: "B1",
    phase: "blue",
    title: "Post-liberalisation Reforms",
    cardText: "Post-liberalisation reforms deepen. IT, Communication and entertainment sectors scale rapidly, globally & locally.",
    equityReturn: "63.40",
    debtReturn: "4.80",
    goldReturn: "-2.40",
    cashReturn: "8.70",
    imageUrl: null
  },
  {
    cardNumber: "B2",
    phase: "blue",
    title: "Investment Cycle Acceleration",
    cardText: "Investment cycle accelerates; GDP stays strong. Credit growth robust, corporate balance sheets expand. Global liquidity abundant, confidence structurally high.",
    equityReturn: "49.50",
    debtReturn: "-2.50",
    goldReturn: "14.90",
    cashReturn: "5.70",
    imageUrl: null
  },
  {
    cardNumber: "B3",
    phase: "blue",
    title: "Post-crisis Stimulus",
    cardText: "Post-crisis stimulus fuels recovery. Government spending high; banks support credit expansion. Infrastructure and capital goods optimism returns.",
    equityReturn: "52.10",
    debtReturn: "-2.80",
    goldReturn: "17.10",
    cashReturn: "4.50",
    imageUrl: null
  },
  {
    cardNumber: "B4",
    phase: "blue",
    title: "Growth Moderates",
    cardText: "Growth moderates while inflation remains elevated. Corporate earnings uneven; pockets of leverage remain under scrutiny. Economic data mixed; sentiment cautious but stable.",
    equityReturn: "13.80",
    debtReturn: "9.70",
    goldReturn: "18.60",
    cashReturn: "5.60",
    imageUrl: null
  },
  {
    cardNumber: "B5",
    phase: "blue",
    title: "Recovery Underway",
    cardText: "Recovery underway; corporate profitability stabilizes. Global liquidity conditions tighten gradually; participation shifts from broad-based to selective sector leadership.",
    equityReturn: "12.80",
    debtReturn: "0.90",
    goldReturn: "4.10",
    cashReturn: "4.20",
    imageUrl: null
  },
  
  // GREEN Phase Cards (G1-G5)
  {
    cardNumber: "G1",
    phase: "green",
    title: "Structural Reforms",
    cardText: "Structural reforms follow balance-of-payments crisis. Foreign investment opens up, new industries take shape, confidence gradually rebuilds.",
    equityReturn: "47.20",
    debtReturn: "11.80",
    goldReturn: "9.10",
    cashReturn: "14.00",
    imageUrl: null
  },
  {
    cardNumber: "G2",
    phase: "green",
    title: "Slow Global Environment",
    cardText: "Slow global environment post-tech bust and geopolitical tensions. Interest rates stay benign, domestic policy supportive; corporate restructuring begins; balance sheets strengthen quietly.",
    equityReturn: "8.10",
    debtReturn: "12.90",
    goldReturn: "13.80",
    cashReturn: "6.00",
    imageUrl: null
  },
  {
    cardNumber: "G3",
    phase: "green",
    title: "Policy Reforms Accelerate",
    cardText: "Policy reforms accelerate (GST, bankruptcy code, inflation targeting) & interest rates moderate. Growth steady, corporate governance improves, investment cycle prepares for revival.",
    equityReturn: "12.50",
    debtReturn: "9.20",
    goldReturn: "1.70",
    cashReturn: "6.90",
    imageUrl: null
  },
  {
    cardNumber: "G4",
    phase: "green",
    title: "Pandemic Shock Recovery",
    cardText: "Pandemic shock followed by aggressive fiscal + monetary support. Digital adoption accelerates; reopening boosts consumption and corporate earnings.",
    equityReturn: "51.10",
    debtReturn: "3.00",
    goldReturn: "7.60",
    cashReturn: "3.40",
    imageUrl: null
  },
  {
    cardNumber: "G5",
    phase: "green",
    title: "Domestic Growth Resilient",
    cardText: "Domestic growth resilient; capex and manufacturing gain momentum, bond yields soften. External environment uncertain, yet domestic flows and consumption stay steady.",
    equityReturn: "20.10",
    debtReturn: "9.30",
    goldReturn: "23.80",
    cashReturn: "6.50",
    imageUrl: null
  },
  
  // ORANGE Phase Cards (O1-O6)
  {
    cardNumber: "O1",
    phase: "orange",
    title: "External Turbulence",
    cardText: "External turbulence creates pressure on capital flows. Corporate balance sheets face stress; select sectors outperform while overall breadth narrows.",
    equityReturn: "-17.30",
    debtReturn: "-3.30",
    goldReturn: "2.10",
    cashReturn: "8.00",
    imageUrl: null
  },
  {
    cardNumber: "O2",
    phase: "orange",
    title: "Tech Cycle Unwinds",
    cardText: "Tech cycle unwinds; global slowdown post-dotcom peak. Domestic sentiment conservative;Central Banks start softening  rates across the world.investment decisions delayed; credit cautious.",
    equityReturn: "-30.30",
    debtReturn: "8.60",
    goldReturn: "6.10",
    cashReturn: "8.20",
    imageUrl: null
  },
  {
    cardNumber: "O3",
    phase: "orange",
    title: "Global Supply Constraints",
    cardText: "Global supply constraints push input costs higher. RBI increases risk weightage on real estate. Margins tighten, corporate confidence cools. Focus shifts to stability and resilience.",
    equityReturn: "-28.60",
    debtReturn: "-6.60",
    goldReturn: "13.70",
    cashReturn: "4.60",
    imageUrl: null
  },
  {
    cardNumber: "O4",
    phase: "orange",
    title: "Inflation Entrenched",
    cardText: "Inflation entrenched, interest rates elevated. Corporate capex pauses; cash conservation prioritized; defensive sectors gain attention.",
    equityReturn: "2.70",
    debtReturn: "7.40",
    goldReturn: "6.90",
    cashReturn: "8.00",
    imageUrl: null
  },
  {
    cardNumber: "O5",
    phase: "orange",
    title: "Growth Slows",
    cardText: "Growth slows and currency stability becomes priority. Global environment uncertain, domestic sentiment cautious, allocation patterns disciplined.",
    equityReturn: "6.70",
    debtReturn: "6.10",
    goldReturn: "9.20",
    cashReturn: "6.20",
    imageUrl: null
  },
  {
    cardNumber: "O6",
    phase: "orange",
    title: "Geopolitical Tensions",
    cardText: "Geopolitical tensions and tarriff blues dominate headlines. Growth moderates while external risks rise. Corporate investment plans stretch out; select sectors maintain leadership while others consolidate.",
    equityReturn: "-4.80",
    debtReturn: "7.30",
    goldReturn: "50.50",
    cashReturn: "9.20",
    imageUrl: null
  },
  
  // RED Phase Cards (R1-R3)
  {
    cardNumber: "R1",
    phase: "red",
    title: "Corporate Leverage Elevated",
    cardText: "Corporate leverage elevated and earnings growth softens. Financial system becomes more selective; project funding and credit approvals face tighter scrutiny.",
    equityReturn: "-17.90",
    debtReturn: "-2.10",
    goldReturn: "1.80",
    cashReturn: "4.50",
    imageUrl: null
  },
  {
    cardNumber: "R2",
    phase: "red",
    title: "Global Financial System Stress",
    cardText: "Global financial system under severe stress. Trade and credit channels freeze temporarily; policymakers respond with stabilization measures.",
    equityReturn: "-33.00",
    debtReturn: "13.30",
    goldReturn: "31.40",
    cashReturn: "3.80",
    imageUrl: null
  },
  {
    cardNumber: "R3",
    phase: "red",
    title: "Global Pandemic Outbreak",
    cardText: "Global pandemic breaks out, sudden halt in mobility and activity. Both households and firms shift to cash preservation. Policy responses rapid and large-scale.",
    equityReturn: "-28.70",
    debtReturn: "4.20",
    goldReturn: "13.10",
    cashReturn: "1.20",
    imageUrl: null
  },
];

// Sample Black Cards (market events/modifiers)
export const sampleBlackCards: InsertBlackCard[] = [
  {
    cardNumber: "W1",
    title: "Currency Pressures",
    cardText: "Currency pressures across Asia trigger concerns on capital stability. RBI responds with sharp liquidity tightening. Funding costs change abruptly, and participants re-evaluate exposure to leveraged and import-sensitive businesses.",
    equityModifier: "14.20",
    debtModifier: "5.70",
    goldModifier: "1.00",
    cashModifier: "1.40",
    imageUrl: null
  },
  {
    cardNumber: "W2",
    title: "International Sanctions",
    cardText: "India conducts nuclear tests, prompting international sanctions. Trade, funding lines, and diplomatic relationships come under pressure. Investors reassess India's economic isolation risks and potential implications for growth.",
    equityModifier: "-19.40",
    debtModifier: "-2.20",
    goldModifier: "-2.60",
    cashModifier: "1.30",
    imageUrl: null
  },
  {
    cardNumber: "W3",
    title: "Commodity Market Unwinding",
    cardText: "A sharp unwinding & fall in global commodity markets follows a strong run-up. Emerging markets experience swift repricing as global funds adjust positioning. Sectors linked to metals, construction, and global trade become focal points of revaluation.",
    equityModifier: "-28.20",
    debtModifier: "-1.80",
    goldModifier: "11.60",
    cashModifier: "0.60",
    imageUrl: null
  },
  {
    cardNumber: "W4",
    title: "Quantitative Easing Reduction",
    cardText: "The U.S. signals a possible reduction in quantitative easing, triggering outflows from emerging markets. The rupee weakens sharply, and RBI introduces emergency liquidity tightening via MSF and OMO measures. Funding conditions shift quickly across the financial system.",
    equityModifier: "-2.10",
    debtModifier: "-1.90",
    goldModifier: "-4.70",
    cashModifier: "2.00",
    imageUrl: null
  },
  {
    cardNumber: "W5",
    title: "ESG Investing Trends",
    cardText: "ESG-oriented investing gains significant global momentum. Domestic flows begin redirecting toward sectors seen as sustainable, regulated, or future-proof. Capital allocation frameworks shift as non-financial metrics enter investment decision-making.",
    equityModifier: "10.50",
    debtModifier: "7.80",
    goldModifier: "13.80",
    cashModifier: "5.90",
    imageUrl: null
  },
  {
    cardNumber: "W6",
    title: "NBFC Defaults",
    cardText: "A large NBFC group defaults, triggering stress across short-term funding markets. Market participants focus on asset-liability mismatches and refinancing risks within shadow banking. Liquidity allocation becomes more selective and cautious. (Credit Risk Category Returns @ -3%)",
    equityModifier: "2.80",
    debtModifier: "10.10",
    goldModifier: "7.20",
    cashModifier: "4.50",
    imageUrl: null
  },
  {
    cardNumber: "W7",
    title: "Tax Policy Changes",
    cardText: "A major favorable corporate tax policy change is announced suddenly, altering earnings expectations across sectors. Analysts and investors rapidly rework valuation models and growth assumptions amid shifting corporate sentiment.",
    equityModifier: "7.10",
    debtModifier: "0.80",
    goldModifier: "0.00",
    cashModifier: "0.00",
    imageUrl: null
  },
  {
    cardNumber: "W8",
    title: "Geopolitical Energy Disruption",
    cardText: "Geopolitical tensions disrupt global energy supply expectations. Crude oil prices rise sharply, driving renewed focus on inflation, currency stability, and fiscal sensitivity to imported energy. Businesses reassess cost structures and pricing power.",
    equityModifier: "-3.80",
    debtModifier: "-1.30",
    goldModifier: "2.70",
    cashModifier: "0.80",
    imageUrl: null
  },
];
