import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, { error: "Email is required" })
    .max(254, { error: "Email must be 254 characters or fewer" })
    .toLowerCase()
    .pipe(z.email({ error: "Email must be valid" })),
  role: z.enum(["ADMIN", "MEMBER"], { error: "Role must be ADMIN or MEMBER" }),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
