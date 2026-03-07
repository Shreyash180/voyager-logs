import { z } from "zod";

export const AdminUsersQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "BANNED"]).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export const AdminUserPatchSchema = z
  .object({
    role: z.enum(["ADMIN", "USER"]).optional(),
    status: z.enum(["ACTIVE", "BANNED"]).optional(),
    reason: z.string().trim().max(300).optional(),
    confirmEmail: z.string().email().optional(),
  })
  .strict()
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: "At least one field must be provided for update.",
    path: ["role"],
  });

export const AdminUserDeleteSchema = z
  .object({
    confirmEmail: z.string().email(),
    reason: z.string().trim().max(300).optional(),
  })
  .strict();
