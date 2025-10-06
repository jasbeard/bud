ALTER TABLE "users" RENAME COLUMN "onboarded" TO "onboarded_at";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified_at" timestamp;