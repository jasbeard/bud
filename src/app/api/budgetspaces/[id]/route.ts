import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateBudgetspaceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
});

// GET /api/budgetspaces/[id] - Get a specific budgetspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const budgetspace = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.id, params.id))
      .limit(1);

    if (budgetspace.length === 0) {
      return NextResponse.json(
        { error: "Budgetspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(budgetspace[0]);
  } catch (error) {
    console.error("Error fetching budgetspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/budgetspaces/[id] - Update a budgetspace
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateBudgetspaceSchema.parse(body);

    const updatedBudgetspace = await db
      .update(budgetspaces)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(budgetspaces.id, params.id))
      .returning();

    if (updatedBudgetspace.length === 0) {
      return NextResponse.json(
        { error: "Budgetspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBudgetspace[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating budgetspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgetspaces/[id] - Delete a budgetspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedBudgetspace = await db
      .delete(budgetspaces)
      .where(eq(budgetspaces.id, params.id))
      .returning();

    if (deletedBudgetspace.length === 0) {
      return NextResponse.json(
        { error: "Budgetspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Budgetspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting budgetspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
