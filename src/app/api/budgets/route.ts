import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import {
  budgets,
  budgetspaces,
  budgetCategories,
  categories,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
    - budgetCategoryId: string (optional, can be null)
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

    // Validate budgetCategoryId if provided
    let targetBudgetCategoryId: string | null = null;

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
    }

    // Create the budget
    const newBudget = await db
      .insert(budgets)
      .values({
        name: validatedData.name,
        totalAmount: (validatedData.totalAmount ?? 0).toString(),
        budgetCategoryId: targetBudgetCategoryId ?? null,
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

    // Fetch budget categories for each budget
    const budgetIds = userBudgets.map((budget) => budget.id);

    type BudgetCategoryWithDetails = {
      id: string;
      categoryId: string;
      budgetId: string;
      name: string;
      allocationAmount: string;
      allocationType: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      category: {
        id: string;
        name: string;
        color: string | null;
        icon: string | null;
        budgetspaceId: string;
      };
    };

    const budgetCategoriesMap = new Map<string, BudgetCategoryWithDetails[]>();

    if (budgetIds.length > 0) {
      const allBudgetCategories = await db
        .select({
          id: budgetCategories.id,
          categoryId: budgetCategories.categoryId,
          budgetId: budgetCategories.budgetId,
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
        .where(inArray(budgetCategories.budgetId, budgetIds));

      // Group categories by budgetId
      for (const bc of allBudgetCategories) {
        if (!budgetCategoriesMap.has(bc.budgetId)) {
          budgetCategoriesMap.set(bc.budgetId, []);
        }
        budgetCategoriesMap.get(bc.budgetId)!.push(bc);
      }
    }

    // Attach budget categories to each budget
    const budgetsWithCategories = userBudgets.map((budget) => ({
      ...budget,
      budgetCategories: budgetCategoriesMap.get(budget.id) || [],
    }));

    return NextResponse.json(budgetsWithCategories);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
