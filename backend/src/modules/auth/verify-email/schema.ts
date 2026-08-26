import { z } from "zod";

export const verifyEmailSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, { error: "Email is required" })
    .toLowerCase()
    .pipe(z.email({ error: "Email must be valid" })),
  code: z
    .string({ error: "Verification code is required" })
    .regex(/^[A-Za-z0-9]{6}$/, { error: "Verification code must be 6 characters" }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
