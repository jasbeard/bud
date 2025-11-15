import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { budgetspaces, budgetCycles, budgetCycleTimeline } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

const onboardingSchema = z.object({
  budgetspace: z.object({
    name: z.string().min(1).max(50),
    description: z.string().optional(),
  }),
  cycles: z.object({
    type: z.enum(["monthly", "custom"]),
    dates: z
      .array(
        z.object({
          startDate: z.number().min(1).max(31),
          endDate: z.number().min(1).max(31),
        })
      )
      .optional(),
  }),
});

// POST /api/onboarding - Complete onboarding process
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
    const validatedData = onboardingSchema.parse(body);

    // Check if user already has a budgetspace
    const existingBudgetspaces = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, userId));

    const isDefault = existingBudgetspaces.length === 0;

    // Create budgetspace if it doesn't exist
    let budgetspaceId: string;
    if (isDefault) {
      const newBudgetspace = await db
        .insert(budgetspaces)
        .values({
          ...validatedData.budgetspace,
          userId,
          isDefault: true,
        })
        .returning();

      budgetspaceId = newBudgetspace[0].id;
    } else {
      // Use existing default budgetspace
      budgetspaceId =
        existingBudgetspaces.find((bs) => bs.isDefault)?.id ||
        existingBudgetspaces[0].id;
    }

    // Check if user already has budget cycles
    const existingCycles = await db
      .select()
      .from(budgetCycles)
      .where(eq(budgetCycles.userId, userId));

    // Create budget cycle if none exist
    let budgetCycleId: string | undefined;
    if (existingCycles.length === 0) {
      const newBudgetCycle = await db
        .insert(budgetCycles)
        .values({
          type: validatedData.cycles.type,
          userId,
          budgetspaceId,
        })
        .returning();

      budgetCycleId = newBudgetCycle[0].id;

      // If it's a custom cycle with dates, create the date entries
      if (
        validatedData.cycles.type === "custom" &&
        validatedData.cycles.dates
      ) {
        const dateEntries = validatedData.cycles.dates.map((date) => ({
          budgetCycleId: budgetCycleId!,
          userId,
          startDate: date.startDate,
          endDate: date.endDate,
        }));

        await db.insert(budgetCycleTimeline).values(dateEntries);
      }
    }

    console.log("Onboarding completed successfully for user:", userId);

    return NextResponse.json(
      {
        success: true,
        budgetspaceId,
        budgetCycleId,
        message: "Onboarding completed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
