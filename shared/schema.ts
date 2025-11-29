import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uniqueIndex, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  mobilePhone: text("mobile_phone"),
  remoteJid: text("remote_jid"),
  externalId: text("external_id"),
  role: text("role").notNull().default("client"), // 'admin' | 'client'
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // UI preferences
  mainSidebarCollapsed: boolean("main_sidebar_collapsed").default(false),
  conversationsSidebarWidth: integer("conversations_sidebar_width").default(320),
  conversationsSidebarCollapsed: boolean("conversations_sidebar_collapsed").default(false),
}, (table) => [
  uniqueIndex("unique_external_id").on(table.externalId).where(sql`${table.externalId} IS NOT NULL AND ${table.externalId} != ''`),
  uniqueIndex("unique_remote_jid").on(table.remoteJid).where(sql`${table.remoteJid} IS NOT NULL AND ${table.remoteJid} != ''`),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  resetToken: true,
  resetTokenExpiry: true,
}).extend({
  password: z.string().min(6),
  mobilePhone: z.string().optional().nullable(),
  remoteJid: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

export const selectUserSchema = createSelectSchema(users);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserSchema = insertUserSchema.partial().omit({
  password: true,
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const newPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SelectUser = Omit<User, "password" | "resetToken" | "resetTokenExpiry"> & {
  mainSidebarCollapsed?: boolean;
  conversationsSidebarWidth?: number;
  conversationsSidebarCollapsed?: boolean;
};
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

// Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: text("protocol").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  attendantId: varchar("attendant_id").references(() => users.id),
  channelId: varchar("channel_id").references(() => channels.id),
  status: text("status").notNull().default("open"), // 'open' | 'pending' | 'closed'
  priority: text("priority").notNull().default("normal"), // 'low' | 'normal' | 'high' | 'urgent'
  subject: text("subject"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  unreadCount: integer("unread_count").notNull().default(0),
  sidebarWidth: integer("sidebar_width").default(320),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
  closedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").references(() => users.id),
  senderType: text("sender_type").notNull().default("client"), // 'client' | 'attendant' | 'system'
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // 'text' | 'image' | 'video' | 'audio' | 'music' | 'contact' | 'file'
  fileUrl: text("file_url"),
  thumbnail: text("thumbnail"), // For video thumbnails
  duration: integer("duration"), // For audio/video in seconds
  metadata: text("metadata"), // JSON string for ID3 tags, contact info, etc
  quotedMessageId: varchar("quoted_message_id"),
  isForwarded: boolean("is_forwarded").default(false),
  isPrivate: boolean("is_private").default(false),
  status: text("status").notNull().default("sent"), // 'sent' | 'delivered' | 'read'
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Channels
export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // 'whatsapp' | 'telegram' | 'web' | 'email' | 'instagram' | 'facebook'
  avatar: text("avatar"),
  apiKey: text("api_key"),
  webhookUrl: text("webhook_url"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").notNull().default(true),
  settings: text("settings"), // JSON string for channel-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
