import { AviatorDrawService } from "../services/aviatorDraw.service";
import { NextFunction, Response, Request } from "express";
import ApiResponse from "../Responses/ApiResponse";
export class AviatorDrawController {
  static async getGlobalHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const history = await AviatorDrawService.getGlobalHistory();
      ApiResponse.successResponse(
        res,
        history,
        "Global history fetched successfully"
      );
    } catch (error) {
      ApiResponse.errorResponse(res, error, "Error fetching global history");
    }
  }
}
