import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "Password must be at most 200 characters."),
}).strict();

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
}).strict();

