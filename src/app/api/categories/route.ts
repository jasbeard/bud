import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { categories, budgetspaces, defaultCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/db/auth";

/* GET /api/categories - Get both default categories and user categories for a budgetspace
  Query parameters:
    - budgetspaceId (optional): If provided, returns categories for that budgetspace.
                                If not provided, returns categories for the user's default budgetspace.
  
  Returns:
    {
      defaultCategories: [...],  // All default categories (static data)
      categories: [...]          // User-specific categories for the budgetspace
    }
  
  Requires authentication - only authenticated users can access their own categories.
*/
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const budgetspaceIdParam = searchParams.get("budgetspaceId");

    let targetBudgetspaceId: string;

    if (budgetspaceIdParam) {
      // Verify the user owns the specified budgetspace
      const budgetspace = await db
        .select()
        .from(budgetspaces)
        .where(
          and(
            eq(budgetspaces.id, budgetspaceIdParam),
            eq(budgetspaces.userId, userId)
          )
        )
        .limit(1);

      if (budgetspace.length === 0) {
        return NextResponse.json(
          { error: "Budgetspace not found or access denied" },
          { status: 404 }
        );
      }

      targetBudgetspaceId = budgetspaceIdParam;
    } else {
      // Get the user's default budgetspace
      const defaultBudgetspace = await db
        .select()
        .from(budgetspaces)
        .where(
          and(eq(budgetspaces.userId, userId), eq(budgetspaces.isDefault, true))
        )
        .limit(1);

      if (defaultBudgetspace.length === 0) {
        return NextResponse.json(
          { error: "No default budgetspace found" },
          { status: 404 }
        );
      }

      targetBudgetspaceId = defaultBudgetspace[0].id;
    }

    // Fetch both default categories and user categories in parallel
    const [defaultCategoriesList, userCategoriesList] = await Promise.all([
      // Get all default categories
      db
        .select({
          id: defaultCategories.id,
          name: defaultCategories.name,
          color: defaultCategories.color,
          icon: defaultCategories.icon,
        })
        .from(defaultCategories)
        .orderBy(defaultCategories.name),
      // Get categories for the budgetspace
      db
        .select({
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
          budgetspaceId: categories.budgetspaceId,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.budgetspaceId, targetBudgetspaceId))
        .orderBy(categories.name),
    ]);

    return NextResponse.json({
      defaultCategories: defaultCategoriesList,
      categories: userCategoriesList,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
