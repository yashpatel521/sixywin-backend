import { NextFunction, Response, Request } from "express";
import { ContactUsService } from "../services/contactus.service";
import ApiResponse from "../Responses/ApiResponse";
import {
  ALL_FIELDS_REQUIRED,
  CONTACT_US_CREATION_FAILED,
} from "../Responses/errorMessage";
import { CONTACT_US_CREATED } from "../Responses/successMessage";

export class ContactUsController {
  static async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, title, description } = req.body;
      if (!name || !email || !title || !description) {
        return ApiResponse.errorResponse(res, null, ALL_FIELDS_REQUIRED);
      }
      const contact = await ContactUsService.createContact(
        name,
        email,
        title,
        description
      );
      return ApiResponse.successResponse(res, contact, CONTACT_US_CREATED);
    } catch (error) {
      return ApiResponse.errorResponse(res, null, CONTACT_US_CREATION_FAILED);
    }
  }
}
