import express from 'express';
import graphClient from '../controllers/graphClients.js';
import { DateTime } from 'luxon';

const router = express.Router();

router.get('/', async (req, res) => {
  const dateStr = req.query.date;
  if (!dateStr) {
    return res.status(400).json({ error: "Missing 'date' query parameter." });
  }

  let date;
  try {
    date = DateTime.fromISO(dateStr, { zone: "Asia/Kolkata" });
    if (!date.isValid) {
      // Throw an error if the date string is not a valid ISO format (e.g., "not-a-date")
      throw new Error('Invalid date format.');
    }
  } catch (err) {
    return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
  }
  

  const weekday = date.weekday; // 

  // Step 1: Define allowed slots based on the day of the week
  let allowedSlots = [];
  if (weekday >= 1 && weekday <= 5) { 
    allowedSlots = [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
    ];
  } else if (weekday === 6) { // Saturday
    allowedSlots = ["11:00", "11:30", "12:00", "12:30"];
  } else { // Sunday
    return res.json({ slots: [] });
  }

  // Step 2: Fetch busy events from the Microsoft Graph Calendar
  const startOfDayISO = date.startOf('day').toISO();
  const endOfDayISO = date.endOf('day').toISO();
 

  const startOfDay = encodeURIComponent(startOfDayISO);
  const endOfDay = encodeURIComponent(endOfDayISO);
// --------------------------------------------------------

  try {
    console.log("Calling Graph for events for:", process.env.ADMIN_EMAIL);
    const events = await graphClient
      .api(`/users/${process.env.ADMIN_EMAIL}/calendarView`)
      .header("Prefer", 'outlook.timezone="Asia/Kolkata"') 
      .query({ startDateTime: startOfDay, endDateTime: endOfDay })
      .select("start,end")
      .orderby("start/dateTime")
      .get();
      console.log("Events returned from Graph:", events); 
    // Map busy events to Luxon DateTime ranges for easy comparison
    const busyRanges = events.value.map(ev => ({
      start: DateTime.fromISO(ev.start.dateTime, { zone: "Asia/Kolkata" }),
      end: DateTime.fromISO(ev.end.dateTime, { zone: "Asia/Kolkata" })
    }));

    //  Filter allowed slots against the busy time ranges
    const availableSlots = allowedSlots.filter(timeStr => {
      const slotStart = date.set({
        hour: parseInt(timeStr.split(":")[0]),
        minute: parseInt(timeStr.split(":")[1]),
        second: 0,
        millisecond: 0
      });
      const slotEnd = slotStart.plus({ minutes: 30 });

      // A slot is unavailable if it overlaps with ANY busy event.
      
      const isOverlapping = busyRanges.some(busyEvent =>
        slotStart < busyEvent.end && slotEnd > busyEvent.start
      );

      return !isOverlapping; // Return true only if the slot is not overlapping
    });

    res.json({ slots: availableSlots });
  } catch (err) {
    // Log the actual error on the server for debugging
    console.error("Error checking calendar:", err); 
    res.status(500).json({ error: "Failed to fetch availability from the calendar." });
  }
});

export default router;