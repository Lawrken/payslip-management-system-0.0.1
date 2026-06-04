CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_employee_id" text NOT NULL,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_label" text NOT NULL,
	"details" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"employee_id" text NOT NULL,
	"tin" text NOT NULL,
	"sss_no" text NOT NULL,
	"phic_no" text NOT NULL,
	"hdmf_no" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_period_label" text NOT NULL,
	"payroll_period_start" text NOT NULL,
	"payroll_period_end" text NOT NULL,
	"dtr_cut_off_start" text NOT NULL,
	"dtr_cut_off_end" text NOT NULL,
	"payout_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip_inputs" (
	"payslip_id" text PRIMARY KEY NOT NULL,
	"inputs" jsonb NOT NULL,
	"totals" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"employee_id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payslip_inputs" ADD CONSTRAINT "payslip_inputs_payslip_id_payslips_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "public"."payslips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_employee_id_idx" ON "audit_logs" USING btree ("actor_employee_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "payslips_payroll_id_idx" ON "payslips" USING btree ("payroll_id");--> statement-breakpoint
CREATE INDEX "payslips_employee_id_idx" ON "payslips" USING btree ("employee_id");