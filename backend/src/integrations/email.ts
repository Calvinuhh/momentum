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
  inviterEmail: string,
  recipientExists: boolean,
) {
  const frontendOrigin = env.CORS_ORIGIN.split(",")[0]?.trim() ?? "";
  const url = new URL(recipientExists ? "/invitations/accept" : "/register", frontendOrigin);
  if (recipientExists) url.hash = new URLSearchParams({ token }).toString();
  const action = recipientExists ? "Review invitation" : "Create your Momentum account";
  const message = `${inviterEmail} invited you to join ${workspaceName}.`;
  const instructions = recipientExists
    ? ""
    : " Register with this email address, confirm your account, and then review the invitation from your notifications.";

  return transporter.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_USER },
    to: email,
    subject: `${inviterEmail} invited you to ${workspaceName}`,
    text: `${message} ${action}: ${url.toString()}.${instructions} This invitation expires in 7 days.`,
    html: `<p><strong>${escapeHtml(inviterEmail)}</strong> invited you to join <strong>${escapeHtml(workspaceName)}</strong>.</p><p><a href="${escapeHtml(url.toString())}">${action}</a></p>${recipientExists ? "" : "<p>Register with this email address, confirm your account, and then review the invitation from your notifications.</p>"}<p>This invitation expires in 7 days.</p>`,
  });
}
