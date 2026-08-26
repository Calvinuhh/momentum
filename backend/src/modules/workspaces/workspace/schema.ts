import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(1000, "Description must be at most 1000 characters")
    .nullish()
    .transform((v) => v || null),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
