import { z } from "zod";
import { createOpaqueToken, hashOpaqueToken } from "./opaque-tokens.js";

export const invitationTokenSchema = z
  .string({ error: "Invitation token is required" })
  .regex(/^[A-Za-z0-9_-]{43}$/, { error: "Invitation token is invalid" });

export const createInvitationToken = createOpaqueToken;
export const hashInvitationToken = hashOpaqueToken;
