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

// Only emit logs when running via CLI (helps avoid noisy logs in app runtime)
const resolvedDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DRIZZLE_DATABASE_URL ||
  process.env.PG_URL;

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
      "[drizzle.config] Ensure .env(.local) exists at project root and includes DATABASE_URL=…"
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
