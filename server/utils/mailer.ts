import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
}

// Drop-in replacement for nodemailer's transporter.sendMail()
export default {
  sendMail({ from, to, subject, html, text, replyTo }: MailOptions) {
    return resend.emails.send({
      from: formatFrom(from ?? (process.env.MAIL_USER as string)),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });
  },
};
