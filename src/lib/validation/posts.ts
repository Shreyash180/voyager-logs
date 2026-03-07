import { z } from "zod";

export const PostUpsertSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z
    .string()
    .max(320)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  content: z.string().min(1),
  videoUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  thumbnailUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  published: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
}).strict();

export const PostPatchSchema = PostUpsertSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "At least one field is required.",
);

