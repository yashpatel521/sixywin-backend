import { Between } from "typeorm/find-options/operator/Between";
import AppDataSource from "../app-data-source";
import { AviatorDraw } from "../entities/AviatorDraw";
import { crashMultiplier } from "../utils/common";
import { AVIATOR_COUNTDOWN_TIMER } from "../utils/constant";
import { broadcast } from "../websocket";
import { AviatorService } from "./aviator.service";

export class AviatorDrawService {
  static drawRepo = AppDataSource.getRepository(AviatorDraw);

  // Start the Aviator game loop
  static async startGameLoop() {
    while (true) {
      try {
        // Start round
        const currentDraw = await this.startRound();
        const crashPoint = await crashMultiplier();
        let multiplier = 1.0;

        // Broadcast multiplier progression
        await new Promise<void>((resolve) => {
          const interval = setInterval(async () => {
            multiplier = parseFloat(
              (multiplier + 0.01 + multiplier * 0.005).toFixed(2)
            );

            if (multiplier >= crashPoint) {
              multiplier = crashPoint;
              clearInterval(interval);

              currentDraw.status = "finished";
              currentDraw.crashMultiplier = crashPoint;
              currentDraw.endedAt = new Date();
              await this.drawRepo.save(currentDraw);

              await this.broadcastMultiplier(currentDraw);
              resolve();
            } else {
              await this.broadcastMultiplier({
                ...currentDraw,
                crashMultiplier: multiplier,
              });
            }
          }, 110);
        });

        // Settle pending bets
        await AviatorService.makeAllpendingLoss(currentDraw);

        // Countdown
        for (let i = AVIATOR_COUNTDOWN_TIMER; i > 0; i--) {
          broadcast({
            type: "aviatorCountdown_response",
            payload: {
              message: "Countdown",
              success: true,
              data: { countdown: i },
            },
          });
          await new Promise((res) => setTimeout(res, 1000));
        }
      } catch (err) {
        console.error("Game loop error:", err);
        // wait 5s before restarting to prevent crash loop
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
  }

  // Start a new draw
  static async startRound(): Promise<AviatorDraw> {
    const newDraw = this.drawRepo.create({
      status: "ongoing",
      startedAt: new Date(),
    });
    const savedDraw = await this.drawRepo.save(newDraw);

    // Broadcast new round info
    const broadcastMessage = {
      type: "aviatorDrawResult_response",
      requestId: "aviatorDraw",
      payload: {
        message: "New aviator draw started",
        success: true,
        data: savedDraw,
      },
    };
    broadcast(broadcastMessage);

    return savedDraw;
  }

  // Get current ongoing draw
  static async getCurrentRound(): Promise<AviatorDraw | null> {
    return await this.drawRepo.findOne({
      where: { status: "ongoing" },
    });
  }

  // Broadcast current multiplier
  static async broadcastMultiplier(draw: AviatorDraw) {
    const message = {
      type: "aviatorDrawResult_response",
      requestId: "aviatorDraw",
      payload: {
        message: "Multiplier update",
        success: true,
        data: draw,
      },
    };
    broadcast(message);
  }

  static async getRoundById(roundId: string) {
    return await this.drawRepo
      .createQueryBuilder("draw")
      .where("draw.roundId = :roundId", { roundId })
      .getOne();
  }

  // only last five rounds should be there else remove
  // remove all tickets also related to these rounds
  static async removeRound() {
    const allRounds = await this.drawRepo.find({
      order: {
        id: "ASC",
      },
    });
    if (allRounds.length > 5) {
      const roundsToRemove = allRounds.slice(0, allRounds.length - 5);
      await AviatorService.removeBetsByRounds(roundsToRemove);
      await this.drawRepo.remove(roundsToRemove);
    }
  }

  static async getGlobalHistory() {
    return await this.drawRepo
      .createQueryBuilder("draw")
      .orderBy("draw.id", "DESC")
      .take(5)
      .getMany();
  }

  static async deleteYesterdayAviatorData() {
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
