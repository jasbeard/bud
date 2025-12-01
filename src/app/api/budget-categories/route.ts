import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { budgetCategories, categories, budgetspaces } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const createBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  allocationAmount: z.number().min(0),
  allocationType: z.enum(["expense", "income"]),
  budgetspaceId: z.uuid().nullish(),
});

/* POST /api/budget-categories - Create a new budget category
  Request body:
    - name: string (category name)
    - allocationAmount: number (allocation amount)
    - allocationType: "expense" | "income"
    - budgetspaceId: string (optional, defaults to user's default budgetspace)
  
  Returns:
    The created budget category with category details
  
  Requires authentication - only authenticated users can create budget categories.
*/
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const validatedData = createBudgetCategorySchema.parse(body);

    let targetBudgetspaceId: string;

    if (validatedData.budgetspaceId) {
      // Verify the user owns the specified budgetspace
      const budgetspace = await db
        .select()
        .from(budgetspaces)
        .where(
          and(
            eq(budgetspaces.id, validatedData.budgetspaceId),
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

      targetBudgetspaceId = validatedData.budgetspaceId;
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

    // Find or create the category
    // Check if category already exists for this budgetspace (case-insensitive)
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.budgetspaceId, targetBudgetspaceId),
          sql`LOWER(${categories.name}) = LOWER(${validatedData.name})`
        )
      )
      .limit(1);

    let categoryId: string;
    let categoryName: string;

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
      categoryName = existingCategory[0].name;
    } else {
      // Create new category
      const newCategory = await db
        .insert(categories)
        .values({
          name: validatedData.name,
          budgetspaceId: targetBudgetspaceId,
        })
        .returning();

      categoryId = newCategory[0].id;
      categoryName = newCategory[0].name;
    }

    // Create budget category entry
    const newBudgetCategory = await db
      .insert(budgetCategories)
      .values({
        categoryId,
        name: categoryName,
        allocationAmount: validatedData.allocationAmount.toString(),
        allocationType: validatedData.allocationType,
      })
      .returning();

    // Fetch the created budget category with category details
    const budgetCategoryWithDetails = await db
      .select({
        id: budgetCategories.id,
        categoryId: budgetCategories.categoryId,
        name: budgetCategories.name,
        allocationAmount: budgetCategories.allocationAmount,
        allocationType: budgetCategories.allocationType,
        createdAt: budgetCategories.createdAt,
        updatedAt: budgetCategories.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
          budgetspaceId: categories.budgetspaceId,
        },
      })
      .from(budgetCategories)
      .innerJoin(categories, eq(budgetCategories.categoryId, categories.id))
      .where(eq(budgetCategories.id, newBudgetCategory[0].id))
      .limit(1);

    return NextResponse.json(budgetCategoryWithDetails[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating budget category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* GET /api/budget-categories - Get budget categories for a budgetspace
  Query parameters:
    - budgetspaceId (optional): If provided, returns budget categories for that budgetspace.
                                If not provided, returns budget categories for the user's default budgetspace.
  
  Returns:
    Array of budget categories with category details
  
  Requires authentication - only authenticated users can access their own budget categories.
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

    // Fetch budget categories for the budgetspace
    const budgetCategoriesList = await db
      .select({
        id: budgetCategories.id,
        categoryId: budgetCategories.categoryId,
        name: budgetCategories.name,
        allocationAmount: budgetCategories.allocationAmount,
        allocationType: budgetCategories.allocationType,
        createdAt: budgetCategories.createdAt,
        updatedAt: budgetCategories.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
          budgetspaceId: categories.budgetspaceId,
        },
      })
      .from(budgetCategories)
      .innerJoin(categories, eq(budgetCategories.categoryId, categories.id))
      .where(eq(categories.budgetspaceId, targetBudgetspaceId))
      .orderBy(categories.name);

    return NextResponse.json(budgetCategoriesList);
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
