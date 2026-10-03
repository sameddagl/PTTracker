ALTER TABLE "account_members" DROP CONSTRAINT "account_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "account_members" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;