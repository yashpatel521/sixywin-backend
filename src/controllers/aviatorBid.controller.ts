import { AviatorDrawService } from "../services/aviatorDraw.service";
import { AviatorService } from "../services/aviator.service";
import { NextFunction, Response, Request } from "express";
import ApiResponse from "../Responses/ApiResponse";
import { updateUserCoins } from "../utils/common";
import {
  AVIATOR_HISTORY_NOT_FOUND,
  AVIATOR_NO_PENDING_TICKET,
  AVIATOR_ROUND_NOT_FOUND,
  AVIATOR_TICKET_CREATION_FAILED,
  INSUFFICIENT_FUNDS,
  INVALID_BID_AMOUNT,
  USER_NOT_AUTHENTICATED,
} from "../Responses/errorMessage";
import {
  AVIATOR_HISTORY_FETCHED,
  AVIATOR_TICKET_CASHED_OUT,
  AVIATOR_TICKET_CREATED,
} from "../Responses/successMessage";
export class AviatorBidController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      let user = req.user;
      const { amount } = req.body;

      if (!user || !amount) {
        return ApiResponse.errorResponse(res, null, INVALID_BID_AMOUNT);
      }

      const updateUserCoin = updateUserCoins(user, amount);
      if (!updateUserCoin.success) {
        return ApiResponse.errorResponse(res, null, INSUFFICIENT_FUNDS);
      }
      user = updateUserCoin.user;

      const result = await AviatorService.createTicket(user, amount);
      return ApiResponse.successResponse(res, result, AVIATOR_TICKET_CREATED);
    } catch (error) {
      return ApiResponse.errorResponse(
        res,
        error,
        AVIATOR_TICKET_CREATION_FAILED
      );
    }
  }

  static async getUserHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return ApiResponse.errorResponse(res, null, USER_NOT_AUTHENTICATED);
      }
      const history = await AviatorService.getUserHistory(user);
      return ApiResponse.successResponse(
        res,
        history.reverse(),
        AVIATOR_HISTORY_FETCHED
      );
    } catch (error) {
      return ApiResponse.errorResponse(res, error, AVIATOR_HISTORY_NOT_FOUND);
    }
  }

  static async cashOutTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { crashMultiplier, roundId } = req.body;
      const user = req.user;
      if (!user || !crashMultiplier || !roundId) {
        return ApiResponse.errorResponse(res, null, INVALID_BID_AMOUNT);
      }

      // check if user has a pending ticket
      const pendingTickets = await AviatorService.getPendingTicket(user);
      if (!pendingTickets.length) {
        return ApiResponse.errorResponse(res, null, AVIATOR_NO_PENDING_TICKET);
      }
      // check getRoundId draw
      const round = await AviatorDrawService.getRoundById(roundId);
      if (!round) {
        return ApiResponse.errorResponse(res, null, AVIATOR_ROUND_NOT_FOUND);
      }

      const pendingTicket = pendingTickets[0];
      pendingTicket.cashOutMultiplier = crashMultiplier;
      const winningAmount = Math.ceil(pendingTicket.amount * crashMultiplier);
      pendingTicket.cashOutMultiplier = crashMultiplier;
      user.winningAmount += winningAmount;
      user.totalWon += winningAmount;
      pendingTicket.amountWon = winningAmount;
      pendingTicket.outcome = "win";
      pendingTicket.user = user;
      const result = await AviatorService.cashOutTicket(user, pendingTicket);
      return ApiResponse.successResponse(
        res,
        result,
        AVIATOR_TICKET_CASHED_OUT
      );
    } catch (error) {
      return ApiResponse.errorResponse(
        res,
        error,
        "Failed to cash out Aviator ticket"
      );
    }
  }
}
