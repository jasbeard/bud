ALTER TABLE "budget_cycle_dates" RENAME TO "budget_cycle_timeline";--> statement-breakpoint
ALTER TABLE "budget_cycle_timeline" DROP CONSTRAINT "budget_cycle_dates_budget_cycle_id_budget_cycles_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_cycle_timeline" DROP CONSTRAINT "budget_cycle_dates_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_cycle_timeline" ADD COLUMN "order" integer;--> statement-breakpoint
ALTER TABLE "budget_cycle_timeline" ADD CONSTRAINT "budget_cycle_timeline_budget_cycle_id_budget_cycles_id_fk" FOREIGN KEY ("budget_cycle_id") REFERENCES "public"."budget_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_cycle_timeline" ADD CONSTRAINT "budget_cycle_timeline_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;