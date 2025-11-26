import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { defaultCategories } from "../db/schema";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const defaultCategoryNames = [
  "Groceries",
  "Transportation",
  "Rent",
  "Personal Allowance",
  "Internet",
  "Investment",
  "Salary",
];

async function seedDefaultCategories() {
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
    // Get existing categories
    const existingCategories = await db.select().from(defaultCategories);
    const existingNames = new Set(
      existingCategories.map((cat) => cat.name.toLowerCase())
    );

    // Filter out categories that already exist
    const categoriesToInsert = defaultCategoryNames.filter(
      (name) => !existingNames.has(name.toLowerCase())
    );

    if (categoriesToInsert.length === 0) {
      console.log(
        `All default categories already exist (${existingCategories.length} found). Nothing to insert.`
      );
      return;
    }

    // Insert only new categories
    const categoryInserts = categoriesToInsert.map((name) => ({
      name,
    }));

    await db.insert(defaultCategories).values(categoryInserts);

    console.log(`✓ Inserted ${categoryInserts.length} new default categories:`);
    categoriesToInsert.forEach((name) => console.log(`  - ${name}`));

    if (existingCategories.length > 0) {
      console.log(
        `\nℹ Skipped ${existingCategories.length} existing categories`
      );
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding default categories:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed
seedDefaultCategories()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
