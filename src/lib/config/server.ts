import { z } from "zod";

const OptionalEnvString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().min(1).optional(),
);

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  INTERNAL_API_KEY: OptionalEnvString.refine(
    (v) => v === undefined || v.length >= 16,
    "INTERNAL_API_KEY must be at least 16 characters when set.",
  ),
  VIEW_HASH_SALT: OptionalEnvString.refine(
    (v) => v === undefined || v.length >= 8,
    "VIEW_HASH_SALT must be at least 8 characters when set.",
  ),
  CLOUDINARY_CLOUD_NAME: OptionalEnvString,
  CLOUDINARY_API_KEY: OptionalEnvString,
  CLOUDINARY_API_SECRET: OptionalEnvString,
  CLOUDINARY_FOLDER: OptionalEnvString,
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  cached = ServerEnvSchema.parse(process.env);
  return cached;
}

