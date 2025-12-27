import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import {
  budgetCategories,
  categories,
  budgetspaces,
  budgets,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const updateBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  allocationAmount: z.number().min(0).optional(),
  allocationType: z.enum(["expense", "income"]).optional(),
  categoryId: z.uuid().optional(),
});

/* PUT /api/budget-categories/[id] - Update a budget category
  Request body:
    - name: string (optional, category name)
    - allocationAmount: number (optional, allocation amount)
    - allocationType: "expense" | "income" (optional)
    - categoryId: string (optional, UUID of the category to link to)
  
  Returns:
    The updated budget category with category details
  
  Requires authentication - only authenticated users can update budget categories.
*/
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const validatedData = updateBudgetCategorySchema.parse(body);

    // Verify the budget category exists and belongs to the user
    const existingBudgetCategory = await db
      .select({
        id: budgetCategories.id,
        categoryId: budgetCategories.categoryId,
        budgetId: budgetCategories.budgetId,
        name: budgetCategories.name,
        allocationAmount: budgetCategories.allocationAmount,
        allocationType: budgetCategories.allocationType,
        budget: {
          budgetspaceId: budgets.budgetspaceId,
        },
        budgetspace: {
          userId: budgetspaces.userId,
        },
      })
      .from(budgetCategories)
      .innerJoin(budgets, eq(budgetCategories.budgetId, budgets.id))
      .innerJoin(budgetspaces, eq(budgets.budgetspaceId, budgetspaces.id))
      .where(eq(budgetCategories.id, id))
      .limit(1);

    if (existingBudgetCategory.length === 0) {
      return NextResponse.json(
        { error: "Budget category not found" },
        { status: 404 }
      );
    }

    // Verify the user owns the budgetspace
    if (existingBudgetCategory[0].budgetspace?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get budgetspaceId from the budget to ensure validation is at the budget level
    const budgetspaceId = existingBudgetCategory[0].budget.budgetspaceId;

    // If categoryId is being updated, verify it exists and belongs to this budget
    // (by checking it belongs to the same budgetspace as the budget)
    let targetCategoryId = existingBudgetCategory[0].categoryId;
    let targetCategoryName = existingBudgetCategory[0].name;

    if (validatedData.categoryId) {
      // Verify the category belongs to this budget
      // Categories are linked to budgets through their shared budgetspace
      const targetCategory = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, validatedData.categoryId),
            eq(categories.budgetspaceId, budgetspaceId)
          )
        )
        .limit(1);

      if (targetCategory.length === 0) {
        return NextResponse.json(
          { error: "Category not found or does not belong to this budget" },
          { status: 404 }
        );
      }

      targetCategoryId = targetCategory[0].id;
      targetCategoryName = targetCategory[0].name;
    } else if (validatedData.name) {
      // If name is being updated but categoryId is not, find or create the category
      // Categories are scoped to the budgetspace that this budget belongs to

      // Check if category already exists for this budgetspace (case-insensitive)
      const existingCategory = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.budgetspaceId, budgetspaceId),
            sql`LOWER(${categories.name}) = LOWER(${validatedData.name})`
          )
        )
        .limit(1);

      if (existingCategory.length > 0) {
        targetCategoryId = existingCategory[0].id;
        targetCategoryName = existingCategory[0].name;
      } else {
        // Create new category
        const newCategory = await db
          .insert(categories)
          .values({
            name: validatedData.name,
            budgetspaceId: budgetspaceId,
          })
          .returning();

        targetCategoryId = newCategory[0].id;
        targetCategoryName = newCategory[0].name;
      }
    }

    // Build update object
    const updateData: {
      categoryId?: string;
      name?: string;
      allocationAmount?: string;
      allocationType?: "expense" | "income";
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (validatedData.categoryId || validatedData.name) {
      updateData.categoryId = targetCategoryId;
      updateData.name = targetCategoryName;
    }

    if (validatedData.allocationAmount !== undefined) {
      updateData.allocationAmount = validatedData.allocationAmount.toString();
    }

    if (validatedData.allocationType) {
      updateData.allocationType = validatedData.allocationType;
    }

    // Update the budget category
    await db
      .update(budgetCategories)
      .set(updateData)
      .where(eq(budgetCategories.id, id));

    // Fetch the updated budget category with category details
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
      .where(eq(budgetCategories.id, id))
      .limit(1);

    return NextResponse.json(budgetCategoryWithDetails[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating budget category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* DELETE /api/budget-categories/[id] - Delete a budget category
  
  Returns:
    Success message
  
  Requires authentication - only authenticated users can delete budget categories.
*/
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify the budget category exists and belongs to the user
    const existingBudgetCategory = await db
      .select({
        id: budgetCategories.id,
        budgetspace: {
          userId: budgetspaces.userId,
        },
      })
      .from(budgetCategories)
      .innerJoin(budgets, eq(budgetCategories.budgetId, budgets.id))
      .innerJoin(budgetspaces, eq(budgets.budgetspaceId, budgetspaces.id))
      .where(eq(budgetCategories.id, id))
      .limit(1);

    if (existingBudgetCategory.length === 0) {
      return NextResponse.json(
        { error: "Budget category not found" },
        { status: 404 }
      );
    }

    // Verify the user owns the budgetspace
    if (existingBudgetCategory[0].budgetspace?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the budget category
    await db.delete(budgetCategories).where(eq(budgetCategories.id, id));

    return NextResponse.json({
      message: "Budget category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
