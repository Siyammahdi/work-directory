import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;

/** Server-only Postgres client (Neon). */
export function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string.",
      );
    }
    sql = neon(url);
  }
  return sql;
}
