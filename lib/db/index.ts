import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, {
  max: 1,
  ssl: "require",
});

export const db = drizzle(client);

// Temporary debug to validate DB connectivity at runtime
try {
   
  console.log(
    "[db] Initialized postgres client (masked url prefix)=",
    (() => {
      try {
        const [base] = connectionString.split("?");
        return base.length > 60 ? base.slice(0, 60) + "…" : base;
      } catch {
        return "<redacted>";
      }
    })()
  );
} catch {}
