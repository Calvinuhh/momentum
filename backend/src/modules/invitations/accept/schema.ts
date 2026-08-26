import { z } from "zod";
import { invitationTokenSchema } from "../../../utils/invitation-tokens.js";

export const acceptInvitationSchema = z.object({ token: invitationTokenSchema });

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
