ALTER TABLE "applications" ADD COLUMN "installments" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "compare_at_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "installment_price" numeric(12, 2);--> statement-breakpoint
-- Until now `installments` split the one price; that price becomes the installment total too.
UPDATE "package_templates" SET "installments" = 1 WHERE "installments" > 1 AND "price" IS NULL;--> statement-breakpoint
UPDATE "package_templates" SET "installment_price" = "price" WHERE "installments" > 1;--> statement-breakpoint
-- Open applications keep the plan their package offered when they applied.
UPDATE "applications" a SET "installments" = t."installments" FROM "package_templates" t
  WHERE t."id" = a."template_id" AND a."status" = 'pending';--> statement-breakpoint
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_installment_option" CHECK (("package_templates"."installments" = 1) = ("package_templates"."installment_price" is null));--> statement-breakpoint
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_compare_at_higher" CHECK ("package_templates"."compare_at_price" is null or "package_templates"."compare_at_price" > "package_templates"."price");