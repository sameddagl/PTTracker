ALTER TABLE "client_packages" DROP CONSTRAINT "client_packages_client_id_trainer_id_clients_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "client_packages" DROP CONSTRAINT "client_packages_template_id_trainer_id_package_templates_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "consents" DROP CONSTRAINT "consents_client_id_trainer_id_clients_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_attendees" DROP CONSTRAINT "lesson_attendees_lesson_id_trainer_id_lessons_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_attendees" DROP CONSTRAINT "lesson_attendees_client_id_trainer_id_clients_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_attendees" DROP CONSTRAINT "lesson_attendees_client_package_id_client_id_client_packages_id_client_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_series_id_trainer_id_lesson_series_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "package_freezes" DROP CONSTRAINT "package_freezes_client_package_id_trainer_id_client_packages_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_client_id_trainer_id_clients_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_client_package_id_client_id_client_packages_id_client_id_fk";
--> statement-breakpoint
ALTER TABLE "portal_tokens" DROP CONSTRAINT "portal_tokens_client_id_trainer_id_clients_id_trainer_id_fk";
--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_template_fk" FOREIGN KEY ("template_id","trainer_id") REFERENCES "public"."package_templates"("id","trainer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_lesson_fk" FOREIGN KEY ("lesson_id","trainer_id") REFERENCES "public"."lessons"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_package_fk" FOREIGN KEY ("client_package_id","client_id") REFERENCES "public"."client_packages"("id","client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_series_fk" FOREIGN KEY ("series_id","trainer_id") REFERENCES "public"."lesson_series"("id","trainer_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_freezes" ADD CONSTRAINT "package_freezes_package_fk" FOREIGN KEY ("client_package_id","trainer_id") REFERENCES "public"."client_packages"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_package_fk" FOREIGN KEY ("client_package_id","client_id") REFERENCES "public"."client_packages"("id","client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;