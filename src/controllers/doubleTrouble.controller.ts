import ApiResponse from "../Responses/ApiResponse";
import { DoubleTroubleService } from "../services/doubleTrouble.service";
import { NextFunction, Response, Request } from "express";
import {
  INSUFFICIENT_FUNDS,
  USER_NOT_AUTHENTICATED,
} from "../Responses/errorMessage";

export class DoubleTroubleController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { drawType, bidAmount, userNumber } = req.body;

      if (!user) {
        return ApiResponse.errorResponse(res, null, USER_NOT_AUTHENTICATED);
      }
      // update user data
      const totalFunds = user.coins + user.winningAmount;
      if (totalFunds < bidAmount) {
        return ApiResponse.errorResponse(res, null, INSUFFICIENT_FUNDS);
      }
      if (user.coins > bidAmount) {
        user.coins -= bidAmount;
      } else {
        const remainingPayload = bidAmount - user.coins;
        user.winningAmount -= remainingPayload;
        user.coins = 0;
      }
      user.todaysBids += bidAmount;
      const result = await DoubleTroubleService.createTicket(
        user,
        drawType,
        bidAmount,
        userNumber
      );
      return ApiResponse.successResponse(
        res,
        result.ticket,
        "Double trouble ticket created successfully"
      );
    } catch (error) {
      console.error("Error creating double trouble ticket:", error);
      return ApiResponse.errorResponse(
        res,
        error,
        "Failed to create double trouble ticket"
      );
    }
  }

  static async getUserHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return ApiResponse.errorResponse(res, null, USER_NOT_AUTHENTICATED);
      }
      const result = await DoubleTroubleService.getUserHistory(user);
      return ApiResponse.successResponse(
        res,
        result,
        "User history fetched successfully"
      );
    } catch (error) {
      console.error("Error getting user history:", error);
      return ApiResponse.errorResponse(
        res,
        error,
        "Failed to get user history"
      );
    }
  }
}
