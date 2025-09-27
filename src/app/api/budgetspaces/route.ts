import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createBudgetspaceSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  userId: z.string().uuid(),
});

const updateBudgetspaceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
});

// GET /api/budgetspaces - Get all budgetspaces for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const userBudgetspaces = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, userId))
      .orderBy(budgetspaces.createdAt);

    return NextResponse.json(userBudgetspaces);
  } catch (error) {
    console.error("Error fetching budgetspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/budgetspaces - Create a new budgetspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createBudgetspaceSchema.parse(body);

    // Check if this is the first budgetspace for the user
    const existingBudgetspaces = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, validatedData.userId));

    const isDefault = existingBudgetspaces.length === 0;

    const newBudgetspace = await db
      .insert(budgetspaces)
      .values({
        ...validatedData,
        isDefault,
      })
      .returning();

    return NextResponse.json(newBudgetspace[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating budgetspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
