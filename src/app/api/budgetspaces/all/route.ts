import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { budgetspaces, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

/* GET /api/budgetspaces/all - Get all budgetspaces for authenticated user with user plan
  Returns all budgetspaces for the authenticated user along with the user's plan.
  Budgetspaces are ordered by isDefault (desc) and createdAt (desc).
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

    // Fetch user to get plan
    const user = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPlan = user[0]?.plan || "Basic";

    // Fetch all budgetspaces for the user
    // Order by isDefault (desc so true comes first), then by createdAt (desc so newest first)
    const spaces = await db
      .select({
        id: budgetspaces.id,
        name: budgetspaces.name,
        description: budgetspaces.description,
        userId: budgetspaces.userId,
        isDefault: budgetspaces.isDefault,
        createdAt: budgetspaces.createdAt,
        updatedAt: budgetspaces.updatedAt,
      })
      .from(budgetspaces)
      .where(eq(budgetspaces.userId, userId))
      .orderBy(desc(budgetspaces.isDefault), desc(budgetspaces.createdAt));

    return NextResponse.json({
      spaces,
      plan: userPlan,
    });
  } catch (error) {
    console.error("Error fetching budgetspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
