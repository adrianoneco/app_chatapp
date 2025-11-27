import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
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
