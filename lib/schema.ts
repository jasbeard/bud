import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Budgetspaces table
export const budgetspaces = pgTable("budgetspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  budgetspaceId: uuid("budgetspace_id")
    .notNull()
    .references(() => budgetspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  budgetspaceId: uuid("budgetspace_id")
    .notNull()
    .references(() => budgetspaces.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  budgetspaceId: uuid("budgetspace_id")
    .notNull()
    .references(() => budgetspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  budgetspaces: many(budgetspaces),
}));

export const budgetspacesRelations = relations(
  budgetspaces,
  ({ one, many }) => ({
    user: one(users, {
      fields: [budgetspaces.userId],
      references: [users.id],
    }),
    categories: many(categories),
    transactions: many(transactions),
    budgets: many(budgets),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  budgetspace: one(budgetspaces, {
    fields: [categories.budgetspaceId],
    references: [budgetspaces.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  budgetspace: one(budgetspaces, {
    fields: [transactions.budgetspaceId],
    references: [budgetspaces.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
  budgetspace: one(budgetspaces, {
    fields: [budgets.budgetspaceId],
    references: [budgetspaces.id],
  }),
}));
