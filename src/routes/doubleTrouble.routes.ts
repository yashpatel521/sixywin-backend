import * as express from "express";
import { Auth } from "../middleware/Auth";
import { DoubleTroubleController } from "../controllers/doubleTrouble.controller";

const router = express.Router();

//GET
router.get("/userHistory", Auth, DoubleTroubleController.getUserHistory);

// POST
router.post("/create", Auth, DoubleTroubleController.createTicket);

export default router;
