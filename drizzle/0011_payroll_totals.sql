-- Migration 0011: create payroll_totals summary table and backfill existing data.
-- Requirements: 6.3, 7.3, 7.4, 10.2
--
-- 1. Create payroll_totals with a PK FK to payrolls.id ON DELETE CASCADE.
--    All money columns carry a NOT NULL DEFAULT 0 so existing payrolls that
--    have no payslip_inputs get a row of zeros without needing any data.
-- 2. Backfill: one row per existing payroll, summing the JSONB money keys from
--    payslip_inputs exactly as getPayrollPayslipMetrics does.  Payrolls with no
--    payslip_inputs get all-zero totals via the LEFT JOIN + COALESCE.
-- 3. Existing rows and their existing column values are not touched (Req 7.4, 10.2).

CREATE TABLE "payroll_totals" (
	"payroll_id"           text        PRIMARY KEY,
	"gross_pay"            numeric     NOT NULL DEFAULT 0,
	"total_deductions"     numeric     NOT NULL DEFAULT 0,
	"net_pay"              numeric     NOT NULL DEFAULT 0,
	"taxable_earnings"     numeric     NOT NULL DEFAULT 0,
	"non_taxable_earnings" numeric     NOT NULL DEFAULT 0,
	"updated_at"           timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payroll_totals"
  ADD CONSTRAINT "payroll_totals_payroll_id_payrolls_id_fk"
  FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint

-- Backfill: insert one summary row per existing payroll.
-- The LEFT JOIN ensures payrolls with no payslip_inputs still get a row
-- (all aggregates COALESCE to 0).  ON CONFLICT DO NOTHING is a safety net
-- in case the migration is run a second time on a partially-applied state.
INSERT INTO "payroll_totals" (
  "payroll_id",
  "gross_pay",
  "total_deductions",
  "net_pay",
  "taxable_earnings",
  "non_taxable_earnings",
  "updated_at"
)
SELECT
  p.id AS payroll_id,
  COALESCE(SUM((pi.totals->>'grossPay')::numeric),        0) AS gross_pay,
  COALESCE(SUM((pi.totals->>'totalDeductions')::numeric), 0) AS total_deductions,
  COALESCE(SUM((pi.totals->>'netPay')::numeric),          0) AS net_pay,
  COALESCE(SUM((pi.totals->>'taxableEarnings')::numeric), 0) AS taxable_earnings,
  COALESCE(SUM((pi.totals->>'nonTaxableEarnings')::numeric), 0) AS non_taxable_earnings,
  now() AS updated_at
FROM "payrolls" p
LEFT JOIN "payslips"       ps ON ps.payroll_id = p.id
LEFT JOIN "payslip_inputs" pi ON pi.payslip_id = ps.id
GROUP BY p.id
ON CONFLICT ("payroll_id") DO NOTHING;
