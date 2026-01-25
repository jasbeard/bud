import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Configure connection pool to prevent connection exhaustion and crashes
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Disable prefetch as it is not supported for "Transaction" pool mode
  max: 10, // Maximum number of connections in the pool (adjust based on your needs)
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes to prevent stale connections
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: "bud-app", // Help identify connections in PostgreSQL logs
  },
});

export const db = drizzle(client, { schema });
