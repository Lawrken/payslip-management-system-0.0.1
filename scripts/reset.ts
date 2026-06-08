import "dotenv/config"

import { sql } from "drizzle-orm"

import { closeDb, db } from "@/db"

async function main() {
  await db.execute(
    sql`TRUNCATE audit_logs, payslip_inputs, payslips, payrolls, employees, users CASCADE`
  )
}

main()
  .then(() => {
    console.log("Database reset.")
    return closeDb()
  })
  .catch((error) => {
    console.error(error)
    closeDb().finally(() => process.exit(1))
  })
