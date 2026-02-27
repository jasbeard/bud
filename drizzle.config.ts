import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Only manage tables in public schema; ignore system/extension schemas
  schemaFilter: ["public"],
  // Exclude pg_stat_statements views (Xata/Postgres monitoring extension)
  // Without this, db:push tries to drop them and fails
  tablesFilter: ["!pg_stat_statements*"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
