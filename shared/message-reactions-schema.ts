import { pgTable, varchar, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { messages } from "./schema";
import { sql } from "drizzle-orm";

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_message_user_emoji").on(table.messageId, table.userId, table.emoji),
]);

export type MessageReaction = typeof messageReactions.$inferSelect;
