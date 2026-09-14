import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseEnv } from "@/lib/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;
let database: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (!database) {
    client = postgres(getDatabaseEnv().DATABASE_URL, { prepare: false, max: 5 });
    database = drizzle(client, { schema });
  }
  return database;
}

export async function closeDb() {
  await client?.end();
  client = undefined;
  database = undefined;
}
