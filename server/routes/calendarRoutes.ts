import express from "express";
import { bookSession, bookingLimiter, getUpcomingBookings, getMySessions, cancelBooking } from "../controllers/calendarController.js";
import { isAdmin } from "../controllers/adminMiddleware.js";
import { ensureAuthenticated } from "../controllers/auth.js";

const router = express.Router();

router.post("/book", bookingLimiter, bookSession);
router.get("/my-sessions", ensureAuthenticated, getMySessions);
router.post("/bookings/:id/cancel", ensureAuthenticated, cancelBooking);
router.get("/upcoming", isAdmin, getUpcomingBookings);

export default router;
