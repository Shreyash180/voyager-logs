import { z } from "zod";

const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 1))
    .refine((n) => Number.isFinite(n) && n >= 1, "Invalid page"),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 10))
    .refine((n) => Number.isFinite(n) && n >= 1 && n <= 50, "Invalid limit"),
});

export function parsePagination(searchParams: URLSearchParams) {
  const parsed = PaginationQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  const skip = (parsed.page - 1) * parsed.limit;
  const take = parsed.limit;

  return { page: parsed.page, limit: parsed.limit, skip, take };
}

