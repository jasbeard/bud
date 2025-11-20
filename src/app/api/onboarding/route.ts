import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  budgetspaces,
  budgetCycles,
  budgetCycleTimeline,
  categories,
  users,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Cycle preset names that the frontend can send
const CYCLE_PRESET_NAMES = [
  "Monthly",
  "Bi-weekly",
  "Semi-monthly",
  "Weekly",
  "Custom",
] as const;

const onboardingSchema = z.object({
  budgetspace: z.object({
    name: z.string().min(1).max(50),
    description: z.string().optional(),
  }),
  cycles: z.object({
    type: z.enum(CYCLE_PRESET_NAMES),
    timeline: z
      .array(
        z.object({
          order: z.number().optional(),
          startDate: z.number().min(1).max(31),
          endDate: z.number().min(1).max(31),
        })
      )
      .nullable()
      .optional(),
    dates: z
      .array(
        z.object({
          startDate: z.number().min(1).max(31),
          endDate: z.number().min(1).max(31),
        })
      )
      .optional(),
  }),
  categories: z.array(z.string().min(1)).nullable().optional(),
});

// GET /api/onboarding - Check if user is already onboarded
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

    // Check if user has onboardedAt timestamp set
    const user = await db
      .select({ onboardedAt: users.onboardedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOnboarded = !!user[0].onboardedAt;

    return NextResponse.json({
      isOnboarded,
      onboardedAt: user[0].onboardedAt,
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Map frontend preset names to database enum values
    const cycleTypeMap: Record<
      (typeof CYCLE_PRESET_NAMES)[number],
      "monthly" | "bi-weekly" | "semi-monthly" | "weekly" | "custom"
    > = {
      Monthly: "monthly",
      "Bi-weekly": "bi-weekly",
      "Semi-monthly": "semi-monthly",
      Weekly: "weekly",
      Custom: "custom",
    };

    const cycleType = cycleTypeMap[validatedData.cycles.type];

    // Get dates from either timeline or dates property
    const timelineDates = validatedData.cycles.timeline || [];
    const datesArray = validatedData.cycles.dates || [];
    const cycleDates = timelineDates.length > 0 ? timelineDates : datesArray;

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
          type: cycleType,
          userId,
          budgetspaceId,
        })
        .returning();

      budgetCycleId = newBudgetCycle[0].id;

      // If there are cycle dates, create the timeline entries
      // For monthly cycles, we still create timeline entries if dates are provided
      if (cycleDates.length > 0) {
        const dateEntries = cycleDates.map((date, index) => {
          // Handle both timeline (with order) and dates (without order) formats
          const timelineDate = date as {
            startDate: number;
            endDate: number;
            order?: number;
          };
          return {
            budgetCycleId: budgetCycleId!,
            userId,
            startDate: timelineDate.startDate,
            endDate: timelineDate.endDate,
            order: timelineDate.order ?? index + 1,
          };
        });

        await db.insert(budgetCycleTimeline).values(dateEntries);
      }
    }

    // Create categories if provided
    if (validatedData.categories && validatedData.categories.length > 0) {
      const categoryEntries = validatedData.categories.map((categoryName) => ({
        name: categoryName,
        budgetspaceId,
      }));

      await db.insert(categories).values(categoryEntries);
    }

    // Update onboardedAt timestamp if not already set
    // (For existing users who completed onboarding before this field existed,
    // use the backfill script: yarn db:backfill:onboarded-at)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0 && !existingUser[0].onboardedAt) {
      await db
        .update(users)
        .set({ onboardedAt: new Date() })
        .where(eq(users.id, userId));
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
