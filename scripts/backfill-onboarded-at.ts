import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, budgetspaces, budgetCycles } from "../lib/schema";
import { eq, isNull } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function backfillOnboardedAt() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please create a .env.local file with DATABASE_URL."
    );
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  try {
    // Find all users without onboardedAt
    const usersWithoutOnboardedAt = await db
      .select()
      .from(users)
      .where(isNull(users.onboardedAt));

    if (usersWithoutOnboardedAt.length === 0) {
      console.log(
        "✓ All users already have onboardedAt set. Nothing to backfill."
      );
      return;
    }

    console.log(
      `Found ${usersWithoutOnboardedAt.length} user(s) without onboardedAt\n`
    );

    let backfilledCount = 0;

    for (const user of usersWithoutOnboardedAt) {
      // Check if user has required onboarding data
      const userBudgetspaces = await db
        .select()
        .from(budgetspaces)
        .where(eq(budgetspaces.userId, user.id));

      const userCycles = await db
        .select()
        .from(budgetCycles)
        .where(eq(budgetCycles.userId, user.id));

      if (userBudgetspaces.length > 0 && userCycles.length > 0) {
        await db
          .update(users)
          .set({ onboardedAt: new Date() })
          .where(eq(users.id, user.id));

        backfilledCount++;
        console.log(
          `✓ Backfilled onboardedAt for user: ${user.email || user.id}`
        );
      } else {
        console.log(
          `⊘ Skipped user: ${
            user.email || user.id
          } (missing required data - budgetspace: ${
            userBudgetspaces.length > 0
          }, cycles: ${userCycles.length > 0})`
        );
      }
    }

    console.log(`\n✓ Backfill completed! Updated ${backfilledCount} user(s).`);
  } catch (error) {
    console.error("Error backfilling onboardedAt:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the backfill
backfillOnboardedAt()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
