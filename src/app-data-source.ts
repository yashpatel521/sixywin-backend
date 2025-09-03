import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const isProd = process.env.NODE_ENV === "production";

// Validate required env vars
const requiredVars = [
  "DB_TYPE",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
];
requiredVars.forEach((v) => {
  if (!process.env[v]) throw new Error(`Missing environment variable: ${v}`);
});

const config = {
  type: process.env.DB_TYPE as any, // postgres, mysql, etc.
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: process.env.DB_SYNC === "true" || false,
  logging: process.env.DB_LOG === "true" || false,
  entities: [isProd ? "dist/entities/*.js" : "src/entities/*.ts"],
};

console.log(config);

// Configure TypeORM DataSource
export const AppDataSource = new DataSource(config);

export default AppDataSource;
