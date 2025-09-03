import * as express from "express";
import { Auth } from "../middleware/Auth";
import { AviatorBidController } from "../controllers/aviatorBid.controller";
import { AviatorDrawController } from "../controllers/aviatorDraw.controller";

const router = express.Router();

// GET
router.get("/userHistory", Auth, AviatorBidController.getUserHistory);
router.get("/globalHistory", Auth, AviatorDrawController.getGlobalHistory);

//POST
router.post("/create", Auth, AviatorBidController.createTicket);
router.post("/cashout", Auth, AviatorBidController.cashOutTicket);

export default router;
