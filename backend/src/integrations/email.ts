import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});

export function sendVerificationEmail(email: string, code: string) {
  return transporter.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_USER },
    to: email,
    subject: "Confirm your Momentum account",
    text: `Your Momentum verification code is ${code}. It expires in 24 hours.`,
    html: `<p>Your Momentum verification code is:</p><p style="font-size: 24px; letter-spacing: 4px;"><strong>${code}</strong></p><p>It expires in 24 hours.</p>`,
  });
}
