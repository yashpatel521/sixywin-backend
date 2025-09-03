import { Between } from "typeorm/find-options/operator/Between";
import AppDataSource from "../app-data-source";
import { DoubleTrouble } from "../entities/DoubleTrouble";
import { User } from "../entities/User";
import { MAX_NUMBER_DOUBLE_TROUBLE } from "../utils/constant";
import { DrawType } from "../utils/types";
import { UserService } from "./user.service";

export class DoubleTroubleService {
  static doubleTroubleRepo = AppDataSource.getRepository(DoubleTrouble);
  static async createTicket(
    user: User,
    drawType: DrawType,
    bidAmount: number,
    userNumber: number
  ) {
    await UserService.updateUser(user);
    let number = 1;
    if (drawType === ("Exact" as DrawType)) {
      number = MAX_NUMBER_DOUBLE_TROUBLE / 2;
    } else if (drawType === ("Under" as DrawType)) {
      number = 1;
    } else if (drawType === ("Over" as DrawType)) {
      number = MAX_NUMBER_DOUBLE_TROUBLE;
    } else if (drawType === ("Number" as DrawType)) {
      number = userNumber;
    }
    const ticket = this.doubleTroubleRepo.create({
      number,
      drawType,
      bidAmount,
      user,
      status: "pending",
    });
    await this.doubleTroubleRepo.save(ticket);
    const { referrals, tickets, ...userDataWithoutArrays } = user;
    return {
      user: userDataWithoutArrays,
      ticket,
    };
  }

  static async getAllPendingTickets() {
    return await this.doubleTroubleRepo.find({
      where: { status: "pending" },
      relations: ["user"],
    });
  }

  static async saveTicket(ticket: DoubleTrouble) {
    await this.doubleTroubleRepo.save(ticket);
  }

  static async getUserHistory(user: User, limit = 5) {
    return await this.doubleTroubleRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  static async deleteYesterdayTickets() {
    const today = new Date();

    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(today);
    endOfYesterday.setDate(today.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    await this.doubleTroubleRepo.delete({
      createdAt: Between(startOfYesterday, endOfYesterday),
    });
  }
}
