import { z } from "zod";

export const pushInstallationSchema = z
  .object({
    endpoint: z
      .string()
      .max(2048)
      .refine((v) => {
        try {
          return new URL(v).protocol === "https:";
        } catch {
          return false;
        }
      }, "endpoint must be https"),
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{86,88}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22,24}$/),
    userId: z.string().regex(/^[a-z0-9]{24}$/),
  })
  .strict();

export const deletePushInstallationSchema = z
  .object({
    endpoint: z
      .string()
      .max(2048)
      .refine((v) => {
        try {
          return new URL(v).protocol === "https:";
        } catch {
          return false;
        }
      }, "endpoint must be https"),
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{86,88}$/).optional(),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22,24}$/).optional(),
    userId: z.string().regex(/^[a-z0-9]{24}$/),
  })
  .strict();

export type PushInstallationInput = z.infer<typeof pushInstallationSchema>;
export type DeletePushInstallationInput = z.infer<typeof deletePushInstallationSchema>;
