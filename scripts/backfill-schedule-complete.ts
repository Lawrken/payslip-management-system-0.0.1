import { closeDb } from "@/db"
import { backfillScheduleCompleteFlags } from "@/lib/employee-schedules"

async function main() {
  const updated = await backfillScheduleCompleteFlags()
  console.log(`Updated ${updated} employee schedule rows.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
