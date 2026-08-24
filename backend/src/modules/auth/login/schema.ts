import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, { error: "Email is required" })
    .toLowerCase()
    .pipe(z.email({ error: "Email must be valid" })),
  password: z
    .string({ error: "Invalid credentials" })
    .min(1, { error: "Invalid credentials" })
    .max(128, { error: "Invalid credentials" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
