import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/http/errors";
import { getActorKey } from "@/lib/request";

type Bucket = {
  count: number;
  resetAt: number;
};

type Options = {
  name: string;
  max: number;
  windowMs: number;
  key?: string;
};

const globalStore = globalThis as unknown as {
  voyagerRateLimitStore?: Map<string, Bucket>;
};

const store = globalStore.voyagerRateLimitStore ?? new Map<string, Bucket>();
if (!globalStore.voyagerRateLimitStore) {
  globalStore.voyagerRateLimitStore = store;
}

export function enforceRateLimit(req: NextRequest, options: Options) {
  const now = Date.now();
  const subject = options.key ?? getActorKey(req);
  const bucketKey = `${options.name}:${subject}`;
  const existing = store.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    store.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > options.max) {
    throw new ApiError({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
      details: { resetAt: existing.resetAt },
    });
  }

  store.set(bucketKey, existing);
}
