import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { defaultCategories } from "@/lib/schema";
import { auth } from "@/lib/auth";

/* GET /api/default-categories - Get all default categories
  Returns all default categories from the database.
  Requires authentication - only authenticated users can access default categories.
*/
export async function GET() {
  try {
    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await db
      .select({
        id: defaultCategories.id,
        name: defaultCategories.name,
        color: defaultCategories.color,
        icon: defaultCategories.icon,
      })
      .from(defaultCategories)
      .orderBy(defaultCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching default categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
