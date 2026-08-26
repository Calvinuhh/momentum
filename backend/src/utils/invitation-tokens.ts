import { z } from "zod";

const TOKEN_BYTES = 32;

export const invitationTokenSchema = z
  .string({ error: "Invitation token is required" })
  .regex(/^[A-Za-z0-9_-]{43}$/, { error: "Invitation token is invalid" });

export function createInvitationToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))).toString("base64url");
}

export async function hashInvitationToken(token: string): Promise<string> {
  return Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
  ).toString("hex");
}
