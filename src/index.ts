import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import http from "http";
import { setupWebSocketServer } from "./websocket";
import AppDataSource from "./app-data-source";
import botsRoutes from "./bots/bots.routes";
import { APP_VERSION } from "./utils/version";
import { RequestError } from "./utils/types";
import { Cron } from "./utils/cron"; // Uncomment if using cron jobs
import userRoutes from "./routes/user.routes";
import ticketRoutes from "./routes/ticket.routes";
import aviatorRoutes from "./routes/avaitor.routes";
import doubleTroubleRoutes from "./routes/doubleTrouble.routes";
import contactUsRoutes from "./routes/contactus.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Built-in body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API version endpoint
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SixyWin Backend API",
    ...APP_VERSION.VERSION_INFO,
  });
});

// -----------------------------
// Routes
// -----------------------------
app.use("/bots", botsRoutes);
app.use("/user", userRoutes);
app.use("/ticket", ticketRoutes);
app.use("/aviator", aviatorRoutes);
app.use("/doubleTrouble", doubleTroubleRoutes);
app.use("/contactus", contactUsRoutes);

// -----------------------------
// Global Error Handler
// -----------------------------
app.use(
  (err: RequestError, _req: Request, res: Response, _next: NextFunction) => {
    // Joi validation errors
    if ((err as any)?.error?.isJoi) {
      const details = (err as any).error.details || [];
      const messages = details.map((d: any) => d.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
        data: messages,
      });
    }

    // Other errors
    const statusCode = err.code || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      data: null,
    });
  }
);

// -----------------------------
// Initialize database & start server
// -----------------------------
AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully");

    // Uncomment if using cron jobs
    Cron.init();

    const server = http.createServer(app);
    setupWebSocketServer(server);

    server.listen({ port: PORT, host: "0.0.0.0" }, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

export default app;
