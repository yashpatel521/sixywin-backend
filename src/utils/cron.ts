// cron/cron.service.ts
import cron from "node-cron";
import {
  DELETE_YESTERDAY_DATA_CRON_EXPRESSION,
  DOUBLE_TROUBLE_CRON_EXPRESSION,
  HOURLY_DRAW_CRON_EXPRESSION,
  RANDOM_BID_CRON_EXPRESSION,
  RESET_SPIN_CRON_EXPRESSION,
} from "./constant";
import { DoubleTroubleDrawService } from "../services/doubleTroubleDraw.service";
import { broadcast } from "../websocket";
import { TicketDrawService } from "../services/ticketDraw.service";
import {
  botRandomBid,
  createRandomBots,
  ensureBotsExist,
} from "../bots/bots.controller";
import { UserService } from "../services/user.service";
import { TicketService } from "../services/ticket.service";
import { AviatorDrawService } from "../services/aviatorDraw.service";
import { AviatorService } from "../services/aviator.service";
import { DoubleTroubleService } from "../services/doubleTrouble.service";

export class Cron {
  /** Schedule Double Trouble draws */
  static doubleTroubleDraw() {
    cron.schedule(DOUBLE_TROUBLE_CRON_EXPRESSION, async () => {
      await DoubleTroubleDrawService.createDraw();
      const { current, history } =
        await DoubleTroubleDrawService.getLatestAndHistory(10);
      broadcast({
        type: "doubleTroubleStatus_response",
        requestId: "doubleTrouble",
        payload: {
          message: "New double trouble data available",
          success: true,
          data: { current, history },
        },
      });
    });
  }

  /** Draw tickets every hour */
  static drawTickets() {
    cron.schedule(HOURLY_DRAW_CRON_EXPRESSION, async () => {
      await TicketDrawService.runDraw();
    });
  }

  /** Reset all users' spin status at 10 AM daily */
  static scheduleResetSpinStatus() {
    cron.schedule(RESET_SPIN_CRON_EXPRESSION, async () => {
      await UserService.resetAllUsersSpinStatus();
    });
  }

  /** Bots place random bids for lottery */
  static scheduleRandomBids() {
    cron.schedule(RANDOM_BID_CRON_EXPRESSION, async () => {
      await botRandomBid();
    });
  }

  /** Delete yesterday's data */
  static async scheduleDeleteYesterdayDatas() {
    cron.schedule(DELETE_YESTERDAY_DATA_CRON_EXPRESSION, async () => {
      // Randomly create new bots
      await createRandomBots();

      // lottery Data
      await TicketService.deleteYesterdayTickets();
      await TicketDrawService.deleteYesterdayDrawResults();

      // Double Trouble Data
      await DoubleTroubleService.deleteYesterdayTickets();
      await DoubleTroubleDrawService.deleteYesterdayDrawResults();

      // aviator Data
      await AviatorService.deleteYesterdayAviatorData();
      await AviatorDrawService.deleteYesterdayAviatorData();
    });
  }

  /** Initialize all cron jobs and ensure data */
  static async init() {
    // Ensure bots exist before any draws
    await ensureBotsExist();

    // Ensure there is an active draw for the current hour; if not, create one
    await TicketDrawService.ensureDrawExists();

    // Schedule cron jobs
    this.doubleTroubleDraw();
    this.drawTickets();
    this.scheduleResetSpinStatus();
    this.scheduleRandomBids();

    // Delete yesterday's tickets and draw results and aviator game data
    this.scheduleDeleteYesterdayDatas();

    // Start Aviator game loop
    await AviatorDrawService.startGameLoop();
  }
}
