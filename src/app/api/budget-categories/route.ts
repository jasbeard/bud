import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import {
  budgetCategories,
  categories,
  budgetspaces,
  budgets,
  transactions,
} from "@/db/schema";
import { eq, and, sql, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const createBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  allocationAmount: z.number().min(0),
  allocationType: z.enum(["expense", "income"]),
  budgetId: z.uuid(),
  budgetspaceId: z.uuid().nullish(),
});

/* POST /api/budget-categories - Create a new budget category
  Request body:
    - name: string (category name)
    - allocationAmount: number (allocation amount)
    - allocationType: "expense" | "income"
    - budgetId: string (required, the budget this category belongs to)
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

    // Verify the user owns the specified budget
    const budget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, validatedData.budgetId))
      .limit(1);

    if (budget.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Verify the user owns the budgetspace that owns this budget
    const budgetspace = await db
      .select()
      .from(budgetspaces)
      .where(
        and(
          eq(budgetspaces.id, budget[0].budgetspaceId),
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

    const targetBudgetspaceId = budget[0].budgetspaceId;

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
        budgetId: validatedData.budgetId,
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

/* GET /api/budget-categories - Get budget categories
  Query parameters:
    - budgetId (optional): If provided, returns budget categories for that budget.
    - budgetspaceId (optional): If provided, returns budget categories for that budgetspace.
                                If not provided, returns budget categories for the user's default budgetspace.
                                Note: budgetId takes precedence over budgetspaceId if both are provided.
  
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
    const budgetIdParam = searchParams.get("budgetId");
    const budgetspaceIdParam = searchParams.get("budgetspaceId");

    // Build query conditions
    let whereCondition;

    if (budgetIdParam) {
      // Verify the user owns the specified budget
      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, budgetIdParam))
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          { error: "Budget not found" },
          { status: 404 }
        );
      }

      // Verify the user owns the budgetspace that owns this budget
      const budgetspace = await db
        .select()
        .from(budgetspaces)
        .where(
          and(
            eq(budgetspaces.id, budget[0].budgetspaceId),
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

      // Filter by budgetId
      whereCondition = eq(budgetCategories.budgetId, budgetIdParam);
    } else if (budgetspaceIdParam) {
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

      // Filter by budgetspaceId (via categories join)
      whereCondition = eq(categories.budgetspaceId, budgetspaceIdParam);
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

      // Filter by default budgetspaceId (via categories join)
      whereCondition = eq(categories.budgetspaceId, defaultBudgetspace[0].id);
    }

    // Fetch budget categories
    const budgetCategoriesList = await db
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
      .where(whereCondition)
      .orderBy(categories.name);

    // Calculate spent amounts from transactions for each category
    const categoryIds = budgetCategoriesList.map((bc) => bc.categoryId);
    const spentAmountsMap = new Map<string, string>();

    if (categoryIds.length > 0) {
      // Build base conditions for transaction query
      const transactionConditions = [
        isNotNull(transactions.categoryId),
        inArray(transactions.categoryId, categoryIds),
      ];

      // If we're filtering by a specific budget, also filter transactions by budgetId
      if (budgetIdParam) {
        transactionConditions.push(
          isNotNull(transactions.budgetId),
          eq(transactions.budgetId, budgetIdParam)
        );
      } else if (budgetspaceIdParam) {
        // If filtering by budgetspace, ensure transactions belong to that budgetspace
        transactionConditions.push(
          eq(transactions.budgetspaceId, budgetspaceIdParam)
        );
      }

      // Get spent amounts per category, grouped by categoryId and type
      const spentAmounts = await db
        .select({
          categoryId: transactions.categoryId,
          type: transactions.type,
          totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(and(...transactionConditions))
        .groupBy(transactions.categoryId, transactions.type);

      // Create a map: categoryId -> spent amount (only for matching types)
      for (const spent of spentAmounts) {
        if (spent.categoryId) {
          // Find the budget category to match the type
          const budgetCat = budgetCategoriesList.find(
            (bc) => bc.categoryId === spent.categoryId
          );
          // Only count if transaction type matches category allocation type
          if (budgetCat && budgetCat.allocationType === spent.type) {
            spentAmountsMap.set(spent.categoryId, spent.totalSpent);
          }
        }
      }
    }

    // Add spent amounts to each budget category
    const budgetCategoriesWithSpent = budgetCategoriesList.map((bc) => {
      const spentAmount = spentAmountsMap.get(bc.categoryId) || "0";
      return {
        ...bc,
        spentAmount,
      };
    });

    return NextResponse.json(budgetCategoriesWithSpent);
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
