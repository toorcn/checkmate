import { ensureRedis, redis } from "./redis";

export async function getJSON<T>(key: string): Promise<T | null> {
  await ensureRedis();
  const raw = await (redis as any).get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON<T>(key: string, value: T, ttlSeconds: number) {
  await ensureRedis();
  const payload = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await (redis as any).set(key, payload, "EX", ttlSeconds);
  } else {
    await (redis as any).set(key, payload);
  }
}
