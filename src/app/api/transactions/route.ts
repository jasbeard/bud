import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import {
  transactions,
  budgetspaces,
  categories,
  budgetCategories,
  budgets,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const createTransactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  type: z.enum(["income", "expense"]),
  categoryId: z.uuid().optional(),
  budgetspaceId: z.uuid(),
  budgetId: z.uuid().optional(), // Budget ID for validation
  date: z.string(), // ISO date string
});

/* POST /api/transactions - Create a new transaction
  Request body:
    - amount: number (transaction amount, required, must be > 0)
    - description: string (optional, transaction notes/description)
    - type: "income" | "expense" (required)
    - categoryId: string (optional, UUID of the category)
    - budgetspaceId: string (required, UUID of the budgetspace)
    - budgetId: string (optional, UUID of the budget for validation)
    - date: string (required, ISO date string)
  
  Returns:
    The created transaction
  
  Requires authentication - only authenticated users can create transactions.
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
    const validatedData = createTransactionSchema.parse(body);

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

    // Validate ownership: budgetId must belong to the budgetspace (security check)
    if (validatedData.budgetId) {
      const budget = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.id, validatedData.budgetId),
            eq(budgets.budgetspaceId, validatedData.budgetspaceId)
          )
        )
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          {
            error: "Budget not found or does not belong to this budgetspace",
          },
          { status: 404 }
        );
      }
    }

    // Validate ownership: categoryId must belong to the budgetspace (security check)
    // Also verify category belongs to budget if both are provided
    if (validatedData.categoryId) {
      const category = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, validatedData.categoryId),
            eq(categories.budgetspaceId, validatedData.budgetspaceId)
          )
        )
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json(
          {
            error: "Category not found or does not belong to this budgetspace",
          },
          { status: 404 }
        );
      }

      // If budgetId is provided, verify the category belongs to that budget
      if (validatedData.budgetId) {
        const budgetCategory = await db
          .select()
          .from(budgetCategories)
          .where(
            and(
              eq(budgetCategories.categoryId, validatedData.categoryId),
              eq(budgetCategories.budgetId, validatedData.budgetId)
            )
          )
          .limit(1);

        if (budgetCategory.length === 0) {
          return NextResponse.json(
            {
              error: "Category does not belong to the specified budget",
            },
            { status: 400 }
          );
        }
      }
    }

    // Parse and validate the date (basic validation for better error messages)
    const transactionDate = new Date(validatedData.date);
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Create the transaction
    const newTransaction = await db
      .insert(transactions)
      .values({
        amount: validatedData.amount.toString(),
        description: validatedData.description || null,
        type: validatedData.type,
        categoryId: validatedData.categoryId || null,
        budgetId: validatedData.budgetId || null,
        budgetspaceId: validatedData.budgetspaceId,
        date: transactionDate,
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* GET /api/transactions - Get transactions for authenticated user
  Query params:
    - budgetspaceId: string (optional, defaults to user's default budgetspace)
    - categoryId: string (optional, filter by category)
    - type: "income" | "expense" (optional, filter by type)
  
  Returns:
    Array of transactions for the specified budgetspace
  
  Requires authentication - only authenticated users can view transactions.
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
    const categoryIdParam = searchParams.get("categoryId");
    const typeParam = searchParams.get("type") as "income" | "expense" | null;

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

    // Build query conditions
    const conditions = [eq(transactions.budgetspaceId, targetBudgetspaceId)];

    if (categoryIdParam) {
      conditions.push(eq(transactions.categoryId, categoryIdParam));
    }

    if (typeParam && (typeParam === "income" || typeParam === "expense")) {
      conditions.push(eq(transactions.type, typeParam));
    }

    // Fetch transactions
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.date);

    return NextResponse.json(userTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
