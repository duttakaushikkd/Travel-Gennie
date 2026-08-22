import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

const limiters = new Map<string, Ratelimit>();

export async function enforceRateLimit(key: string, prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  let limiter = limiters.get(prefix);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      prefix,
    });
    limiters.set(prefix, limiter);
  }

  const result = await limiter.limit(key);
  if (!result.success) {
    throw new Error("Too many searches just now. Wait a minute and try again.");
  }
}
