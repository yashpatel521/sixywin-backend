import {
  USER_REGISTERED,
  LOGIN_SUCCESS,
  GET_LEADERBOARD,
} from "../Responses/successMessage";
import {
  ALL_FIELDS_REQUIRED,
  EMAIL_OR_USERNAME_EXISTS,
  REGISTRATION_FAILED,
  INVALID_REFERRAL_ID,
  REFERRAL_NOT_FOUND,
  INVALID_CREDENTIALS,
  USER_NOT_AUTHENTICATED,
  GET_LEADERBOARD_FAILED,
  GOOGLE_AUTHENTICATION_FAILED,
} from "../Responses/errorMessage";
import { UserService } from "../services/user.service";
import { createJwtToken } from "../utils/common";
import { NextFunction, Response, Request } from "express";
import ApiResponse from "../Responses/ApiResponse";
import { DeepPartial } from "typeorm";
import { User } from "../entities/User";

export class UserController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await UserService.findUserByEmail(email);
      if (!user) {
        return ApiResponse.errorResponse(res, null, INVALID_CREDENTIALS);
      }
      if (password !== user.password) {
        return ApiResponse.errorResponse(res, null, INVALID_CREDENTIALS);
      }

      const jwt = createJwtToken({ id: user.id });
      const filteredData: DeepPartial<User> = user;

      const data = {
        token: jwt,
        user: filteredData,
      };

      return ApiResponse.successResponse(res, data, LOGIN_SUCCESS);
    } catch (error) {
      return ApiResponse.errorResponse(res, error, "Login failed");
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponse.errorResponse(res, null, USER_NOT_AUTHENTICATED);
      }
      const token = createJwtToken({ id: req.user.id });
      return ApiResponse.successResponse(res, { user: req.user, token });
    } catch (error) {
      return next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password, referralId } = req.body;

      if (!email || !username || !password) {
        return ApiResponse.errorResponse(res, null, ALL_FIELDS_REQUIRED);
      }

      // Check if user already exists
      const existing = await UserService.findUserByEmail(email);
      if (existing) {
        return ApiResponse.errorResponse(res, null, EMAIL_OR_USERNAME_EXISTS);
      }

      // Validate referral ID if provided
      if (referralId) {
        if (typeof referralId !== "string" || referralId.trim() === "") {
          return ApiResponse.errorResponse(res, null, INVALID_REFERRAL_ID);
        }

        const referrer = await UserService.findUserByReferralId(
          referralId.trim()
        );
        if (!referrer) {
          return ApiResponse.errorResponse(res, null, REFERRAL_NOT_FOUND);
        }
      }

      // Create user with referral if provided
      const user = await UserService.createUser(
        email,
        username,
        password,
        referralId
      );
      const token = createJwtToken({ id: user.id });

      return ApiResponse.successResponse(res, { user, token }, USER_REGISTERED);
    } catch (err) {
      return ApiResponse.errorResponse(res, err, REGISTRATION_FAILED);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      let parsedLimit = 10;
      if (typeof limit === "string") {
        parsedLimit = parseInt(limit) || 10;
      } else if (Array.isArray(limit) && typeof limit[0] === "string") {
        parsedLimit = parseInt(limit[0]) || 10;
      }
      const users = await UserService.getLeaderboard(parsedLimit);
      return ApiResponse.successResponse(res, users, GET_LEADERBOARD);
    } catch (err) {
      return ApiResponse.errorResponse(res, err, GET_LEADERBOARD_FAILED);
    }
  }

  static async socialLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, referralId, googleId, avatar } = req.body;
      if (!email || !username || !googleId) {
        return ApiResponse.errorResponse(res, null, ALL_FIELDS_REQUIRED);
      }

      // check user already exists
      const existingUser = await UserService.findUserByGoogleId(googleId);
      if (existingUser) {
        const token = createJwtToken({ id: existingUser.id });
        return ApiResponse.successResponse(
          res,
          { token, user: existingUser },
          LOGIN_SUCCESS
        );
      }

      // check user exist with email
      const userWithEmail = await UserService.findUserByEmail(email);
      if (userWithEmail && !userWithEmail.googleId) {
        userWithEmail.googleId = googleId;
        userWithEmail.avatar = avatar;
        await UserService.updateUser(userWithEmail);
        const token = createJwtToken({ id: userWithEmail.id });
        return ApiResponse.successResponse(
          res,
          { token, user: userWithEmail },
          LOGIN_SUCCESS
        );
      }

      // Create new user
      const newUser = await UserService.createUser(
        email,
        username,
        undefined,
        referralId || undefined,
        googleId,
        avatar
      );
      const token = createJwtToken({ id: newUser.id });

      return ApiResponse.successResponse(
        res,
        { token, user: newUser },
        LOGIN_SUCCESS
      );
    } catch (error) {
      console.error("Error authenticating with Google:", error);
      return ApiResponse.errorResponse(
        res,
        error,
        GOOGLE_AUTHENTICATION_FAILED
      );
    }
  }

  static async getUserProfile(payload: any, requestId?: string) {
    try {
      const { userId } = payload;
      if (!userId) {
        return {
          type: "userProfile_response",
          requestId,
          payload: { success: false, message: "User ID is required." },
        };
      }

      const user = await UserService.findUserById(+userId);
      if (!user) {
        return {
          type: "userProfile_response",
          requestId,
          payload: { success: false, message: "User not found." },
        };
      }

      // Get user referrals
      const referrals = await UserService.getUserReferrals(user.id);

      // Transform referral data to match frontend expectations
      const referredUsers = referrals.map((referral) => ({
        id: referral.referred.id,
        username: referral.referred.username,
        avatar: referral.referred.avatar,
        createdAt: referral.createdAt.toISOString(),
      }));

      return {
        type: "userProfile_response",
        requestId,
        payload: {
          success: true,
          message: "User profile fetched successfully.",
          data: { user, referredUsers },
        },
      };
    } catch (err) {
      return {
        type: "userProfile_response",
        requestId,
        payload: {
          success: false,
          message: "Failed to fetch user profile.",
          error: err,
        },
      };
    }
  }

  static async spinWheel(payload: any, requestId?: string) {
    try {
      const user = payload.user;
      if (user.isSpinned) {
        return {
          type: "spinWheel_response",
          requestId,
          payload: { success: false, message: "User already spin today" },
        };
      }
      user.isSpinned = true;
      user.coins += payload.amount;
      await UserService.updateUser(user);
      // return user without tickets and refernces
      const { tickets, referrals, ...userData } = user;
      return {
        type: "spinWheel_response",
        requestId,
        payload: {
          success: true,
          data: { ...userData, amount: payload.amount },
        },
      };
    } catch (err) {
      return {
        type: "spinWheel_response",
        requestId,
        payload: {
          success: false,
          message: "Failed to spin wheel",
          error: err,
        },
      };
    }
  }
}
