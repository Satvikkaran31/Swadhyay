import { google } from "googleapis";
import axios from "axios";
import { DateTime } from "luxon";
import mailer from "../utils/mailer.js";
import pool from "../utils/db.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE  = /^\d{2}:\d{2}$/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const bookSession = async (req, res) => {
  const { name, email, date, time, sessionType, meetingType, occupation, organization } = req.body;

  if (!name || !email || !date || !time || !sessionType || !meetingType || !occupation || !organization) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
  }

  if (!TIME_RE.test(time)) {
    return res.status(400).json({ error: "Time must be in HH:MM format" });
  }

  const bookingDt = DateTime.fromISO(`${date}T${time}`, { zone: "Asia/Kolkata" });
  if (!bookingDt.isValid || bookingDt < DateTime.now()) {
    return res.status(400).json({ error: "Booking must be in the future" });
  }

  // Escape all user-provided values before putting them in HTML
  const safeName = escapeHtml(name.trim());
  const safeOccupation = escapeHtml(occupation.trim());
  const safeOrganization = escapeHtml(organization.trim());
  const safeSessionType = escapeHtml(sessionType.trim());

  try {
    const dateTime = DateTime.fromISO(`${date}T${time}`, { zone: "Asia/Kolkata" });
    const endTime = dateTime.plus({ hours: 1 });
    let meetLink: string | undefined;
    let googleEventId: string | null = null;

    // 1. Create Google Calendar Event
    if (meetingType === "google") {
      const event = {
        summary: `${safeName} – ${safeSessionType}`,
        description: `Platform: Google Meet\nType: ${safeSessionType}\nOccupation: ${safeOccupation}\nCompany/Institution: ${safeOrganization}`,
        start: { dateTime: dateTime.toISO(), timeZone: "Asia/Kolkata" },
        end: { dateTime: endTime.toISO(), timeZone: "Asia/Kolkata" },
        attendees: [{ email }, { email: process.env.ADMIN_EMAIL }],
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: event,
      } as any);

      meetLink = (response as any)?.data?.hangoutLink;
      googleEventId = (response as any)?.data?.id ?? null;
      if (!meetLink) throw new Error("Google Meet link could not be created.");
    }

    // 2. Confirmation email to user
    await mailer.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: `Your ${safeSessionType} Session is Confirmed`,
      html: `
        <h2>Your session is confirmed!</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(time)} IST</p>
        <p><strong>Session Type:</strong> ${safeSessionType}</p>
        ${meetLink
          ? `<p><strong>Platform:</strong> Google Meet</p>
             <p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>`
          : `<p><strong>Platform:</strong> ${escapeHtml(meetingType)}</p>
             <p>You will receive joining details separately.</p>`
        }
        <p>You will receive a calendar invitation shortly.</p>
      `,
    });

    // 3. Detailed notification to admin
    await mailer.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Booking: ${safeSessionType} with ${safeName}`,
      html: `
        <h2>New Session Booked!</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Occupation:</strong> ${safeOccupation}</p>
        <p><strong>Company/Institution:</strong> ${safeOrganization}</p>
        <p><strong>Date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(time)} IST</p>
        <p><strong>Session Type:</strong> ${safeSessionType}</p>
        ${meetLink ? `<p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
      `,
    });

    // 4. Mirror to Outlook (best-effort)
    try {
      const tokenRes = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
          client_id: process.env.MS_CLIENT_ID!,
          scope: "https://graph.microsoft.com/.default",
          client_secret: process.env.MS_CLIENT_SECRET!,
          grant_type: "client_credentials",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const accessToken = tokenRes.data.access_token;
      await axios.post(
        `https://graph.microsoft.com/v1.0/users/${process.env.ADMIN_EMAIL}/calendar/events`,
        {
          subject: `${safeSessionType} with ${safeName}`,
          start: { dateTime: dateTime.toISO(), timeZone: "Asia/Kolkata" },
          end: { dateTime: endTime.toISO(), timeZone: "Asia/Kolkata" },
          attendees: [
            { emailAddress: { address: email, name: safeName }, type: "required" },
            { emailAddress: { address: process.env.ADMIN_EMAIL, name: "Admin" }, type: "required" },
          ],
          location: { displayName: meetLink ? "Google Meet (see link in body)" : meetingType },
          body: {
            contentType: "HTML",
            content: `Session with ${safeName} (${safeOccupation} at ${safeOrganization}).${meetLink ? `<br><br>Join: <a href="${meetLink}">${meetLink}</a>` : ''}`,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
    } catch (msError: any) {
      console.error("Outlook calendar error:", msError.response?.data || msError.message);
    }

    // 5. Save booking for reminder job
    const sessionStart = DateTime.fromISO(`${date}T${time}`, { zone: "Asia/Kolkata" }).toJSDate();
    await pool.query(
      `INSERT INTO bookings (google_event_id, user_email, user_name, session_type, meeting_type, session_start, meet_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [googleEventId, email, name.trim(), sessionType.trim(), meetingType, sessionStart, meetLink ?? null]
    );

    res.status(200).json({ success: true, meetLink });
  } catch (err: any) {
    console.error("Booking Error:", { message: err.message, response: err.response?.data });
    res.status(500).json({ error: "Failed to book session" });
  }
};

export const getMySessions = async (req, res) => {
  const email = req.session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { rows } = await pool.query(
      `SELECT id, session_type, meeting_type, session_start, meet_link, cancelled_at, created_at
       FROM bookings WHERE user_email = $1 ORDER BY session_start DESC`,
      [email]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const cancelBooking = async (req, res) => {
  const email = req.session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_email = $2`,
      [id, email]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    const booking = rows[0];
    if (booking.cancelled_at) return res.status(400).json({ error: 'Already cancelled' });
    if (new Date(booking.session_start) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past sessions' });
    }

    // Best-effort: delete from Google Calendar
    if (booking.google_event_id) {
      calendar.events.delete({ calendarId: 'primary', eventId: booking.google_event_id })
        .catch(err => console.error('Google Calendar delete error:', err.message));
    }

    await pool.query(
      `UPDATE bookings SET cancelled_at = NOW() WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

export const getUpcomingBookings = async (req, res) => {
  try {
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });
    const bookings = (response.data.items || []).map((ev) => ({
      id: ev.id,
      title: ev.summary,
      start: ev.start?.dateTime || ev.start?.date,
      end: ev.end?.dateTime || ev.end?.date,
      attendees: ev.attendees?.map((a) => a.email) || [],
      meetLink: ev.hangoutLink,
    }));
    res.json({ bookings });
  } catch (err) {
    console.error("Upcoming bookings error:", err);
    res.status(500).json({ error: "Failed to fetch upcoming bookings" });
  }
};
