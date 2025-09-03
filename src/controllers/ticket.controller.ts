import { NextFunction, Response, Request } from "express";
import ApiResponse from "../Responses/ApiResponse";
import { TicketService } from "../services/ticket.service";
import { TICKET_SUBMITTED, TICKETS_FETCHED } from "../Responses/successMessage";
import {
  INSUFFICIENT_FUNDS,
  INVALID_CREDENTIALS,
  TICKET_GET_FAILED,
  TICKET_NOT_FOUND,
  TICKET_NUMBERS_REQUIRED,
  TICKET_SUBMISSION_FAILED,
  USER_NOT_AUTHENTICATED,
} from "../Responses/errorMessage";
import { updateUserCoins } from "../utils/common";

export class TicketController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    let user = req.user;
    if (!user) {
      return ApiResponse.errorResponse(res, null, USER_NOT_AUTHENTICATED);
    }
    const { numbers, bid } = req.body;
    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return ApiResponse.errorResponse(res, null, TICKET_NUMBERS_REQUIRED);
    }

    const updateUserCoin = updateUserCoins(user, bid);
    if (!updateUserCoin.success) {
      return ApiResponse.errorResponse(res, null, INSUFFICIENT_FUNDS);
    }
    user = updateUserCoin.user;
    try {
      const ticket = await TicketService.createTicket(user, numbers, bid);

      return ApiResponse.successResponse(res, ticket, TICKET_SUBMITTED);
    } catch (err) {
      return ApiResponse.errorResponse(res, null, TICKET_SUBMISSION_FAILED);
    }
  }

  static async getTicketByUserId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { userId } = req.params;
    const { pageNo } = req.query;
    if (!userId) {
      return ApiResponse.errorResponse(res, null, INVALID_CREDENTIALS);
    }
    try {
      const ticket = await TicketService.getTicketsByUserId(
        +userId,
        +(pageNo ?? 1)
      );
      if (!ticket) {
        return ApiResponse.errorResponse(res, null, TICKET_NOT_FOUND);
      }
      return ApiResponse.successResponse(res, ticket, TICKETS_FETCHED);
    } catch (err) {
      return ApiResponse.errorResponse(res, null, TICKET_GET_FAILED);
    }
  }

  static async getGlobalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const todayTickets = await TicketService.getTicketsByDateRange(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date()
      );
      const todayBids = todayTickets.reduce(
        (acc, ticket) => acc + ticket.bid,
        0
      );
      const todayTicketsCount = todayTickets.length;
      const todayTotalWinnings = todayTickets.reduce(
        (acc, ticket) => acc + ticket.coinsWon,
        0
      );
      return ApiResponse.successResponse(
        res,
        { todayBids, todayTicketsCount, todayTotalWinnings },
        TICKETS_FETCHED
      );
    } catch (err) {
      return ApiResponse.errorResponse(res, null, TICKET_GET_FAILED);
    }
  }
}
