import * as express from "express";
import { Auth } from "../middleware/Auth";
import { TicketController } from "../controllers/ticket.controller";

const router = express.Router();

//GET
router.get("/userTickets/:userId", Auth, TicketController.getTicketByUserId);
router.get("/globalStats", Auth, TicketController.getGlobalStats);

//POST
router.post("/create", Auth, TicketController.createTicket);

export default router;
