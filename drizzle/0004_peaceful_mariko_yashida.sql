ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "initial_password_ciphertext" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "users"
SET "email" = CASE
	WHEN "employee_id" = 'ADMIN001' THEN 'admin@helport.local'
	WHEN "employee_id" = 'SUPER001' THEN 'superadmin@helport.local'
	ELSE lower("employee_id") || '@helport.local'
END
WHERE "email" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
