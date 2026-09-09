import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function formatFrom(from: string | { name: string; address: string }): string {
  if (typeof from === 'string') return from;
  return `${from.name} <${from.address}>`;
}

interface MailOptions {
  from?: string | { name: string; address: string };
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

// Drop-in replacement for nodemailer's transporter.sendMail().
// Email is OPTIONAL: if RESEND_API_KEY is not configured, sending is skipped with
// a warning instead of throwing, so the app runs fine without email set up yet.
export default {
  sendMail({ from, to, subject, html, text, replyTo, headers }: MailOptions) {
    if (!process.env.RESEND_API_KEY) {
      const dest = Array.isArray(to) ? to.join(', ') : to;
      console.warn(`[mailer] RESEND_API_KEY not set — skipping email to ${dest} ("${subject}")`);
      return Promise.resolve({ id: null, skipped: true } as any);
    }
    return getResend().emails.send({
      from: formatFrom(from ?? (process.env.MAIL_USER as string)),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
      ...(headers ? { headers } : {}),
    });
  },
};
