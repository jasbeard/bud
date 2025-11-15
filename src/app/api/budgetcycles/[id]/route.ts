import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { budgetCycles, budgetCycleTimeline, budgetspaces } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

const updateBudgetCycleSchema = z.object({
  type: z.enum(["monthly", "custom"]).optional(),
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
  { params }: { params: { id: string } }
) {
  try {
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
        and(eq(budgetCycles.id, params.id), eq(budgetCycles.userId, userId))
      )
      .limit(1);

    if (budgetcycle.length === 0) {
      return NextResponse.json(
        { error: "Budgetcycle not found" },
        { status: 404 }
      );
    }

    // If it's a custom cycle, also fetch the dates
    if (budgetcycle[0].type === "custom") {
      const dates = await db
        .select()
        .from(budgetCycleTimeline)
        .where(eq(budgetCycleTimeline.budgetCycleId, params.id));

      return NextResponse.json({
        ...budgetcycle[0],
        dates,
      });
    }

    return NextResponse.json(budgetcycle[0]);
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
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateBudgetCycleSchema.parse(body);

    // Verify the budgetcycle belongs to the user
    const existingBudgetcycle = await db
      .select()
      .from(budgetCycles)
      .where(
        and(eq(budgetCycles.id, params.id), eq(budgetCycles.userId, userId))
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
      .where(eq(budgetCycles.id, params.id))
      .returning();

    // If dates are provided and it's a custom cycle, update the dates
    if (validatedData.dates && validatedData.type === "custom") {
      // Delete existing dates
      await db
        .delete(budgetCycleTimeline)
        .where(eq(budgetCycleTimeline.budgetCycleId, params.id));

      // Insert new dates
      const dateEntries = validatedData.dates.map((date) => ({
        budgetCycleId: params.id,
        userId,
        startDate: date.startDate,
        endDate: date.endDate,
      }));

      await db.insert(budgetCycleTimeline).values(dateEntries);
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
  { params }: { params: { id: string } }
) {
  try {
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
        and(eq(budgetCycles.id, params.id), eq(budgetCycles.userId, userId))
      )
      .limit(1);

    if (existingBudgetcycle.length === 0) {
      return NextResponse.json(
        { error: "Budgetcycle not found" },
        { status: 404 }
      );
    }

    // Delete the budgetcycle (cascade will handle related dates)
    await db.delete(budgetCycles).where(eq(budgetCycles.id, params.id));

    return NextResponse.json({ message: "Budgetcycle deleted successfully" });
  } catch (error) {
    console.error("Error deleting budgetcycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
