import { z } from 'zod'

const email = z.string().trim().min(1, 'أدخل البريد الإلكتروني').email('صيغة البريد غير صحيحة')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'أدخل كلمة المرور'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'أدخل اسمك (حرفان على الأقل)').max(60, 'الاسم طويل جداً'),
    email,
    password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'كلمتا المرور غير متطابقتين',
  })

export const resetSchema = z.object({ email })
