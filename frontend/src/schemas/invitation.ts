import { z } from 'zod'

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email must be 254 characters or fewer')
    .pipe(z.email('Email must be valid')),
  role: z.enum(['ADMIN', 'MEMBER']),
})
