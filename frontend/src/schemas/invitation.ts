import { z } from 'zod'
import { passwordSchema } from './auth'

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email must be 254 characters or fewer')
    .pipe(z.email('Email must be valid')),
  role: z.enum(['ADMIN', 'MEMBER']),
})

export const claimInvitationSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Invitation link is invalid'),
  password: passwordSchema,
})
