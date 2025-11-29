import type { Express } from "express";
import express from "express";
import { storage } from "../storage";
import { messages, conversations, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import { uploadMedia, MEDIA_DIR } from "../upload";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
import { z } from "zod";

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string(),
  contentType: z.enum(["text", "image", "video", "audio", "music", "contact", "file"]).default("text"),
  fileUrl: z.string().optional(),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
  metadata: z.string().optional(),
  quotedMessageId: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const reactionSchema = z.object({
  emoji: z.string(),
});

const forwardSchema = z.object({
  conversationIds: z.array(z.string()),
});

export function registerMessageRoutes(app: Express) {
  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const conversationId = req.params.id;
      
      const messageList = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      // Get quoted messages info
      const messagesWithQuotes = await Promise.all(
        messageList.map(async (msg) => {
          if (msg.quotedMessageId) {
            const [quotedMsg] = await db
              .select()
              .from(messages)
              .where(eq(messages.id, msg.quotedMessageId))
              .limit(1);
            
            return {
              ...msg,
              quotedMessage: quotedMsg ? {
                id: quotedMsg.id,
                senderName: quotedMsg.senderName,
                content: quotedMsg.content,
                contentType: quotedMsg.contentType,
              } : undefined,
            };
          }
          return msg;
        })
      );

      res.json({ messages: messagesWithQuotes });
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos", details: parsed.error });
      }

      const data = parsed.data;
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const [message] = await db.insert(messages).values({
        conversationId: data.conversationId,
        senderId: user.id,
        senderType: user.role === "admin" ? "attendant" : "client",
        senderName: user.name,
        content: data.content,
        contentType: data.contentType,
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        duration: data.duration,
        metadata: data.metadata,
        quotedMessageId: data.quotedMessageId,
        isPrivate: data.isPrivate || false,
      }).returning();

      // Update conversation lastMessageAt
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, data.conversationId));

      res.json({ message });
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // React to a message
  app.post("/api/messages/:id/reactions", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const parsed = reactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const messageId = req.params.id;
      const { emoji } = parsed.data;
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      // For now, we'll store reactions in metadata as JSON
      // In a real app, you might want a separate reactions table
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        return res.status(404).json({ error: "Mensagem não encontrada" });
      }

      // Parse existing reactions from metadata or initialize
      let reactions: any[] = [];
      try {
        if (message.metadata) {
          const meta = JSON.parse(message.metadata);
          reactions = meta.reactions || [];
        }
      } catch (e) {
        reactions = [];
      }

      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        (r: any) => r.userId === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        reactions = reactions.filter(
          (r: any) => !(r.userId === user.id && r.emoji === emoji)
        );
      } else {
        // Add reaction
        reactions.push({
          userId: user.id,
          userName: user.name,
          emoji,
          createdAt: new Date().toISOString(),
        });
      }

      // Update metadata with reactions
      const updatedMetadata = JSON.stringify({
        ...(message.metadata ? JSON.parse(message.metadata) : {}),
        reactions,
      });

      await db
        .update(messages)
        .set({ metadata: updatedMetadata })
        .where(eq(messages.id, messageId));

      res.json({ reactions });
    } catch (error: any) {
      console.error("Error reacting to message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Forward a message
  app.post("/api/messages/:id/forward", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const parsed = forwardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const messageId = req.params.id;
      const { conversationIds } = parsed.data;
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      // Get original message
      const [originalMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!originalMessage) {
        return res.status(404).json({ error: "Mensagem não encontrada" });
      }

      // Create forwarded messages in each conversation
      const forwardedMessages = await Promise.all(
        conversationIds.map(async (convId) => {
          const [msg] = await db.insert(messages).values({
            conversationId: convId,
            senderId: user.id,
            senderType: user.role === "admin" ? "attendant" : "client",
            senderName: user.name,
            content: originalMessage.content,
            contentType: originalMessage.contentType,
            fileUrl: originalMessage.fileUrl,
            thumbnail: originalMessage.thumbnail,
            duration: originalMessage.duration,
            metadata: originalMessage.metadata,
            isForwarded: true,
          }).returning();

          // Update conversation lastMessageAt
          await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, convId));

          return msg;
        })
      );

      res.json({ forwardedMessages });
    } catch (error: any) {
      console.error("Error forwarding message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get conversations (for forward modal)
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      let conversationList;
      if (user.role === "admin") {
        // Admins see all conversations with client info from users table
        conversationList = await db
          .select({
            id: conversations.id,
            protocol: conversations.protocol,
            clientId: conversations.clientId,
            clientName: users.name,
            clientEmail: users.email,
            clientPhone: users.mobilePhone,
            attendantId: conversations.attendantId,
            channelId: conversations.channelId,
            status: conversations.status,
            priority: conversations.priority,
            subject: conversations.subject,
            city: conversations.city,
            state: conversations.state,
            country: conversations.country,
            unreadCount: conversations.unreadCount,
            lastMessage: conversations.lastMessage,
            lastMessageAt: conversations.lastMessageAt,
            sidebarWidth: conversations.sidebarWidth,
            closedAt: conversations.closedAt,
            createdAt: conversations.createdAt,
            updatedAt: conversations.updatedAt,
          })
          .from(conversations)
          .leftJoin(users, eq(conversations.clientId, users.id))
          .orderBy(desc(conversations.createdAt));
      } else {
        // Clients see only their conversations
        conversationList = await db
          .select({
            id: conversations.id,
            protocol: conversations.protocol,
            clientId: conversations.clientId,
            clientName: users.name,
            clientEmail: users.email,
            clientPhone: users.mobilePhone,
            attendantId: conversations.attendantId,
            channelId: conversations.channelId,
            status: conversations.status,
            priority: conversations.priority,
            subject: conversations.subject,
            city: conversations.city,
            state: conversations.state,
            country: conversations.country,
            unreadCount: conversations.unreadCount,
            lastMessage: conversations.lastMessage,
            lastMessageAt: conversations.lastMessageAt,
            sidebarWidth: conversations.sidebarWidth,
            closedAt: conversations.closedAt,
            createdAt: conversations.createdAt,
            updatedAt: conversations.updatedAt,
          })
          .from(conversations)
          .leftJoin(users, eq(conversations.clientId, users.id))
          .where(eq(conversations.clientId, user.id))
          .orderBy(desc(conversations.createdAt));
      }

      res.json({ conversations: conversationList });
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      const { clientId, subject, channelId } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId é obrigatório" });
      }

      // Generate protocol number
      const now = new Date();
      const year = now.getFullYear();
      const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const protocol = `ATD-${year}-${randomNum}`;

      // Create conversation
      const [conversation] = await db.insert(conversations).values({
        protocol,
        clientId,
        attendantId: user.role === "admin" ? user.id : undefined,
        channelId: channelId || null,
        subject: subject || "Nova conversa",
        status: "pending",
        priority: "normal",
      }).returning();

      // Fetch with user info
      const [conversationWithUser] = await db
        .select({
          id: conversations.id,
          protocol: conversations.protocol,
          clientId: conversations.clientId,
          clientName: users.name,
          clientEmail: users.email,
          clientPhone: users.mobilePhone,
          attendantId: conversations.attendantId,
          channelId: conversations.channelId,
          unreadCount: conversations.unreadCount,
          lastMessage: conversations.lastMessage,
          lastMessageAt: conversations.lastMessageAt,
          status: conversations.status,
          priority: conversations.priority,
          subject: conversations.subject,
          city: conversations.city,
          state: conversations.state,
          country: conversations.country,
          sidebarWidth: conversations.sidebarWidth,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .leftJoin(users, eq(conversations.clientId, users.id))
        .where(eq(conversations.id, conversation.id));

      res.json({ conversation: conversationWithUser });
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve media files
  app.use("/api/media", express.static(MEDIA_DIR));

  // Upload media file
  app.post("/api/upload", uploadMedia.single("file"), async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const fileUrl = `/api/media/${req.file.filename}`;
      
      // Determine content type based on mimetype
      let contentType = "file";
      if (req.file.mimetype.startsWith("image/")) {
        contentType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        contentType = "video";
      } else if (req.file.mimetype.startsWith("audio/")) {
        contentType = "audio";
      }

      res.json({
        success: true,
        fileUrl,
        contentType,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
