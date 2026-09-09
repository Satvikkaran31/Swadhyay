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

// Drop-in replacement for nodemailer's transporter.sendMail()
export default {
  sendMail({ from, to, subject, html, text, replyTo, headers }: MailOptions) {
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
