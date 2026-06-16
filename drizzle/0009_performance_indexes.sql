ALTER TABLE "employee_schedules" ADD COLUMN "is_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "employees_name_idx" ON "employees" USING btree ("name");--> statement-breakpoint
CREATE INDEX "payrolls_payroll_period_end_idx" ON "payrolls" USING btree ("payroll_period_end");