import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  onboardedAt: timestamp("onboarded_at"),
  plan: text("plan"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("emailVerified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Better-auth required tables
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Budget cycles table
export const budgetCycles = pgTable("budget_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", {
    enum: ["monthly", "bi-weekly", "semi-monthly", "weekly", "custom"],
  }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  budgetspaceId: uuid("budgetspace_id")
    .notNull()
    .references(() => budgetspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Budget cycle timeline table (for custom cycles with multiple date ranges)
export const budgetCycleTimeline = pgTable("budget_cycle_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetCycleId: uuid("budget_cycle_id")
    .notNull()
    .references(() => budgetCycles.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: integer("start_date").notNull(), // Calendar date as integer (e.g., 1-31)
  endDate: integer("end_date").notNull(), // Calendar date as integer (e.g., 1-31)
  order: integer("order"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
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
  budgetCycleId: uuid("budget_cycle_id").references(() => budgetCycles.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  budgetspaces: many(budgetspaces),
  sessions: many(sessions),
  accounts: many(accounts),
  budgetCycles: many(budgetCycles),
  budgetCycleTimeline: many(budgetCycleTimeline),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
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
    budgetCycles: many(budgetCycles),
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

export const budgetCyclesRelations = relations(
  budgetCycles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [budgetCycles.userId],
      references: [users.id],
    }),
    budgetspace: one(budgetspaces, {
      fields: [budgetCycles.budgetspaceId],
      references: [budgetspaces.id],
    }),
    budgets: many(budgets),
    timeline: many(budgetCycleTimeline),
  })
);

export const budgetCycleTimelineRelations = relations(
  budgetCycleTimeline,
  ({ one }) => ({
    user: one(users, {
      fields: [budgetCycleTimeline.userId],
      references: [users.id],
    }),
    budgetCycle: one(budgetCycles, {
      fields: [budgetCycleTimeline.budgetCycleId],
      references: [budgetCycles.id],
    }),
  })
);

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
  budgetspace: one(budgetspaces, {
    fields: [budgets.budgetspaceId],
    references: [budgetspaces.id],
  }),
  budgetCycle: one(budgetCycles, {
    fields: [budgets.budgetCycleId],
    references: [budgetCycles.id],
  }),
}));
