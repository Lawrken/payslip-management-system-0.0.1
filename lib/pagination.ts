export const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

export type PaginationInput = {
  page?: string | number
  pageSize?: string | number
}

export type PaginationQuery = {
  page: number
  pageSize: number
  offset: number
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

function toPositiveInteger(value: string | number | undefined) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

export function normalizePagination(input: PaginationInput): PaginationQuery {
  const page = toPositiveInteger(input.page) ?? 1
  const requestedPageSize =
    toPositiveInteger(input.pageSize) ?? DEFAULT_PAGE_SIZE
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationQuery
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
  }
}
