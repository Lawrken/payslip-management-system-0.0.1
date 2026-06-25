import "server-only"

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
      max: 10,
      idle_timeout: 20,
      // ponytail: raised 10→30 so Neon cold-start wake (5-15s) completes
      // inside the connection window. Upgrade: use DB_CONNECT_TIMEOUT env var.
      connect_timeout: 30,
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

// -- Transient connection retry (Neon cold-start resilience) --

const TRANSIENT_CODES = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
])

/** Walk up to 5 levels of `.cause` looking for a transient error code. */
export function isTransientConnectionError(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; current && depth < 5; depth++) {
    const code = (current as { code?: unknown }).code
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true
    current = (current as { cause?: unknown }).cause
  }
  return false
}

/**
 * Retry an async operation on transient DB connection errors.
 * ponytail: 3 attempts total, 250ms/500ms backoff. Upgrade path: make
 * attempts/delay configurable via env if needed.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
  baseDelayMs = 250
): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= retries || !isTransientConnectionError(error)) throw error
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt))
      attempt++
    }
  }
}

/** Retry-enabled transaction wrapper. All callers get cold-start resilience. */
export async function transaction<T>(
  fn: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  return withDbRetry(() => getDb().transaction(fn))
}
