CREATE INDEX "employees_employee_status_idx" ON "employees" USING btree ("employee_status");--> statement-breakpoint
CREATE INDEX "employees_department_idx" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "employees_program_idx" ON "employees" USING btree ("program");--> statement-breakpoint
CREATE INDEX "employees_account_idx" ON "employees" USING btree ("account");--> statement-breakpoint
CREATE INDEX "employees_divisor_idx" ON "employees" USING btree ("divisor");--> statement-breakpoint
CREATE INDEX "employees_position_title_idx" ON "employees" USING btree ("position_title");