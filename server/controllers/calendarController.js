import { google } from "googleapis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
import { DateTime } from "luxon";

dotenv.config();

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const bookSession = async (req, res) => {
  const { name, email, date, time, sessionType, meetingType } = req.body;

  if (!name || !email || !date || !time || !sessionType || !meetingType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Correct time construction in Asia/Kolkata
    const dateTime = DateTime.fromISO(`${date}T${time}`, { zone: "Asia/Kolkata" });
    const endTime = dateTime.plus({ hours: 1 });
    let meetLink;

    // 1. Create Google Calendar Event (Google Meet)
    if (meetingType === "google") {
      const event = {
        summary: `${sessionType} with ${name}`,
        description: `Platform: Google Meet\nType: ${sessionType}`,
        start: {
          dateTime: dateTime.toISO(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime.toISO(),
          timeZone: "Asia/Kolkata",
        },
        attendees: [
          { email },
          { email: process.env.ADMIN_EMAIL }
        ],
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
        resource: event,
      });

      meetLink = response?.data?.hangoutLink;
      if (!meetLink) throw new Error("Google Meet link could not be created.");
      console.log("Google Meet link:", meetLink);
    }

    // 2. Send confirmation email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: [email, process.env.ADMIN_EMAIL],
      subject: `${sessionType} Confirmed`,
      html: `
        <h2>Your session is confirmed!</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Session Type:</strong> ${sessionType}</p>
        <p><strong>Platform:</strong> ${meetingType === "google" ? "Google Meet" : "Microsoft Teams"}</p>
        <p><strong>Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
      `,
    });

    console.log(" Confirmation email sent.");

    // 3. Mirror Event in Outlook
    try {
      const tokenRes = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
          client_id: process.env.MS_CLIENT_ID,
          scope: "https://graph.microsoft.com/.default",
          client_secret: process.env.MS_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const accessToken = tokenRes.data.access_token;

      await axios.post(
        `https://graph.microsoft.com/v1.0/users/${process.env.ADMIN_EMAIL}/calendar/events`,
        {
          subject: `${sessionType} with ${name}`,
          start: {
            dateTime: dateTime.toISO(),
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: endTime.toISO(),
            timeZone: "Asia/Kolkata",
          },
          attendees: [
            {
              emailAddress: { address: email, name },
              type: "required",
            },
            {
              emailAddress: {
                address: process.env.ADMIN_EMAIL,
                name: "Admin",
              },
              type: "required",
            },
          ],
          location: {
            displayName: "Google Meet (see link below)",
          },
          body: {
            contentType: "HTML",
            content: `Session link: <a href="${meetLink}">${meetLink}</a>`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(" Outlook calendar event created.");
    } catch (msError) {
      console.error(" Outlook calendar error:", msError.response?.data || msError.message);
    }

    //  4. Final response
    res.status(200).json({ success: true, meetLink });
  } catch (err) {
    console.error(" Booking Error:", {
      message: err.message,
      stack: err.stack,
      response: err.response?.data,
    });
    res.status(500).json({ error: "Failed to book session" });
  }
};
