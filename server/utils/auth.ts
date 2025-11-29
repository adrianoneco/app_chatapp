import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      isApiAuth?: boolean;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isApiAuth) {
    return next();
  }
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
};

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return argon2.verify(hash, password);
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const getTokenExpiry = (hours: number = 1): Date => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

export const isTokenExpired = (expiry: Date | null): boolean => {
  if (!expiry) return true;
  return new Date() > new Date(expiry);
};

export const isValidToken = (token: string | null): boolean => {
  return token !== null && token.length === 64;
};
