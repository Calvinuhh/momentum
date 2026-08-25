import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, { error: "Email is required" })
    .toLowerCase()
    .pipe(z.email({ error: "Email must be valid" })),
  password: z
    .string({ error: "Please enter a password." })
    .min(1, { error: "Please enter a password.", abort: true })
    .min(8, { error: "Password must be at least 8 characters." })
    .max(128, { error: "Password must be 128 characters or fewer." })
    .regex(/^[\x20-\x7E]*$/, {
      error: "Use standard keyboard characters only.",
    })
    .regex(/[a-z]/, {
      error: "Add at least one lowercase letter (a-z).",
    })
    .regex(/[A-Z]/, {
      error: "Add at least one uppercase letter (A-Z).",
    })
    .regex(/[^A-Za-z0-9\s]/, {
      error: "Add at least one symbol, such as !, @, or #.",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
