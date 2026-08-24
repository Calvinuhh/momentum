import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, { error: "Email is required" })
    .toLowerCase()
    .pipe(z.email({ error: "Email must be valid" })),
  password: z
    .string({ error: "Password is required" })
    .min(1, { error: "Password is required", abort: true })
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(128, { error: "Password must be at most 128 characters long" })
    .regex(/^[\x20-\x7E]*$/, {
      error: "Password must contain only printable ASCII characters",
    })
    .regex(/[a-z]/, {
      error: "Password must contain at least one lowercase letter",
    })
    .regex(/[A-Z]/, {
      error: "Password must contain at least one uppercase letter",
    })
    .regex(/[^A-Za-z0-9\s]/, {
      error: "Password must contain at least one special character",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
