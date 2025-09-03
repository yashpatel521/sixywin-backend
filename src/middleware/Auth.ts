import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../utils/types";
import { TOKEN_SECRET } from "../utils/constant";
import { UserService } from "../services/user.service";
import { USER_NOT_AUTHENTICATED } from "../Responses/errorMessage";

interface JWT_DECODE {
  id: number;
  iat: number;
  exp: number;
}

export const Auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader
      ? authHeader.includes("Bearer")
        ? authHeader.split(" ")[1]
        : null
      : null;
    if (!token) {
      throw new Error(USER_NOT_AUTHENTICATED);
    } else {
      const data = jwt.verify(token, TOKEN_SECRET!) as JWT_DECODE;

      const user = await UserService.findUserById(data.id);

      if (!user) {
        throw new Error(USER_NOT_AUTHENTICATED);
      }

      req.user = user;
      next();
    }
  } catch (error) {
    next(error);
  }
};
