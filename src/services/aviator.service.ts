import { Between } from "typeorm/find-options/operator/Between";
import AppDataSource from "../app-data-source";
import { Aviator } from "../entities/Aviator";
import { AviatorDraw } from "../entities/AviatorDraw";
import { User } from "../entities/User";
import { UserService } from "./user.service";

export class AviatorService {
  static aviatorRepo = AppDataSource.getRepository(Aviator);

  static async createTicket(user: User, amount: number) {
    const bid = this.aviatorRepo.create({
      user,
      amount,
      outcome: "pending",
    });
    await this.aviatorRepo.save(bid);
    await UserService.updateUser(user);
    return bid;
  }

  static async getPendingTicket(user: User) {
    const ticket = await this.aviatorRepo
      .createQueryBuilder("bid")
      .where("bid.user = :userId", { userId: user.id })
      .andWhere("bid.outcome = :outcome", { outcome: "pending" })
      .getMany();
    return ticket;
  }

  static async cashOutTicket(user: User, aviator: Aviator) {
    const aviatorBidSave = await this.aviatorRepo.save(aviator);
    const userSave = await UserService.updateUser(user);
    return { aviatorBidSave, user: userSave };
  }

  static async makeAllpendingLoss(draw: AviatorDraw) {
    const pendingBets = await this.aviatorRepo
      .createQueryBuilder("bid")
      .where("bid.outcome = :outcome", { outcome: "pending" })
      .getMany();

    pendingBets.forEach((bet) => {
      bet.outcome = "loss";
      bet.draw = draw;
      bet.cashOutMultiplier = draw.crashMultiplier || bet.cashOutMultiplier;
    });

    await this.aviatorRepo.save(pendingBets);
  }

  static async removeBetsByRounds(rounds: AviatorDraw[]) {
    const roundIds = rounds.map((round) => round.id);
    await this.aviatorRepo
      .createQueryBuilder()
      .delete()
      .from(Aviator)
      .where("drawId IN (:...roundIds)", { roundIds })
      .execute();
  }

  static async getUserHistory(user: User) {
    const history = await this.aviatorRepo
      .createQueryBuilder("bid")
      .where("bid.user = :userId", { userId: user.id })
      .orderBy("bid.createdAt", "DESC")
      .take(5)
      .getMany();
    return history;
  }

  static async deleteYesterdayAviatorData() {
    const today = new Date();

    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(today);
    endOfYesterday.setDate(today.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    await this.aviatorRepo.delete({
      createdAt: Between(startOfYesterday, endOfYesterday),
    });
  }
}
