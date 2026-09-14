import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDb, getDb } from "./index";

async function main() {
  await migrate(getDb(), { migrationsFolder: "drizzle" });
  await closeDb();
  console.log("Migraciones aplicadas.");
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "No fue posible aplicar las migraciones.");
  await closeDb();
  process.exit(1);
});
