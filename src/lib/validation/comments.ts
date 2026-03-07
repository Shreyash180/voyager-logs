import { z } from "zod";

export const CommentCreateSchema = z.object({
  content: z.string().min(1).max(4000),
  parentId: z.string().uuid().optional().nullable(),
}).strict();

