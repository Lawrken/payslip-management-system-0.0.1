CREATE TABLE "credential_exports" (
	"employee_id" text PRIMARY KEY NOT NULL,
	"employee_name" text,
	"role" text NOT NULL,
	"password_ciphertext" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_employee_id" text NOT NULL
);
