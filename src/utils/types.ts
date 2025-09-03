import { Request } from "express";
import { User } from "../entities/User";

export interface RequestError extends Error {
  code?: number;
  name: string;
  message: string;
  stack?: string;
}
// Add more custom types as needed

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface JWT_DECODE {
  id: number;
  iat: number;
  exp: number;
}

export type dbType = "mysql" | "postgres";
export type AuthRequest = Request & { user?: User };

export type DrawType = "Under" | "Over" | "Exact" | "Number";
