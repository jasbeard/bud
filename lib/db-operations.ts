import { db } from "./db";
import {
  budgetspaces,
  users,
  categories,
  transactions,
  budgets,
} from "./schema";
import { eq, and, desc } from "drizzle-orm";

// User operations
export async function createUser(userData: {
  email: string;
  name?: string;
  image?: string;
}) {
  return await db.insert(users).values(userData).returning();
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
}

// Budgetspace operations
export async function createBudgetspace(budgetspaceData: {
  name: string;
  description?: string;
  userId: string;
  isDefault?: boolean;
}) {
  return await db.insert(budgetspaces).values(budgetspaceData).returning();
}

export async function getBudgetspacesByUserId(userId: string) {
  return await db
    .select()
    .from(budgetspaces)
    .where(eq(budgetspaces.userId, userId))
    .orderBy(desc(budgetspaces.createdAt));
}

export async function getBudgetspaceById(id: string) {
  const result = await db
    .select()
    .from(budgetspaces)
    .where(eq(budgetspaces.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateBudgetspace(
  id: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  return await db
    .update(budgetspaces)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(budgetspaces.id, id))
    .returning();
}

export async function deleteBudgetspace(id: string) {
  return await db
    .delete(budgetspaces)
    .where(eq(budgetspaces.id, id))
    .returning();
}

// Category operations
export async function createCategory(categoryData: {
  name: string;
  color?: string;
  icon?: string;
  budgetspaceId: string;
}) {
  return await db.insert(categories).values(categoryData).returning();
}

export async function getCategoriesByBudgetspaceId(budgetspaceId: string) {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.budgetspaceId, budgetspaceId))
    .orderBy(categories.name);
}

// Transaction operations
export async function createTransaction(transactionData: {
  amount: string;
  description?: string;
  type: "income" | "expense";
  categoryId?: string;
  budgetspaceId: string;
  date: Date;
}) {
  return await db.insert(transactions).values(transactionData).returning();
}

export async function getTransactionsByBudgetspaceId(budgetspaceId: string) {
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.budgetspaceId, budgetspaceId))
    .orderBy(desc(transactions.date));
}

// Budget operations
export async function createBudget(budgetData: {
  amount: string;
  period: "monthly" | "weekly" | "yearly";
  categoryId: string;
  budgetspaceId: string;
}) {
  return await db.insert(budgets).values(budgetData).returning();
}

export async function getBudgetsByBudgetspaceId(budgetspaceId: string) {
  return await db
    .select()
    .from(budgets)
    .where(eq(budgets.budgetspaceId, budgetspaceId))
    .orderBy(budgets.createdAt);
}
