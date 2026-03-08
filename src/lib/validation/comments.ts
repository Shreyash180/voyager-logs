import { z } from "zod";

export const CommentCreateSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  parentId: z.string().uuid().optional().nullable(),
  website: z.string().max(0).optional(),
}).strict();

