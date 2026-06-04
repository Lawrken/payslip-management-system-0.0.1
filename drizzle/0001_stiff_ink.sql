ALTER TABLE "employees" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");