import type { Request, Response, NextFunction } from "express";

export interface WebhookPayload {
  event: string;
  method: string;
  path: string;
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  userId?: string;
  isApiAuth: boolean;
  timestamp: string;
}

async function dispatchWebhook(payload: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.GLOBAL_WEBHOOK_URL;
  const apiKey = process.env.GLOBAL_API_KEY;

  if (!webhookUrl) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}

function getEventName(method: string, path: string): string {
  const cleanPath = path
    .replace(/^\/api\//, "")
    .replace(/\/[a-f0-9-]{36}/g, "/:id")
    .replace(/\/\d+/g, "/:id")
    .replace(/\//g, ".");
  
  return `api.${method.toLowerCase()}.${cleanPath}`;
}

export function webhookDispatcher(req: Request, res: Response, next: NextFunction) {
  const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  
  if (!allowedMethods.includes(req.method)) {
    return next();
  }

  if (!req.path.startsWith("/api/") || req.path.includes("/socket.io")) {
    return next();
  }

  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    const payload: WebhookPayload = {
      event: getEventName(req.method, req.path),
      method: req.method,
      path: req.path,
      params: req.params || {},
      query: req.query || {},
      body: req.body || {},
      userId: req.session?.userId,
      isApiAuth: req.isApiAuth || false,
      timestamp: new Date().toISOString(),
    };

    dispatchWebhook(payload).catch(err => {
      console.error("Failed to dispatch webhook:", err);
    });

    return originalJson(data);
  };

  next();
}
