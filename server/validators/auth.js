const { z } = require('zod');

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(72)
      .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
        message: 'Password must be no more than 72 UTF-8 bytes.',
      }),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(1).max(72),
  })
  .strict();

module.exports = { loginSchema, registerSchema };
