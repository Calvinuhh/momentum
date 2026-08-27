import { z } from "zod";

export const listNotificationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().min(1).max(64).optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
