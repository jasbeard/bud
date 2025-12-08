import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { budgets, budgetspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100),
});

/* PUT /api/budgets/[id] - Update a budget
  Request body:
    - name: string (budget name, required)
  
  Returns:
    The updated budget
  
  Requires authentication - only authenticated users can update budgets.
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
    const validatedData = updateBudgetSchema.parse(body);

    // Verify the budget exists and belongs to the user
    const existingBudget = await db
      .select({
        id: budgets.id,
        budgetspaceId: budgets.budgetspaceId,
        budgetspace: {
          userId: budgetspaces.userId,
        },
      })
      .from(budgets)
      .leftJoin(budgetspaces, eq(budgets.budgetspaceId, budgetspaces.id))
      .where(eq(budgets.id, id))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Verify the user owns the budgetspace
    if (existingBudget[0].budgetspace?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the budget
    const updatedBudget = await db
      .update(budgets)
      .set({
        name: validatedData.name,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id))
      .returning();

    return NextResponse.json(updatedBudget[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
