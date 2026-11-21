import { z } from 'zod'

// الرسائل مفاتيح ترجمة (auth:validation.*)، تُترجم عند العرض بـ t()
// فتتغير مع تبديل اللغة دون إعادة بناء المخطط
const email = z
  .string()
  .trim()
  .min(1, 'auth:validation.emailRequired')
  .email('auth:validation.emailInvalid')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'auth:validation.passwordRequired'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'auth:validation.nameMin').max(60, 'auth:validation.nameMax'),
    email,
    password: z.string().min(8, 'auth:validation.passwordMin'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'auth:validation.passwordMismatch',
  })

export const resetSchema = z.object({ email })
