import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(1, "Full name is required").max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Matric format: YYYY/XX/NNNNN (e.g. 2023/EN/32845)
// Flexible enough for multi-university expansion
const MATRIC_REGEX = /^\d{4}\/[A-Z]{2,4}\/\d{4,6}$/;

// Nigerian phone: 11 digits starting with 0, or +234 format
const PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name too long")
    .trim(),
  university: z.string().min(1, "University is required"),
  matricNumber: z
    .string()
    .min(1, "Matric number is required")
    .max(50, "Matric number too long")
    .transform((val) => val.toUpperCase().trim())
    .refine(
      (val) => MATRIC_REGEX.test(val),
      "Invalid matric number format. Use YYYY/XX/NNNNN (e.g. 2023/EN/32845)"
    ),
  phoneNumber: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => val === "" || PHONE_REGEX.test(val),
      "Invalid Nigerian phone number. Use format 08012345678 or +2348012345678"
    )
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;