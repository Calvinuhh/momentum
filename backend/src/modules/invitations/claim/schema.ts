import { z } from "zod";
import { passwordSchema } from "../../auth/register/schema.js";
import { invitationTokenSchema } from "../../../utils/invitation-tokens.js";

export const claimInvitationSchema = z.object({
  token: invitationTokenSchema,
  password: passwordSchema,
});

export type ClaimInvitationInput = z.infer<typeof claimInvitationSchema>;
