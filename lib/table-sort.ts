export type SortDirection = "asc" | "desc"

export function applyDirection(result: number, dir: SortDirection): number {
  return dir === "asc" ? result : -result
}

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b)
}

export function compareDates(a: Date | null, b: Date | null): number {
  if (a === null && b === null) {
    return 0
  }
  if (a === null) {
    return 1
  }
  if (b === null) {
    return -1
  }
  return a.getTime() - b.getTime()
}
