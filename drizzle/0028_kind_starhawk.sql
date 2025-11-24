ALTER TABLE "budgets" RENAME COLUMN "category_id" TO "budget_category_id";--> statement-breakpoint
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_budget_category_id_budget_categories_id_fk" FOREIGN KEY ("budget_category_id") REFERENCES "public"."budget_categories"("id") ON DELETE cascade ON UPDATE no action;