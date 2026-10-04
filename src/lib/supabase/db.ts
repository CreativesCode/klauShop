import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env.mjs";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  console.log("🔴 no database URL");
}

// One pool per process: dev HMR re-evaluates this module and used to open a new pool each
// time (EMAXCONN on the Supabase pooler). Serverless instances need very few connections.
const globalForDb = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pg ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pg = client;

const db = drizzle(client, { schema });

export default db;
