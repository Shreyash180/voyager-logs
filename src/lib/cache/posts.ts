import { invalidateCacheByPrefix } from "./store";

export const POST_LIST_CACHE_PREFIX = "post-list:";
export const POST_DETAIL_CACHE_PREFIX = "post-detail:";

export function postListCacheKey(params: {
  page: number;
  limit: number;
  q?: string;
  tag?: string;
  scope?: "public" | "admin";
}) {
  const q = params.q ?? "";
  const tag = params.tag ?? "";
  const scope = params.scope ?? "public";
  return `${POST_LIST_CACHE_PREFIX}scope=${scope}&p=${params.page}&l=${params.limit}&q=${q}&tag=${tag}`;
}

export function postDetailCacheKey(slug: string) {
  return `${POST_DETAIL_CACHE_PREFIX}${slug}`;
}

export function invalidatePostListCache() {
  invalidateCacheByPrefix(POST_LIST_CACHE_PREFIX);
}

export function invalidatePostDetailCache(slug: string) {
  invalidateCacheByPrefix(postDetailCacheKey(slug));
}
