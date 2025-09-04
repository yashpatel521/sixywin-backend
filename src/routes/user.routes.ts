import * as express from "express";
import { Auth } from "../middleware/Auth";
import { UserController } from "../controllers/user.controller";
import schemas, { validate } from "../Validation/validators";

const router = express.Router();

//GET
router.get("/me", Auth, UserController.getMe);
router.get("/leaderboard", Auth, UserController.getLeaderboard);

//POST
router.post("/login", validate.body(schemas.login), UserController.login);
router.post(
  "/register",
  validate.body(schemas.register),
  UserController.register
);
router.post(
  "/socialLogin",
  validate.body(schemas.socialLogin),
  UserController.socialLogin
);
router.post("/update", Auth, UserController.update);

export default router;
