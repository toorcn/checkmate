import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRDSCredentials } from "@/lib/secrets";

/**
 * Build database connection string from Secrets Manager credentials + env config
 * In production: fetches username/password from AWS Secrets Manager
 * In local dev: uses DATABASE_URL or DB_* environment variables
 */
async function buildDatabaseUrl(): Promise<string> {
  // If DATABASE_URL is set, use it directly (local dev convenience)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Fetch credentials from Secrets Manager (or env fallback)
  const { username, password } = await getRDSCredentials();

  // Get connection details from environment
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const dbname = process.env.DB_NAME || "checkmate";

  // Construct connection string
  const encodedPassword = encodeURIComponent(password);
  return `postgres://${username}:${encodedPassword}@${host}:${port}/${dbname}?sslmode=require`;
}

/**
 * Initialize database connection
 * Note: This is async initialization. The client is created on first import.
 */
let clientInstance: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

async function initializeDatabase() {
  if (clientInstance) {
    return { client: clientInstance, db: dbInstance! };
  }

  const connectionString = await buildDatabaseUrl();

  clientInstance = postgres(connectionString, {
    max: 1,
    ssl: "require",
  });

  dbInstance = drizzle(clientInstance);

  // Debug log (mask sensitive info)
  try {
    console.log(
      "[db] Initialized postgres client (masked url prefix)=",
      (() => {
        try {
          const [base] = connectionString.split("?");
          // Mask credentials
          const masked = base.replace(/\/\/([^@]*)@/, "//****@");
          return masked.length > 60 ? masked.slice(0, 60) + "…" : masked;
        } catch {
          return "<redacted>";
        }
      })()
    );
  } catch {}

  return { client: clientInstance, db: dbInstance };
}

// Initialize immediately (async, but starts right away)
const dbPromise = initializeDatabase();

// Pre-warm the database connection on module load
// This ensures the first API request doesn't timeout
dbPromise.then(() => {
  console.log('[db] Database pre-warmed and ready');
}).catch((error) => {
  console.error('[db] Failed to pre-warm database:', error);
});

// Export client and db - these will be ready after initialization
export const client = new Proxy({} as postgres.Sql, {
  get(_target, prop) {
    if (!clientInstance) {
      throw new Error(
        "Database client not yet initialized. Ensure you await database initialization or use getDb()."
      );
    }
    return (clientInstance as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      throw new Error(
        "Database instance not yet initialized. Ensure you await database initialization or use getDb()."
      );
    }
    return (dbInstance as any)[prop];
  },
});

/**
 * Get database instance (async safe)
 * Use this in API routes and server-side code where you can await
 */
export async function getDb() {
  const { db } = await dbPromise;
  return db;
}

/**
 * Get postgres client instance (async safe)
 * Use this when you need direct postgres client access
 */
export async function getClient() {
  const { client } = await dbPromise;
  return client;
}
