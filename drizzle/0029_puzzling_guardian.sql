ALTER TABLE "budget_categories" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD COLUMN "updated_at" timestamp;