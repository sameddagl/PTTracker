ALTER TABLE "client_packages" ADD COLUMN "installments" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "installments" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_installments_range" CHECK ("client_packages"."installments" between 1 and 12);--> statement-breakpoint
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_installments_range" CHECK ("package_templates"."installments" between 1 and 12);