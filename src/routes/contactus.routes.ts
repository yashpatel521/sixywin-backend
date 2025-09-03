import * as express from "express";
import { ContactUsController } from "../controllers/contactus.controller";

const router = express.Router();

//POST
router.post("/create", ContactUsController.createContact);

export default router;
