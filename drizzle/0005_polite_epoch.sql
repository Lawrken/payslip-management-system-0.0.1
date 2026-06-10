ALTER TABLE "employees" ADD COLUMN "employee_status" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "position_title" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "program" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "account" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "divisor" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "basic_pay" numeric;--> statement-breakpoint
UPDATE "employees"
SET
  "employee_status" = 'Active',
  "position_title" = 'Admin Assistant',
  "department" = 'Human Resource',
  "program" = 'AHL',
  "account" = 'Admin Department',
  "divisor" = 261,
  "basic_pay" = 0
WHERE "employee_status" IS NULL
  OR "position_title" IS NULL
  OR "department" IS NULL
  OR "program" IS NULL
  OR "account" IS NULL
  OR "divisor" IS NULL
  OR "basic_pay" IS NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "employee_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "position_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "department" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "program" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "account" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "divisor" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "basic_pay" SET NOT NULL;
