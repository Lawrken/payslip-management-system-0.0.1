CREATE TABLE "employee_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_schedules_payroll_id_idx" ON "employee_schedules" USING btree ("payroll_id");--> statement-breakpoint
CREATE INDEX "employee_schedules_employee_id_idx" ON "employee_schedules" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_schedules_payroll_employee_idx" ON "employee_schedules" USING btree ("payroll_id","employee_id");