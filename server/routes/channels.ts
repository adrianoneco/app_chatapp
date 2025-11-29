import type { Express } from "express";
import { channels } from "@shared/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export function registerChannelRoutes(app: Express) {
  // Get all channels
  app.get("/api/channels", async (req, res) => {
    try {
      const channelList = await db.select().from(channels);
      res.json({ channels: channelList });
    } catch (error: any) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get channel by ID
  app.get("/api/channels/:id", async (req, res) => {
    try {
      const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, req.params.id))
        .limit(1);

      if (!channel) {
        return res.status(404).json({ error: "Canal não encontrado" });
      }

      res.json({ channel });
    } catch (error: any) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create channel
  app.post("/api/channels", async (req, res) => {
    try {
      const [channel] = await db.insert(channels).values({
        name: req.body.name,
        type: req.body.type,
        avatar: req.body.avatar,
        apiKey: req.body.apiKey,
        webhookUrl: req.body.webhookUrl,
        phoneNumber: req.body.phoneNumber,
        isActive: req.body.isActive ?? true,
        settings: req.body.settings,
      }).returning();

      res.json({ channel });
    } catch (error: any) {
      console.error("Error creating channel:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update channel
  app.patch("/api/channels/:id", async (req, res) => {
    try {
      const [channel] = await db
        .update(channels)
        .set({
          name: req.body.name,
          type: req.body.type,
          avatar: req.body.avatar,
          apiKey: req.body.apiKey,
          webhookUrl: req.body.webhookUrl,
          phoneNumber: req.body.phoneNumber,
          isActive: req.body.isActive,
          settings: req.body.settings,
          updatedAt: new Date(),
        })
        .where(eq(channels.id, req.params.id))
        .returning();

      if (!channel) {
        return res.status(404).json({ error: "Canal não encontrado" });
      }

      res.json({ channel });
    } catch (error: any) {
      console.error("Error updating channel:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete channel
  app.delete("/api/channels/:id", async (req, res) => {
    try {
      await db.delete(channels).where(eq(channels.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
