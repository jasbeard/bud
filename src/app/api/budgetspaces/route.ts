import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { budgetspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createBudgetspaceSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

/* GET /api/budgetspaces - Get first budgetspace for authenticated user
  NOTE: this get budgetspace is created with onboarding in mind (strongly), with suceeding interation 
  this implementation might not make sense.
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

    // Get the first budgetspace for the user
    const defaultBudgetspace = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, userId))
      .orderBy(budgetspaces.createdAt)
      .limit(1);

    if (defaultBudgetspace.length === 0) {
      return NextResponse.json(
        { error: "No budgetspace found" },
        { status: 404 }
      );
    }

    return NextResponse.json(defaultBudgetspace[0]);
  } catch (error) {
    console.error("Error fetching budgetspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/budgetspaces - Create a new budgetspace
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
    const validatedData = createBudgetspaceSchema.parse(body);

    // Check if this is the first budgetspace for the user
    const existingBudgetspaces = await db
      .select()
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, userId));

    const isDefault = existingBudgetspaces.length === 0;

    const newBudgetspace = await db
      .insert(budgetspaces)
      .values({
        ...validatedData,
        userId, // Use session userId instead of client-provided one
        isDefault,
      })
      .returning();

    // If this is the user's first budgetspace, mark onboarding as done
    // if (isDefault) {
    //   await db
    //     .update(users)
    //     .set({ onboarded: true })
    //     .where(eq(users.id, userId));
    // }
    console.log("Create a new budgetspace: ", body);
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
