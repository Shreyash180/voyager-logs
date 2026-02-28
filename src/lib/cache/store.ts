type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const globalCache = globalThis as unknown as {
  voyagerMemoryCache?: Map<string, CacheEntry<unknown>>;
};

const store = globalCache.voyagerMemoryCache ?? new Map<string, CacheEntry<unknown>>();
if (!globalCache.voyagerMemoryCache) {
  globalCache.voyagerMemoryCache = store;
}

export async function getOrSetCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now < hit.expiresAt) {
    return hit.value as T;
  }

  const next = await loader();
  store.set(key, {
    value: next,
    expiresAt: now + ttlMs,
  });
  return next;
}

export function invalidateCacheByPrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
