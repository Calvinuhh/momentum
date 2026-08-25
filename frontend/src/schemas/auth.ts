import { z } from 'zod'

const emailSchema = z.string().trim().min(1, 'Email is required').pipe(z.email('Email must be valid'))

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9\s])[\x20-\x7E]{8,128}$/, {
      message: 'Password must contain lower, upper and special character (printable ASCII only)',
    }),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Invalid credentials'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
