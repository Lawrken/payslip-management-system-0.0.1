ALTER TABLE "employees" ADD COLUMN "email" text;--> statement-breakpoint
UPDATE "employees"
SET "email" = lower("employee_id") || '@helport.local'
WHERE "email" IS NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");
