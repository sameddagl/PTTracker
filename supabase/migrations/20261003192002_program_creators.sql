ALTER TABLE "exercises" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_fk" FOREIGN KEY ("created_by","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_created_by_fk" FOREIGN KEY ("created_by","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- "editPrograms" splits into creating one's own templates and changing everyone's.
UPDATE public.account_members
SET permissions = (permissions - 'editPrograms') || jsonb_build_object('createPrograms', permissions -> 'editPrograms')
WHERE permissions ? 'editPrograms';
