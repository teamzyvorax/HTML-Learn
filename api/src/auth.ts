import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "admin";
}

declare global {
  namespace Express {
    interface Request { auth?: AuthUser }
  }
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be configured and at least 32 characters long.");
  }
  return value;
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ email: user.email, role: user.role }, secret(), {
    subject: user.id,
    expiresIn: "2h",
    issuer: "zyvora-html-lab",
    audience: "zyvora-html-lab-web",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Sign in to access this resource." });
    return;
  }
  try {
    const payload = jwt.verify(token, secret(), {
      issuer: "zyvora-html-lab",
      audience: "zyvora-html-lab-web",
    }) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.email !== "string" || (payload.role !== "student" && payload.role !== "admin")) {
      res.status(401).json({ error: "Invalid access token." });
      return;
    }
    req.auth = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Access token is invalid or expired." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "admin") {
    res.status(403).json({ error: "Administrator access required." });
    return;
  }
  next();
}
