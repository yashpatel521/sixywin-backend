import AppDataSource from "../app-data-source";
import { User } from "../entities/User";
import { DUMMY_USERS } from "./botUser";
import bcrypt from "bcryptjs";
import { TicketService } from "../services/ticket.service";
import { getRandomNumbers } from "../utils/common";
import {
  LOTTERY_MAXIMUM_NUMBER,
  LOTTERY_MINIMUM_NUMBER,
  LOTTERY_NUMBERS_COUNT,
} from "../utils/constant";
import { broadcast } from "../websocket";
import { Ticket } from "../entities/Ticket";

/** Ensure bot users exist in the database */
export async function ensureBotsExist() {
  const userRepo = AppDataSource.getRepository(User);

  for (const bot of DUMMY_USERS) {
    let user = await userRepo.findOne({ where: { email: bot.email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(bot.password, 10);
      user = userRepo.create({ ...bot, password: hashedPassword });
      await userRepo.save(user);
      console.log(`[Bots] Created bot user: ${bot.email}`);
    }
  }
}

/** Make bots place random bids in the lottery */
export async function botRandomBid() {
  const userRepo = AppDataSource.getRepository(User);

  // Get all bots with coins > 10
  const bots = await userRepo.find({
    where: { isBot: true },
  });

  for (const bot of bots) {
    // Top up bots with low coins
    if (bot.coins < 10) {
      bot.coins += 500;
      bot.adsEarnings += 500;
      await userRepo.save(bot);
      continue;
    }

    // Calculate maximum bid (1/4 of available coins)
    const maxBid = Math.floor(bot.coins / 4);
    // Random bid between 10 and maxBid
    const finalBid = Math.floor(Math.random() * (maxBid - 10 + 1)) + 10;
    bot.coins -= finalBid;
    bot.todaysBids += finalBid;
    // Pick random lottery numbers
    const numbers = getRandomNumbers(
      LOTTERY_NUMBERS_COUNT,
      LOTTERY_MINIMUM_NUMBER,
      LOTTERY_MAXIMUM_NUMBER
    );

    // Create ticket for bot

    await TicketService.createTicket(bot, numbers, finalBid);

    // Save updated coins
    await userRepo.save(bot);
  }

  // Broadcast stats & leaderboard updates
  broadcast({
    type: "todayStats_update",
    payload: { message: "Today's stats updated after bots' bids" },
  });

  broadcast({
    type: "leaderboard_update",
    payload: { message: "Leaderboard updated after bots' bids" },
  });
}

export async function createRandomBots() {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const ticketRepo = AppDataSource.getRepository(Ticket);

    // Delete tickets of previous bots
    await ticketRepo
      .createQueryBuilder()
      .delete()
      .where(`userId IN (SELECT id FROM "user" WHERE "isBot" = :isBot)`, {
        isBot: true,
      })
      .execute();
    console.log("[Bots] Deleted all tickets of previous bots.");

    // Delete previous bot users
    await userRepo.delete({ isBot: true });
    console.log("[Bots] Deleted all previous bots.");

    // Shuffle and pick 10 random bots
    const selectedBots = DUMMY_USERS.sort(() => 0.5 - Math.random()).slice(
      0,
      10
    );

    // Insert selected bots concurrently
    await Promise.all(
      selectedBots.map(async (bot) => {
        const hashedPassword = await bcrypt.hash(bot.password, 10);
        const user = userRepo.create({ ...bot, password: hashedPassword });
        await userRepo.save(user);
        console.log(`[Bots] Created bot user: ${bot.email}`);
      })
    );

    console.log("[Bots] 10 random bots created successfully.");
  } catch (error) {
    console.error("[Bots] Error creating random bots:", error);
  }
}
