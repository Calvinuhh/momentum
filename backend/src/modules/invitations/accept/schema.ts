import { previewInvitationSchema } from "../preview/schema.js";
import type { InvitationReference } from "../preview/schema.js";

export const acceptInvitationSchema = previewInvitationSchema;

export type AcceptInvitationInput = InvitationReference;
