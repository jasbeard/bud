import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import {
  budgets,
  budgetspaces,
  budgetCategories,
  categories,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  totalAmount: z.number().min(0).optional(),
  budgetCategoryId: z.uuid().optional(),
  budgetspaceId: z.uuid().optional(),
  budgetCycleId: z.uuid().optional(),
});

/* POST /api/budgets - Create a new budget
  Request body:
    - name: string (budget name, required)
    - totalAmount: number (optional, defaults to 0)
    - budgetCategoryId: string (optional, but required for budget creation)
    - budgetspaceId: string (optional, defaults to user's default budgetspace)
    - budgetCycleId: string (optional)
  
  Returns:
    The created budget
  
  Requires authentication - only authenticated users can create budgets.
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
    const validatedData = createBudgetSchema.parse(body);

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
          {
            error:
              "No default budgetspace found. Please create a budgetspace first.",
          },
          { status: 404 }
        );
      }

      targetBudgetspaceId = defaultBudgetspace[0].id;
    }

    // Get or validate budgetCategoryId
    let targetBudgetCategoryId: string;

    if (validatedData.budgetCategoryId) {
      // Verify budgetCategoryId exists
      const budgetCategory = await db
        .select()
        .from(budgetCategories)
        .where(eq(budgetCategories.id, validatedData.budgetCategoryId))
        .limit(1);

      if (budgetCategory.length === 0) {
        return NextResponse.json(
          { error: "Budget category not found" },
          { status: 404 }
        );
      }

      targetBudgetCategoryId = validatedData.budgetCategoryId;
    } else {
      // Try to get the first budget category for the budgetspace
      const firstBudgetCategory = await db
        .select({ id: budgetCategories.id })
        .from(budgetCategories)
        .innerJoin(categories, eq(budgetCategories.categoryId, categories.id))
        .where(eq(categories.budgetspaceId, targetBudgetspaceId))
        .limit(1);

      if (firstBudgetCategory.length === 0) {
        return NextResponse.json(
          {
            error:
              "No budget categories found. Please create a budget category first.",
          },
          { status: 400 }
        );
      }

      targetBudgetCategoryId = firstBudgetCategory[0].id;
    }

    // Create the budget
    const newBudget = await db
      .insert(budgets)
      .values({
        name: validatedData.name,
        totalAmount: (validatedData.totalAmount ?? 0).toString(),
        budgetCategoryId: targetBudgetCategoryId,
        budgetspaceId: targetBudgetspaceId,
        budgetCycleId: validatedData.budgetCycleId ?? null,
      })
      .returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* GET /api/budgets - Get budgets for authenticated user
  Query params:
    - budgetspaceId: string (optional, defaults to user's default budgetspace)
  
  Returns:
    Array of budgets for the specified budgetspace
  
  Requires authentication - only authenticated users can view budgets.
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

    // Fetch budgets for the budgetspace
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.budgetspaceId, targetBudgetspaceId));

    return NextResponse.json(userBudgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
