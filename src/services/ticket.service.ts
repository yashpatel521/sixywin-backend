import { Ticket } from "../entities/Ticket";
import { User } from "../entities/User";
import AppDataSource from "../app-data-source";
import { Between } from "typeorm";
import { UserService } from "./user.service";
import { USER_MAX_TICKETS } from "../utils/constant";

export class TicketService {
  static async createTicket(user: User, numbers: number[], bid: number = 1) {
    await UserService.updateUser(user);
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const ticket = ticketRepo.create({ user, numbers, bid });
    await ticketRepo.save(ticket);
    const { referrals, tickets, ...userDataWithoutArrays } = user;
    return { ticket, user: userDataWithoutArrays, bid };
  }

  static async getTicketsByUserId(userId: number, pageNo: number = 1) {
    const ticketRepo =
      AppDataSource.getRepository(Ticket).createQueryBuilder("ticket");
    ticketRepo.leftJoinAndSelect("ticket.drawResult", "drawResult");
    ticketRepo.where("ticket.userId = :userId", { userId });
    ticketRepo.orderBy("ticket.createdAt", "DESC");
    ticketRepo.skip((pageNo - 1) * USER_MAX_TICKETS);
    ticketRepo.take(USER_MAX_TICKETS);
    return await ticketRepo.getMany();
  }

  static async getAllPendingTickets() {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    return await ticketRepo.find({
      where: { result: "pending" },
      relations: ["user"],
      order: {
        createdAt: "DESC",
      },
    });
  }

  static async saveTicket(ticket: Ticket) {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    await ticketRepo.save(ticket);
  }

  static async saveTickets(tickets: Ticket[]) {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    await ticketRepo.save(tickets);
  }

  static async getTicketsByDateRange(startDate: Date, endDate: Date) {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    return await ticketRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ["user"],
      order: {
        createdAt: "DESC",
      },
    });
  }

  static async deleteYesterdayTickets() {
    const ticketRepo = AppDataSource.getRepository(Ticket);

    const today = new Date();
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(today);
    endOfYesterday.setDate(today.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    await ticketRepo.delete({
      createdAt: Between(startOfYesterday, endOfYesterday),
    });
  }
}
