import { ensureRedis, redis } from "./redis";

export async function incrementAndGetWindowCount(
  key: string,
  windowSeconds: number
): Promise<number> {
  await ensureRedis();
  const windowKey = `${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  const pipeline = (redis as any).pipeline?.() || (redis as any).multi?.();
  pipeline.incr(windowKey);
  pipeline.expire(windowKey, windowSeconds + 5);
  const results = await pipeline.exec();
  const incrResult = Array.isArray(results?.[0]) ? results[0][1] : results?.[0];
  return Number(incrResult);
}
