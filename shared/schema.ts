import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game State - singleton to track current game configuration
export const gameState = pgTable("game_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mode: text("mode").notNull(), // 'virtual' | 'in-person'
  currentRound: integer("current_round").notNull().default(0),
  isActive: boolean("is_active").notNull().default(false),
});

// Teams
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  currentNav: decimal("current_nav", { precision: 10, scale: 2 }).notNull().default('10.00'),
  pitchTotal: integer("pitch_total").notNull().default(0),
  emotionTotal: integer("emotion_total").notNull().default(0),
});

// Color Cards (Green, Blue, Orange, Red phase cards)
export const colorCards = pgTable("color_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  phase: text("phase").notNull(), // 'green' | 'blue' | 'orange' | 'red'
  title: text("title").notNull(),
  cardText: text("card_text").notNull(),
  equityReturn: decimal("equity_return", { precision: 10, scale: 2 }).notNull(),
  debtReturn: decimal("debt_return", { precision: 10, scale: 2 }).notNull(),
  goldReturn: decimal("gold_return", { precision: 10, scale: 2 }).notNull(),
  cashReturn: decimal("cash_return", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
});

// Black Cards (market events/modifiers)
export const blackCards = pgTable("black_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: text("card_number").notNull(),
  title: text("title").notNull(),
  cardText: text("card_text").notNull(),
  equityModifier: decimal("equity_modifier", { precision: 10, scale: 2 }).notNull(),
  debtModifier: decimal("debt_modifier", { precision: 10, scale: 2 }).notNull(),
  goldModifier: decimal("gold_modifier", { precision: 10, scale: 2 }).notNull(),
  cashModifier: decimal("cash_modifier", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
});

// Rounds
export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: integer("round_number").notNull(),
  phase: text("phase").notNull(),
  colorCardId: varchar("color_card_id").notNull(),
  blackCardId: varchar("black_card_id"),
});

// Team Allocations per Round
export const teamAllocations = pgTable("team_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  equity: integer("equity").notNull(),
  debt: integer("debt").notNull(),
  gold: integer("gold").notNull(),
  cash: integer("cash").notNull(),
  pitchScore: integer("pitch_score").notNull().default(0),
  emotionScore: integer("emotion_score").notNull().default(0),
  navBefore: decimal("nav_before", { precision: 10, scale: 2 }).notNull(),
  navAfter: decimal("nav_after", { precision: 10, scale: 2 }).notNull(),
});

// Insert schemas and types
export const insertGameStateSchema = createInsertSchema(gameState).omit({ id: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, currentNav: true, pitchTotal: true, emotionTotal: true });
export const insertColorCardSchema = createInsertSchema(colorCards).omit({ id: true });
export const insertBlackCardSchema = createInsertSchema(blackCards).omit({ id: true });
export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true });
export const insertTeamAllocationSchema = createInsertSchema(teamAllocations).omit({ id: true });

export type GameState = typeof gameState.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type ColorCard = typeof colorCards.$inferSelect;
export type BlackCard = typeof blackCards.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type TeamAllocation = typeof teamAllocations.$inferSelect;

export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertColorCard = z.infer<typeof insertColorCardSchema>;
export type InsertBlackCard = z.infer<typeof insertBlackCardSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertTeamAllocation = z.infer<typeof insertTeamAllocationSchema>;
