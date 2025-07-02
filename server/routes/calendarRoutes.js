// server/routes/calendarRoutes.js
import express from "express";
import { bookSession } from "../controllers/calendarController.js";

const router = express.Router();

router.post("/book", bookSession);

export default router;
