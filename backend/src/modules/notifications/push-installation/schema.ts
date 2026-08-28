import { z } from "zod";

export const pushInstallationSchema = z
  .object({
    fid: z.string().regex(/^[cdef][A-Za-z0-9_-]{21}$/),
    userId: z.string().regex(/^[a-z0-9]{24}$/),
  })
  .strict();

export type PushInstallationInput = z.infer<typeof pushInstallationSchema>;
