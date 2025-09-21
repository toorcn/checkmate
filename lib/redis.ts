import Redis, { Cluster } from "ioredis";

const mode = process.env.REDIS_MODE || "single"; // "single" | "cluster"
// If REDIS_TLS is explicitly set, honor it. Otherwise infer from URL scheme (rediss://).
const inferredTls = (process.env.REDIS_URL || "").startsWith("rediss://");
const useTLS = process.env.REDIS_TLS
  ? String(process.env.REDIS_TLS) === "true"
  : inferredTls;
const keyPrefix = process.env.REDIS_KEY_PREFIX || "";

function createSingle() {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, {
      tls: useTLS ? {} : undefined,
      keyPrefix,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
    });
  }
  return new Redis({
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: useTLS ? {} : undefined,
    keyPrefix,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
  });
}

function createCluster() {
  // Cluster discovery works with host/port. If only URL provided, parse it.
  const url = process.env.REDIS_URL;
  let host = process.env.REDIS_HOST;
  let port = process.env.REDIS_PORT
    ? Number(process.env.REDIS_PORT)
    : undefined;
  if (!host && url) {
    try {
      const u = new URL(url);
      host = u.hostname;
      port = Number(u.port || 6379);
    } catch {}
  }
  const resolvedHost = host!;
  const resolvedPort = port ?? 6379;
  return new Cluster([{ host: resolvedHost, port: resolvedPort }], {
    redisOptions: {
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: useTLS ? {} : undefined,
      keyPrefix,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
    },
    scaleReads: "all",
    slotsRefreshTimeout: 2000,
  });
}

export const redis = mode === "cluster" ? createCluster() : createSingle();

export async function ensureRedis() {
  if (redis.status === "ready") return;
  if (redis.status === "connecting") return;
  await redis.connect?.();
}
