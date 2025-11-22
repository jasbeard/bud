ALTER TABLE "budget_cycle_timeline" RENAME TO "budget_cycle_timelines";--> statement-breakpoint
ALTER TABLE "budgets" RENAME COLUMN "amount" TO "total_amount";--> statement-breakpoint
ALTER TABLE "budget_cycle_timelines" DROP CONSTRAINT "budget_cycle_timeline_budget_cycle_id_budget_cycles_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_cycle_timelines" DROP CONSTRAINT "budget_cycle_timeline_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_cycle_timelines" ADD CONSTRAINT "budget_cycle_timelines_budget_cycle_id_budget_cycles_id_fk" FOREIGN KEY ("budget_cycle_id") REFERENCES "public"."budget_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_cycle_timelines" ADD CONSTRAINT "budget_cycle_timelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;