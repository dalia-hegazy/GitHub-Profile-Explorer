import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient(): ReturnType<typeof postgres> {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Configure it to enable notes and chat-history persistence.",
    );
  }
  if (!client) {
    client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  }
  return client;
}

/** Returns the drizzle database instance, or null when no DATABASE_URL is configured. */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> | null {
  if (!env.DATABASE_URL) {
    return null;
  }
  if (!db) {
    db = drizzle(getClient(), { schema });
  }
  return db;
}

/** True when a DATABASE_URL is configured and persistence is available. */
export function isDbConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}

export type Database = ReturnType<typeof drizzle<typeof schema>>;
