import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function sendVerificationEmail(email: string, code: string) {
  return transporter.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_USER },
    to: email,
    subject: "Confirm your Momentum account",
    text: `Your Momentum verification code is ${code}. It expires in 24 hours.`,
    html: `<p>Your Momentum verification code is:</p><p style="font-size: 24px; letter-spacing: 4px;"><strong>${code}</strong></p><p>It expires in 24 hours.</p>`,
  });
}

export function sendWorkspaceInvitationEmail(
  email: string,
  token: string,
  workspaceName: string,
  recipientExists: boolean,
) {
  const frontendOrigin = env.CORS_ORIGIN.split(",")[0]?.trim() ?? "";
  const url = new URL("/invitations/accept", frontendOrigin);
  url.hash = new URLSearchParams({ token, mode: recipientExists ? "accept" : "claim" }).toString();
  const action = recipientExists ? "Log in to accept the invitation" : "Create your password and join";

  return transporter.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_USER },
    to: email,
    subject: `You were invited to ${workspaceName}`,
    text: `You were invited to join ${workspaceName} in Momentum. ${action}: ${url.toString()} This invitation expires in 7 days.`,
    html: `<p>You were invited to join <strong>${escapeHtml(workspaceName)}</strong> in Momentum.</p><p><a href="${escapeHtml(url.toString())}">${action}</a></p><p>This invitation expires in 7 days.</p>`,
  });
}
