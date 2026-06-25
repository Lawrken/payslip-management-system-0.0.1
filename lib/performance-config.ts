/**
 * Performance configuration loader.
 *
 * Single source of truth for runtime performance knobs. Centralizes
 * environment-variable parsing, validation, clamping, and documented defaults.
 *
 * Behavior (Requirements 10.3-10.5):
 * - absent variable -> documented default, no error
 * - present but unparseable -> documented default + error naming the variable
 * - present but out of range -> documented default + error naming the variable
 */

export type PerformanceConfig = {
  /** DB_POOL_MAX, default 10, valid [2, 100] */
  dbPoolMax: number
  /** DB_IDLE_TIMEOUT, default 20, valid [1, 600] */
  dbIdleTimeoutSeconds: number
  /** DB_CONNECT_TIMEOUT, default 30, valid [1, 120] */
  dbConnectTimeoutSeconds: number
  /** default 30000, fixed by Requirement 2.4 */
  poolAcquireTimeoutMs: number
  /** PAYROLL_STORED_TOTALS, default false */
  storedTotalsEnabled: boolean
}

export const DB_POOL_MAX_DEFAULT = 10
export const DB_POOL_MAX_MIN = 2
export const DB_POOL_MAX_MAX = 100

export const DB_IDLE_TIMEOUT_DEFAULT = 20
export const DB_IDLE_TIMEOUT_MIN = 1
export const DB_IDLE_TIMEOUT_MAX = 600

// Default raised 10 -> 30 so a Neon serverless cold-start (compute wakes from
// scale-to-zero on the first query after idle) completes inside the connection
// window instead of throwing a transient connection error.
export const DB_CONNECT_TIMEOUT_DEFAULT = 30
export const DB_CONNECT_TIMEOUT_MIN = 1
export const DB_CONNECT_TIMEOUT_MAX = 120

export const POOL_ACQUIRE_TIMEOUT_MS = 30000

export type BoundedIntResult = {
  value: number
  error?: string
}

/**
 * Parses a single environment variable into a bounded integer.
 *
 * - When `raw` is absent (undefined/empty), returns the default with no error.
 * - When `raw` cannot be parsed as an integer, returns the default with an
 *   error naming the variable.
 * - When `raw` parses but falls outside `[min, max]`, returns the default with
 *   an error naming the variable.
 */
export function readBoundedInt(
  name: string,
  raw: string | undefined,
  def: number,
  min: number,
  max: number
): BoundedIntResult {
  if (raw === undefined || raw.trim() === "") {
    return { value: def }
  }

  const trimmed = raw.trim()

  // Accept only whole-number representations. Reject decimals, NaN, Infinity,
  // and any value with trailing non-numeric characters.
  if (!/^[+-]?\d+$/.test(trimmed)) {
    return {
      value: def,
      error: `Invalid value for ${name}: "${raw}" is not an integer; using default ${def}.`,
    }
  }

  const parsed = Number.parseInt(trimmed, 10)

  if (!Number.isFinite(parsed)) {
    return {
      value: def,
      error: `Invalid value for ${name}: "${raw}" is not an integer; using default ${def}.`,
    }
  }

  if (parsed < min || parsed > max) {
    return {
      value: def,
      error: `Out-of-range value for ${name}: ${parsed} is not within [${min}, ${max}]; using default ${def}.`,
    }
  }

  return { value: parsed }
}

/**
 * Parses a boolean environment variable.
 *
 * - Absent (undefined/empty) -> default, no error.
 * - "true"/"1" (case-insensitive) -> true.
 * - "false"/"0" (case-insensitive) -> false.
 * - Anything else -> default + error naming the variable.
 */
function readBoolean(
  name: string,
  raw: string | undefined,
  def: boolean
): { value: boolean; error?: string } {
  if (raw === undefined || raw.trim() === "") {
    return { value: def }
  }

  const normalized = raw.trim().toLowerCase()

  if (normalized === "true" || normalized === "1") {
    return { value: true }
  }

  if (normalized === "false" || normalized === "0") {
    return { value: false }
  }

  return {
    value: def,
    error: `Invalid value for ${name}: "${raw}" is not a boolean; using default ${def}.`,
  }
}

/**
 * Loads and validates the performance configuration from the environment.
 *
 * Returns the resolved configuration alongside a list of error messages. The
 * configuration is always fully populated (invalid values fall back to their
 * documented defaults), so callers can use `config` regardless of whether
 * `errors` is empty. Errors are surfaced for logging without blocking startup
 * (Requirements 10.4, 10.5).
 */
export function loadPerformanceConfig(
  env: NodeJS.ProcessEnv = process.env
): { config: PerformanceConfig; errors: string[] } {
  const errors: string[] = []

  const dbPoolMax = readBoundedInt(
    "DB_POOL_MAX",
    env.DB_POOL_MAX,
    DB_POOL_MAX_DEFAULT,
    DB_POOL_MAX_MIN,
    DB_POOL_MAX_MAX
  )
  if (dbPoolMax.error) {
    errors.push(dbPoolMax.error)
  }

  const dbIdleTimeoutSeconds = readBoundedInt(
    "DB_IDLE_TIMEOUT",
    env.DB_IDLE_TIMEOUT,
    DB_IDLE_TIMEOUT_DEFAULT,
    DB_IDLE_TIMEOUT_MIN,
    DB_IDLE_TIMEOUT_MAX
  )
  if (dbIdleTimeoutSeconds.error) {
    errors.push(dbIdleTimeoutSeconds.error)
  }

  const dbConnectTimeoutSeconds = readBoundedInt(
    "DB_CONNECT_TIMEOUT",
    env.DB_CONNECT_TIMEOUT,
    DB_CONNECT_TIMEOUT_DEFAULT,
    DB_CONNECT_TIMEOUT_MIN,
    DB_CONNECT_TIMEOUT_MAX
  )
  if (dbConnectTimeoutSeconds.error) {
    errors.push(dbConnectTimeoutSeconds.error)
  }

  const storedTotalsEnabled = readBoolean(
    "PAYROLL_STORED_TOTALS",
    env.PAYROLL_STORED_TOTALS,
    false
  )
  if (storedTotalsEnabled.error) {
    errors.push(storedTotalsEnabled.error)
  }

  const config: PerformanceConfig = {
    dbPoolMax: dbPoolMax.value,
    dbIdleTimeoutSeconds: dbIdleTimeoutSeconds.value,
    dbConnectTimeoutSeconds: dbConnectTimeoutSeconds.value,
    poolAcquireTimeoutMs: POOL_ACQUIRE_TIMEOUT_MS,
    storedTotalsEnabled: storedTotalsEnabled.value,
  }

  return { config, errors }
}
