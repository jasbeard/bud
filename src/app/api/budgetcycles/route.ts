import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { budgetCycles, budgetCycleTimelines, budgetspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/db/auth";

const createBudgetCycleSchema = z.object({
  type: z.enum(["monthly", "bi-weekly", "semi-monthly", "weekly", "custom"]),
  budgetspaceId: z.uuid().optional(),
  dates: z
    .array(
      z.object({
        startDate: z.number().min(1).max(31),
        endDate: z.number().min(1).max(31),
      })
    )
    .optional(),
});

/* GET /api/budgetcycles - Get budgetcycles for authenticated user
  Returns all budgetcycles for the authenticated user
*/
export async function GET() {
  try {
    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all budgetcycles for the user with budgetspace information
    const userBudgetCycles = await db
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
      .where(eq(budgetCycles.userId, userId))
      .orderBy(budgetCycles.createdAt);

    return NextResponse.json(userBudgetCycles);
  } catch (error) {
    console.error("Error fetching budgetcycles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/budgetcycles - Create a new budgetcycle
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
    const validatedData = createBudgetCycleSchema.parse(body);

    let budgetspaceId = validatedData.budgetspaceId;

    // If no budgetspaceId provided, get the user's default budgetspace
    if (!budgetspaceId) {
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

      budgetspaceId = defaultBudgetspace[0].id;
    } else {
      // Validate that the provided budgetspace belongs to the user
      const budgetspace = await db
        .select()
        .from(budgetspaces)
        .where(
          and(
            eq(budgetspaces.id, budgetspaceId),
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
    }

    // Create the budgetcycle
    const newBudgetCycle = await db
      .insert(budgetCycles)
      .values({
        type: validatedData.type,
        userId,
        budgetspaceId,
      })
      .returning();

    // If dates are provided, create the timeline entries
    // All cycle types except pure monthly can have timeline entries
    if (validatedData.dates && validatedData.dates.length > 0) {
      const dateEntries = validatedData.dates.map((date, index) => ({
        budgetCycleId: newBudgetCycle[0].id,
        userId,
        startDate: date.startDate,
        endDate: date.endDate,
        order: index + 1,
      }));

      await db.insert(budgetCycleTimelines).values(dateEntries);
    }

    console.log("Created a new budgetcycle: ", body);
    return NextResponse.json(newBudgetCycle[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating budgetcycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
