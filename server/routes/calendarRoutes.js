// server/routes/calendarRoutes.js
import express from "express";
import { bookSession, getUpcomingBookings } from "../controllers/calendarController.js";
import { isAdmin } from "../controllers/adminMiddleware.js";

const router = express.Router();

router.post("/book", bookSession);
router.get("/upcoming", isAdmin, getUpcomingBookings);

export default router;
