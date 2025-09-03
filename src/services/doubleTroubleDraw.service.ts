import AppDataSource from "../app-data-source";
import { DoubleTroubleDraw } from "../entities/DoubleTroubleDraw";
import { sendToUser } from "../websocket";
import { DoubleTroubleService } from "./doubleTrouble.service";
import {
  doubleTroublePayouts,
  MAX_NUMBER_DOUBLE_TROUBLE,
} from "../utils/constant";
import { Between } from "typeorm/find-options/operator/Between";
import { UserService } from "./user.service";

export class DoubleTroubleDrawService {
  static drawRepo = AppDataSource.getRepository(DoubleTroubleDraw);

  static async createDraw() {
    // Generate draw result
    const randomNumber =
      Math.floor(Math.random() * MAX_NUMBER_DOUBLE_TROUBLE) + 1;
    const draw = new DoubleTroubleDraw();
    draw.winningNumbers = randomNumber;
    draw.nextDrawTime = new Date(Date.now() + 30 * 1000);
    const savedDraw = await this.drawRepo.save(draw);

    // Fetch all pending tickets with full user object
    const tickets = await DoubleTroubleService.getAllPendingTickets();

    // Map to track latest state per user
    const userUpdates = new Map<string, any>();

    for (const ticket of tickets) {
      ticket.drawResult = savedDraw;

      // Determine win/loss and update user
      switch (ticket.drawType) {
        case "Exact":
          ticket.status = ticket.number === randomNumber ? "win" : "loss";
          if (ticket.status === "win") {
            ticket.user.totalWon += ticket.bidAmount;
            ticket.user.winningAmount += ticket.bidAmount;
          }
          break;
        case "Under":
          ticket.status = ticket.number < randomNumber ? "win" : "loss";
          if (ticket.status === "win") {
            ticket.user.totalWon +=
              ticket.bidAmount * doubleTroublePayouts.over;
            ticket.user.winningAmount +=
              ticket.bidAmount * doubleTroublePayouts.over;
          }
          break;
        case "Over":
          ticket.status = ticket.number > randomNumber ? "win" : "loss";
          if (ticket.status === "win") {
            ticket.user.totalWon +=
              ticket.bidAmount * doubleTroublePayouts.over;
            ticket.user.winningAmount +=
              ticket.bidAmount * doubleTroublePayouts.over;
          }
          break;
        case "Number":
          ticket.status = ticket.number === randomNumber ? "win" : "loss";
          if (ticket.status === "win") {
            ticket.user.totalWon +=
              ticket.bidAmount * doubleTroublePayouts.number;
            ticket.user.winningAmount +=
              ticket.bidAmount * doubleTroublePayouts.number;
          }
          break;
        default:
          ticket.status = "loss";
      }

      await DoubleTroubleService.saveTicket(ticket);
      await UserService.updateUser(ticket.user);
      userUpdates.set(ticket.user.id.toString(), ticket.user);
    }

    // Send one update per user with full user object
    for (const [userId, userObj] of userUpdates.entries()) {
      sendToUser(userId, {
        type: "updatedUser_response",
        payload: {
          message: "Your bet results have been updated",
          success: true,
          data: { user: userObj },
        },
      });
    }

    return savedDraw;
  }

  static async getLatest(limit = 1) {
    const results = await this.drawRepo.find({
      order: { createdAt: "DESC" },
      take: limit,
    });
    return results[0] || null;
  }

  static async getHistory(limit = 10) {
    const results = await this.drawRepo.find({
      order: { createdAt: "DESC" },
      take: limit,
    });
    return results;
  }

  static async getLatestAndHistory(limit = 10) {
    // Fetch one extra so we can include `current` + `limit` previous
    const historyWithCurrent = await this.getHistory(limit + 1);
    const current =
      historyWithCurrent.length > 0
        ? historyWithCurrent[0]
        : await this.getLatest(1);
    return {
      current,
      history: historyWithCurrent.slice(1, limit),
    };
  }

  static async deleteYesterdayDrawResults() {
    const today = new Date();

    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(today);
    endOfYesterday.setDate(today.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    await this.drawRepo.delete({
      createdAt: Between(startOfYesterday, endOfYesterday),
    });
  }
}
