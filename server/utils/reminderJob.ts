import cron from 'node-cron';
import validator from 'validator';
import pool from './db.js';
import mailer from './mailer.js';

const e = (s: string) => validator.escape(String(s));

async function sendReminders() {
  let rows: Array<{
    id: number;
    user_email: string;
    user_name: string;
    session_type: string;
    session_start: Date;
    meet_link: string | null;
  }>;

  try {
    const result = await pool.query(
      `SELECT id, user_email, user_name, session_type, session_start, meet_link
       FROM bookings
       WHERE reminder_sent = false
         AND session_start BETWEEN NOW() + INTERVAL '23 hours'
                               AND NOW() + INTERVAL '25 hours'`
    );
    rows = result.rows;
  } catch (err: any) {
    console.error('Reminder job: failed to query bookings:', err.message);
    return;
  }

  for (const booking of rows) {
    try {
      const dateStr = new Date(booking.session_start).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      const timeStr = new Date(booking.session_start).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
      });

      const safeMeetLink =
        booking.meet_link &&
        validator.isURL(booking.meet_link, { protocols: ['https'], require_protocol: true })
          ? booking.meet_link
          : null;
      const meetLinkHtml = safeMeetLink
        ? `<p><a href="${e(safeMeetLink)}" style="background:#1A2B3C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Join on Google Meet</a></p>`
        : '';
      await mailer.sendMail({
        from: process.env.MAIL_USER as string,
        to: booking.user_email,
        subject: `Reminder: Your ${e(booking.session_type)} session is tomorrow`,
        html: `
          <h2>Session Reminder</h2>
          <p>Hi ${e(booking.user_name)},</p>
          <p>This is a reminder that your <strong>${e(booking.session_type)}</strong> session with Neha is scheduled for:</p>
          <p style="font-size:1.1rem;font-weight:bold">${e(dateStr)} at ${e(timeStr)} IST</p>
          ${meetLinkHtml}
          <p>Please ensure you're in a quiet space 5 minutes before your session starts.</p>
          <p>See you soon!<br/>Neha</p>
        `,
      });

      await pool.query('UPDATE bookings SET reminder_sent = true WHERE id = $1', [booking.id]);
      console.log(`Reminder sent to ${booking.user_email} for session at ${booking.session_start}`);
    } catch (err: any) {
      console.error(`Reminder job: failed for booking ${booking.id} (${booking.user_email}):`, err.message);
    }
  }
}

// Run every hour
export function startReminderJob() {
  cron.schedule('0 * * * *', sendReminders);
  console.log('Session reminder job scheduled (runs every hour)');
}
