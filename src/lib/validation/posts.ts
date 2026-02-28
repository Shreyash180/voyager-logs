import { z } from "zod";

export const PostUpsertSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  videoUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  thumbnailUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
});

export const PostPatchSchema = PostUpsertSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "At least one field is required.",
);

