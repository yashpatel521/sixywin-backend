import { TicketDrawService } from "../services/ticketDraw.service";

export class DrawController {
  static async getLatestDraw(payload: any, requestId?: string) {
    try {
      const latestDraw = await TicketDrawService.getLatestDraw();

      if (!latestDraw) {
        return {
          type: "latestDraw_response",
          message: "No draw found",
          payload: {
            success: false,
            message: "No draw found",
          },
        };
      }

      return {
        type: "latestDraw_response",
        requestId,
        payload: {
          success: true,
          message: "Latest draw fetched successfully.",
          data: latestDraw,
        },
      };
    } catch (err: any) {
      return {
        type: "latestDraw_response",
        message: "Failed to fetch latest draw",
        error: err.message,
        payload: {
          success: false,
          message: "Failed to fetch latest draw",
        },
      };
    }
  }
}
