import { z } from "zod";
import { optionalWilayaIdSchema, localeSchema } from "./common";

const passwordSchema = z
  .string()
  .min(8, { message: "validation.passwordWeak" })
  .max(200, { message: "validation.max" })
  .refine((v) => /[A-Za-z؀-ۿ]/.test(v) && /[0-9]/.test(v), {
    message: "validation.passwordWeak",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, { message: "validation.email" })
  .max(254, { message: "validation.email" })
  .email({ message: "validation.email" });

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, { message: "validation.min" }).max(80, { message: "validation.max" }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    wilayaId: optionalWilayaIdSchema,
    locale: localeSchema.catch("ar"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "validation.required" }).max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "validation.required" }).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, { message: "validation.min" }).max(80, { message: "validation.max" }),
  wilayaId: optionalWilayaIdSchema,
  locale: localeSchema,
  publicProfile: z.coerce.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
