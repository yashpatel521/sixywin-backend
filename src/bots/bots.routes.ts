import { UserService } from "../services/user.service";
import { Router } from "express";
import { botRandomBid, createRandomBots } from "./bots.controller";

// Schedule Random Bid for bots

const router = Router();

router.get("/botBid", async (req, res) => {
  await botRandomBid();
  return res.json({ message: "Bot bid created successfully" });
});

router.get("/createRandomBots", async (req, res) => {
  await createRandomBots();
  return res.json({ message: "Random bots created successfully" });
});

export default router;
