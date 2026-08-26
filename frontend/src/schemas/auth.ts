import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Email must be valid'))

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Please enter a password.')
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be 128 characters or fewer.')
    .regex(/^[\x20-\x7E]*$/, 'Use standard keyboard characters only.')
    .regex(/[a-z]/, 'Add at least one lowercase letter (a-z).')
    .regex(/[A-Z]/, 'Add at least one uppercase letter (A-Z).')
    .regex(/[^A-Za-z0-9\s]/, 'Add at least one symbol, such as !, @, or #.'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Invalid credentials'),
})

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^[A-Za-z0-9]{6}$/, 'Enter the 6-character verification code.'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
