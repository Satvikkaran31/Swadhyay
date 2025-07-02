import { google } from "googleapis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const bookSession = async (req, res) => {
  const { name, email, date, time, sessionType, meetingType } = req.body;

  try {
    const dateTime = new Date(`${date}T${time}`);
    const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000);
    let meetLink;

    if (meetingType === "google") {
      const event = {
        summary: `${sessionType} with ${name}`,
        description: `Platform: Google Meet\nType: ${sessionType}`,
        start: { dateTime: dateTime.toISOString(), timeZone: "Asia/Kolkata" },
        end: { dateTime: endTime.toISOString(), timeZone: "Asia/Kolkata" },
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
        resource: event,
      });

      meetLink = response.data.hangoutLink;
    }

    // Send Email
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

    res.status(200).json({ success: true, meetLink });
    // After meetLink is created by Google API
try {
  const msTokenRes = await axios.post(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID,
      scope: "https://graph.microsoft.com/.default",
      client_secret: process.env.MS_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const msToken = msTokenRes.data.access_token;

  await axios.post(
    `https://graph.microsoft.com/v1.0/users/${process.env.ADMIN_EMAIL}/calendar/events`,
    {
      subject: `${sessionType} with ${name}`,
      start: {
        dateTime: dateTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      attendees: [
        {
          emailAddress: {
            address: email,
            name,
          },
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
        displayName: "Google Meet (link below)",
      },
      body: {
        contentType: "HTML",
        content: `Session link: <a href="${meetLink}">${meetLink}</a>`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${msToken}`,
        "Content-Type": "application/json",
      },
    }
  );
} catch (err) {
  console.error("Failed to create Outlook event:", err.response?.data || err.message);
}

  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: "Failed to book session" });
  }
};
