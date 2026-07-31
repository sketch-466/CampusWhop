import { z } from "zod";

export const CREATOR_TYPES = [
  "tutor",
  "designer",
  "developer",
  "writer",
  "video_editor",
  "marketer",
  "photographer",
  "musician",
  "seller",
  "other",
] as const;

export type CreatorType = (typeof CREATOR_TYPES)[number];

export const CREATOR_TYPE_LABELS: Record<CreatorType, string> = {
  tutor: "Tutor",
  designer: "Designer",
  developer: "Developer",
  writer: "Writer",
  video_editor: "Video Editor",
  marketer: "Marketer",
  photographer: "Photographer",
  musician: "Musician",
  seller: "Seller",
  other: "Other",
};

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  phone_number: z.string().optional(),
  whatsapp_number: z.string().optional(),
  twitter_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  linkedin_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  tagline: z
    .string()
    .max(100, "Tagline must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  creator_type: z.enum(CREATOR_TYPES).optional().nullable(),
  skills: z
    .array(z.string().min(1).max(30))
    .max(10, "Maximum 10 skills")
    .optional(),
  portfolio_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;