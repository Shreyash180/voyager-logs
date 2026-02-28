import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

