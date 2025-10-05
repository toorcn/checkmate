import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load envs from .env.local first (Next.js convention), then .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Debug logs to help diagnose missing DATABASE_URL during drizzle-kit runs
// Mask sensitive parts before printing
const maskUrl = (value?: string) => {
  if (!value) return "<undefined>";
  try {
    // Hide credentials if present and truncate query/paths
    let masked = value.replace(/\/\/([^@]*)@/, "//****@");
    const [base, query] = masked.split("?");
    masked = base.length > 60 ? base.slice(0, 60) + "…" : base;
    return query ? masked + "?…" : masked;
  } catch {
    return "<redacted>";
  }
};

/**
 * Resolve database URL from environment
 * Supports both:
 * 1. Full DATABASE_URL (legacy, for local dev convenience)
 * 2. Component-based (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
 */
function resolveDatabaseUrl(): string {
  // Try full DATABASE_URL first (most common for local dev)
  let url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DRIZZLE_DATABASE_URL ||
    process.env.PG_URL;

  if (url) {
    return url;
  }

  // Construct from components (for Secrets Manager approach)
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "5432";
  const dbname = process.env.DB_NAME || "checkmate";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "";

  if (host && user && password) {
    const encodedPassword = encodeURIComponent(password);
    return `postgres://${user}:${encodedPassword}@${host}:${port}/${dbname}?sslmode=require`;
  }

  // No valid configuration found
  return "";
}

const resolvedDatabaseUrl = resolveDatabaseUrl();

// Only emit logs when running via CLI (helps avoid noisy logs in app runtime)
if (process.argv.some((a) => a.includes("drizzle"))) {
  console.log("[drizzle.config] cwd=", process.cwd());
  console.log("[drizzle.config] using DB url=", maskUrl(resolvedDatabaseUrl));
  
  if (!resolvedDatabaseUrl) {
    // Helpful hints when var is missing
    const maybeKeys = Object.keys(process.env).filter((k) =>
      /DB|PG|POSTGRES|DATABASE/i.test(k)
    );
    console.warn(
      "[drizzle.config] DATABASE_URL is undefined. Other DB-like envs found:",
      maybeKeys
    );
    console.warn(
      "[drizzle.config] Options:"
    );
    console.warn(
      "  1. Set DATABASE_URL=postgres://user:pass@host:5432/dbname in .env.local"
    );
    console.warn(
      "  2. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env.local"
    );
  }
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolvedDatabaseUrl!,
  },
} satisfies Config;
