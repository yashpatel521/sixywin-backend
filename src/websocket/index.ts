import { Server as WebSocketServer, WebSocket } from "ws";
import type { Server as HTTPServer } from "http";
import { verifyHMACMiddleware } from "../middleware/hmac.middleware";
import { UserController } from "../controllers/user.controller";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../utils/constant";
import { JWT_DECODE } from "../utils/types";
import { UserService } from "../services/user.service";
import { DrawController } from "../controllers/ticketDraw.controller";
import { DoubleTroubleController } from "../controllers/doubleTrouble.controller";
import { DoubleTroubleDrawService } from "../services/doubleTroubleDraw.service";

let wss: WebSocketServer | null = null;
const userConnections = new Map<string, WebSocket>();

export function setupWebSocketServer(server: HTTPServer) {
  if (wss) {
    console.warn("WebSocket server is already set up.");
    return wss;
  }

  wss = new WebSocketServer({ server });
  wss
    .on("connection", (ws: WebSocket) => {
      try {
        console.log("New WebSocket connection established");

        ws.on("message", async (message: string) => {
          const data = JSON.parse(message);

          // Verify HMAC signature before processing
          const verification = verifyHMACMiddleware(data);

          if (!verification.isValid) {
            const errorResponse = {
              type: "error",
              message: verification.error || "Security verification failed",
              timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify(errorResponse));
            return;
          }
          // Handle the incoming message data
          const verifyToken = async (token: string) => {
            const data = jwt.verify(token, TOKEN_SECRET!) as JWT_DECODE;
            const user = await UserService.findUserById(data.id);
            return user;
          };
          data.payload.user = await verifyToken(data.token);
          userConnections.set(data.payload.user.id.toString(), ws);
          if (!data.payload.user) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Invalid or missing token",
                timestamp: new Date().toISOString(),
              })
            );
            return;
          }
          switch (data.type) {
            case "addUserToConnections":
              userConnections.set(String(data.payload.user.id), ws);
              const updatedUser = {
                type: "updatedUser_response",
                requestId: data.requestId,
                payload: {
                  success: true,
                  message: "User authenticated successfully",
                  data: { user: data.payload.user },
                },
              };
              return responseHandler(ws, updatedUser);
            case "spinWheel":
              const spinResult = await UserController.spinWheel(
                { ...data.payload, amount: data.payload.amount },
                data.requestId
              );
              return responseHandler(ws, spinResult);
            case "userProfile":
              const userProfileResult = await UserController.getUserProfile(
                { ...data.payload },
                data.requestId
              );
              return responseHandler(ws, userProfileResult);
            case "latestDraw":
              const latestDrawResult = await DrawController.getLatestDraw(
                { ...data.payload },
                data.requestId
              );
              return responseHandler(ws, latestDrawResult);
            case "doubleTroubleStatus": {
              const { current, history } =
                await DoubleTroubleDrawService.getLatestAndHistory(10);
              const payload = {
                type: "doubleTroubleStatus_response",
                requestId: data.requestId,
                payload: {
                  success: true,
                  message: "Double Trouble status fetched",
                  data: { current, history },
                },
              };
              return responseHandler(ws, payload);
            }

            default:
              console.warn("Unknown WebSocket message type:", data.type);
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Unknown WebSocket message type",
                  timestamp: new Date().toISOString(),
                })
              );
          }
        });
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Internal server error",
            timestamp: new Date().toISOString(),
          })
        );
      }
    })
    .on("error", (err) => {
      console.error("WebSocket server error:", err);
    })
    .on("close", (ws: WebSocket) => {
      console.log("WebSocket connection closed");
      // Optional: remove from map if needed
      for (const [userId, socket] of userConnections.entries()) {
        if (socket === ws) {
          userConnections.delete(userId);
          break;
        }
      }
    });

  return wss;
}

export const responseHandler = (ws: WebSocket, data: any) => {
  const response = {
    type: data.type,
    payload: data.payload,
    requestId: data.requestId,
  };
  ws.send(JSON.stringify(response));
};

export function broadcast(message: any) {
  if (!wss) {
    console.warn("WebSocket server is not initialized yet.");
    return;
  }
  const data = typeof message === "string" ? message : JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function sendToUser(userId: string, message: any) {
  if (!wss) return;
  const ws = userConnections.get(String(userId));
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
