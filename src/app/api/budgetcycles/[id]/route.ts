import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { budgetCycles, budgetCycleTimelines, budgetspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const updateBudgetCycleSchema = z.object({
  type: z
    .enum(["monthly", "bi-weekly", "semi-monthly", "weekly", "custom"])
    .optional(),
  dates: z
    .array(
      z.object({
        startDate: z.number().min(1).max(31),
        endDate: z.number().min(1).max(31),
      })
    )
    .optional(),
});

// GET /api/budgetcycles/[id] - Get a specific budgetcycle
export async function GET(
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

    const budgetcycle = await db
      .select({
        id: budgetCycles.id,
        type: budgetCycles.type,
        userId: budgetCycles.userId,
        budgetspaceId: budgetCycles.budgetspaceId,
        createdAt: budgetCycles.createdAt,
        updatedAt: budgetCycles.updatedAt,
        budgetspace: {
          id: budgetspaces.id,
          name: budgetspaces.name,
          description: budgetspaces.description,
        },
      })
      .from(budgetCycles)
      .leftJoin(budgetspaces, eq(budgetCycles.budgetspaceId, budgetspaces.id))
      .where(
        and(eq(budgetCycles.id, id), eq(budgetCycles.userId, userId))
      )
      .limit(1);

    if (budgetcycle.length === 0) {
      return NextResponse.json(
        { error: "Budgetcycle not found" },
        { status: 404 }
      );
    }

    // Fetch timeline dates for cycles that have them (all except pure monthly)
    // Even monthly cycles might have timeline entries if dates were provided
    const dates = await db
      .select()
      .from(budgetCycleTimelines)
      .where(eq(budgetCycleTimelines.budgetCycleId, id));

    return NextResponse.json({
      ...budgetcycle[0],
      dates: dates.length > 0 ? dates : undefined,
    });
  } catch (error) {
    console.error("Error fetching budgetcycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/budgetcycles/[id] - Update a budgetcycle
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
    const validatedData = updateBudgetCycleSchema.parse(body);

    // Verify the budgetcycle belongs to the user
    const existingBudgetcycle = await db
      .select()
      .from(budgetCycles)
      .where(
        and(eq(budgetCycles.id, id), eq(budgetCycles.userId, userId))
      )
      .limit(1);

    if (existingBudgetcycle.length === 0) {
      return NextResponse.json(
        { error: "Budgetcycle not found" },
        { status: 404 }
      );
    }

    // Update the budgetcycle
    const updatedBudgetcycle = await db
      .update(budgetCycles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(budgetCycles.id, id))
      .returning();

    // If dates are provided, update the timeline entries
    // All cycle types can have timeline entries
    if (validatedData.dates) {
      // Delete existing dates
      await db
        .delete(budgetCycleTimelines)
        .where(eq(budgetCycleTimelines.budgetCycleId, id));

      // Insert new dates if provided
      if (validatedData.dates.length > 0) {
        const dateEntries = validatedData.dates.map((date, index) => ({
          budgetCycleId: id,
          userId,
          startDate: date.startDate,
          endDate: date.endDate,
          order: index + 1,
        }));

        await db.insert(budgetCycleTimelines).values(dateEntries);
      }
    }

    return NextResponse.json(updatedBudgetcycle[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating budgetcycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgetcycles/[id] - Delete a budgetcycle
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

    // Verify the budgetcycle belongs to the user
    const existingBudgetcycle = await db
      .select()
      .from(budgetCycles)
      .where(
        and(eq(budgetCycles.id, id), eq(budgetCycles.userId, userId))
      )
      .limit(1);

    if (existingBudgetcycle.length === 0) {
      return NextResponse.json(
        { error: "Budgetcycle not found" },
        { status: 404 }
      );
    }

    // Delete the budgetcycle (cascade will handle related dates)
    await db.delete(budgetCycles).where(eq(budgetCycles.id, id));

    return NextResponse.json({ message: "Budgetcycle deleted successfully" });
  } catch (error) {
    console.error("Error deleting budgetcycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
