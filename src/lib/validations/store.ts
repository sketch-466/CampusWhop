import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "admin", "api", "dashboard", "login", "register", "logout",
  "onboarding", "profile", "orders", "marketplace", "housing",
  "jobs", "seller", "store", "stores", "new", "edit", "setup",
  "callback", "verify", "reset-password", "forgot-password",
  "auth", "webhooks", "paystack", "images", "assets", "static",
  "_next", "favicon", "robots", "sitemap",
]);

export const storeSchema = z.object({
  store_name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(60, "Store name must be under 60 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(40, "Slug must be under 40 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(
      (val) => !RESERVED_SLUGS.has(val),
      "This slug is reserved and cannot be used"
    ),
  tagline: z
    .string()
    .max(120, "Tagline must be under 120 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .or(z.literal("")),
  banner_url: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export type StoreInput = z.infer<typeof storeSchema>;

export const storeProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  price: z.number().positive("Price must be greater than 0"),
  product_type: z.enum(["physical", "digital", "service"]),
  images: z.array(z.string().url()).min(1, "At least one image is required").max(4, "Maximum 4 images"),
  stock_quantity: z
    .union([z.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (typeof v === "number" && !isNaN(v) ? v : null)),
  digital_file_url: z.string().url().optional().or(z.literal("")),
  delivery_timeframe: z
    .string()
    .max(60, "Delivery timeframe must be under 60 characters")
    .optional()
    .or(z.literal("")),
  requirements: z
    .string()
    .max(500, "Requirements must be under 500 characters")
    .optional()
    .or(z.literal("")),
});

export type StoreProductInput = z.infer<typeof storeProductSchema>;