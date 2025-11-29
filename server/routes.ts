import type { Express } from "express";
import { type Server } from "http";
import session from "express-session";
import { apiKeyAuth } from "./middleware/apiAuth";
import { webhookDispatcher } from "./middleware/webhookDispatcher";

import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import avatarRoutes, { avatarStaticRouter } from "./routes/avatar";
import { registerMessageRoutes } from "./routes/messages";
import { registerChannelRoutes } from "./routes/channels";
import { registerAIRoutes } from "./routes/ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nexus-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(apiKeyAuth);
  app.use(webhookDispatcher);

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/avatars", avatarStaticRouter);
  app.use("/api/users/:id/avatar", avatarRoutes);
  registerMessageRoutes(app);
  registerChannelRoutes(app);
  registerAIRoutes(app);

  return httpServer;
}
