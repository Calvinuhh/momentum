import { z } from "zod";
import { invitationTokenSchema } from "../../../utils/invitation-tokens.js";

export const previewInvitationSchema = z.union([
  z.object({ token: invitationTokenSchema }).strict(),
  z.object({ invitationId: z.string().regex(/^[a-z0-9]{24}$/) }).strict(),
]);

export type InvitationReference = z.infer<typeof previewInvitationSchema>;
