DROP INDEX "employee_schedules_payroll_employee_idx";--> statement-breakpoint
CREATE INDEX "audit_logs_actor_role_created_at_idx" ON "audit_logs" USING btree ("actor_role","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_schedules_payroll_employee_unique" ON "employee_schedules" USING btree ("payroll_id","employee_id");--> statement-breakpoint
CREATE INDEX "payslips_payroll_status_idx" ON "payslips" USING btree ("payroll_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payslips_payroll_employee_unique" ON "payslips" USING btree ("payroll_id","employee_id");