import AppDataSource from "../app-data-source";
import { TicketDraw } from "../entities/TicketDraw";
import { Between } from "typeorm";

import {
  getMatchedNumbers,
  getMultiplierForMatches,
  getRandomNumbers,
} from "../utils/common";
import { UserService } from "./user.service";
import {
  LOTTERY_MAXIMUM_NUMBER,
  LOTTERY_MINIMUM_NUMBER,
  LOTTERY_NUMBERS_COUNT,
  MEGA_POT_AMOUNT,
} from "../utils/constant";
import { broadcast } from "../websocket";
import { TicketService } from "./ticket.service";

export class TicketDrawService {
  static drawRepo = AppDataSource.getRepository(TicketDraw);

  static async runDraw(drawDate: Date = new Date()) {
    const tickets = await TicketService.getAllPendingTickets();

    // Calculate next draw time
    const nextDrawDate = new Date(drawDate);
    nextDrawDate.setHours(nextDrawDate.getHours() + 1, 0, 0, 0);

    const winningNumbers = getRandomNumbers(
      LOTTERY_NUMBERS_COUNT,
      LOTTERY_MINIMUM_NUMBER,
      LOTTERY_MAXIMUM_NUMBER
    );
    const winningSet = new Set(winningNumbers);

    const drawResult = this.drawRepo.create({
      winningNumbers,
      drawDate,
      nextDrawDate,
    });
    await this.drawRepo.save(drawResult);

    broadcast({
      type: "latestDraw_response",
      requestId: "draw",
      payload: {
        message: "New draw results available",
        success: true,
        data: { ...drawResult, nextDrawTime: nextDrawDate },
      },
    });

    // Aggregate user stat updates to minimize DB writes
    const userDeltas = new Map<
      number,
      { user: any; winningDelta: number; totalWonDelta: number }
    >();

    for (const ticket of tickets) {
      ticket.drawResult = drawResult;

      // check Mega Pot Win
      if (ticket.numbers.every((n) => winningSet.has(n))) {
        ticket.result = "megaPot";
        ticket.coinsWon = MEGA_POT_AMOUNT;
        ticket.drawDate = drawDate;

        // Queue user stat updates
        const existing = userDeltas.get(ticket.user.id) || {
          user: ticket.user,
          winningDelta: 0,
          totalWonDelta: 0,
        };
        existing.winningDelta += MEGA_POT_AMOUNT;
        existing.totalWonDelta += MEGA_POT_AMOUNT;
        userDeltas.set(ticket.user.id, existing);
      } else {
        // Regular ticket evaluation
        const matched = getMatchedNumbers(ticket.numbers, winningNumbers);
        const multiplier = getMultiplierForMatches(matched.length);
        const coins = ticket.bid * multiplier;
        ticket.matchedNumbers = matched;
        ticket.result = multiplier > 0 ? "win" : "loss";
        ticket.coinsWon = coins;
        ticket.drawDate = drawDate;

        if (coins > 0) {
          const existing = userDeltas.get(ticket.user.id) || {
            user: ticket.user,
            winningDelta: 0,
            totalWonDelta: 0,
          };
          existing.winningDelta += coins;
          existing.totalWonDelta += coins;
          userDeltas.set(ticket.user.id, existing);
        }
      }
    }

    // Persist all tickets in one batch
    if (tickets.length > 0) {
      await TicketService.saveTickets(tickets);
    }

    // Apply aggregated user stat updates once per user
    for (const { user, winningDelta, totalWonDelta } of userDeltas.values()) {
      user.winningAmount = (user.winningAmount || 0) + winningDelta;
      user.totalWon = (user.totalWon || 0) + totalWonDelta;
      await UserService.updateUser(user);
    }

    return { winningNumbers, drawDate, ticketCount: tickets.length };
  }

  static async ensureDrawExists() {
    // Determine the current hour window [start, end)
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    // Find an existing draw within the current hour window
    const existingDraw = await this.drawRepo.findOne({
      where: { drawDate: Between(start, end) },
      order: { drawDate: "DESC" },
    });
    if (!existingDraw) {
      // Create a draw aligned to the start of the current hour
      return await this.runDraw(start);
    }
    return existingDraw;
  }

  static async getLatestDraw() {
    const draws = await this.drawRepo.find({
      order: { drawDate: "DESC" },
      take: 1,
    });
    if (draws.length === 0) {
      const nowIfNone = new Date();
      const currentHourStartIfNone = new Date(nowIfNone);
      currentHourStartIfNone.setMinutes(0, 0, 0);
      await this.runDraw(currentHourStartIfNone);
      const created = await this.drawRepo.find({
        order: { drawDate: "DESC" },
        take: 1,
      });
      // After creating, recompute using the new latest draw
      const latestDraw = created[0];
      const start = new Date(latestDraw.drawDate);
      start.setMinutes(0, 0, 0);
      const end = new Date(latestDraw.drawDate);
      end.setMinutes(59, 59, 999);
      const tickets = await TicketService.getTicketsByDateRange(start, end);
      const winningTickets = tickets.filter((t) => t.result === "win");
      const totalWinners = winningTickets.length;
      const totalPrize = winningTickets.reduce(
        (sum, t) => sum + (t.coinsWon || 0),
        0
      );
      return {
        ...latestDraw,
        totalWinners,
        totalPrize,
        nextDrawTime: latestDraw.nextDrawDate,
      };
    }

    let latestDraw = draws[0];
    // Ensure there is a draw for the current hour; if the latest is older than the current hour, create one
    const now = new Date();
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);
    if (new Date(latestDraw.drawDate) < currentHourStart) {
      await this.runDraw(currentHourStart);
      const refreshed = await this.drawRepo.find({
        order: { drawDate: "DESC" },
        take: 1,
      });
      if (refreshed.length > 0) {
        latestDraw = refreshed[0];
      }
    }
    const start = new Date(latestDraw.drawDate);
    start.setMinutes(0, 0, 0);
    const end = new Date(latestDraw.drawDate);
    end.setMinutes(59, 59, 999);

    const tickets = await TicketService.getTicketsByDateRange(start, end);
    const winningTickets = tickets.filter((t) => t.result === "win");
    const totalWinners = winningTickets.length;
    const totalPrize = winningTickets.reduce(
      (sum, t) => sum + (t.coinsWon || 0),
      0
    );

    return {
      ...latestDraw,
      totalWinners,
      totalPrize,
      nextDrawTime: latestDraw.nextDrawDate,
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
