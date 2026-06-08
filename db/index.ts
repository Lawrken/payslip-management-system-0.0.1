import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"

declare global {
  var __payslipSql: postgres.Sql | undefined
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required.")
  }
  return url
}

type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>
type Database = DrizzleDatabase
type DatabaseTransaction = Parameters<
  Parameters<DrizzleDatabase["transaction"]>[0]
>[0]
export type DatabaseClient = Database | DatabaseTransaction

let cachedDb: DrizzleDatabase | undefined

function getSql() {
  const sql =
    globalThis.__payslipSql ??
    postgres(getDatabaseUrl(), {
      prepare: false,
    })

  if (process.env.NODE_ENV !== "production") {
    globalThis.__payslipSql = sql
  }

  return sql
}

function getDb() {
  cachedDb ??= drizzle(getSql(), { schema })
  return cachedDb
}

export const db = new Proxy({} as DrizzleDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver)
  },
})

export async function closeDb() {
  if (globalThis.__payslipSql) {
    await globalThis.__payslipSql.end()
    globalThis.__payslipSql = undefined
    cachedDb = undefined
  }
}
