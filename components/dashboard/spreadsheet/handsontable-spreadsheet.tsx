"use client"

import { HotTable, type HotTableRef } from "@handsontable/react-wrapper"
import Handsontable from "handsontable/base"
import { registerAllModules } from "handsontable/registry"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  isColumnEditable,
  normalizeColumnOptions,
  resolveColumnOptions,
  type SpreadsheetColumnDef,
} from "@/components/dashboard/spreadsheet/column-defs/types"
import { formatIsoDate } from "@/lib/payroll-dates"
import { isTimesRequired } from "@/lib/schedule-days"
import type { SpreadsheetRow } from "@/lib/spreadsheet/types"
import type { ShiftType } from "@/lib/types"

registerAllModules()

const INTERNAL_CHANGE_SOURCE = "helport-internal-update"
const BODY_ROW_HEIGHT = 34
const HEADER_ROW_HEIGHT = 38
const LICENSE_KEY =
  process.env.NEXT_PUBLIC_HANDSONTABLE_LICENSE_KEY ??
  "non-commercial-and-evaluation"

const ROW_METADATA_FIELDS = [
  "rowId",
  "id",
  "payrollId",
  "holidayLocked",
] as const

function cloneRows(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  return rows.map((row) => structuredClone(row))
}

function getEditableFields(
  columns: SpreadsheetColumnDef[],
  readOnly: boolean
): string[] {
  return columns
    .filter((column) => {
      if (readOnly || column.type === "readonly" || column.editable === false) {
        return false
      }
      return true
    })
    .map((column) => column.field)
}

function valuesDiffer(initialValue: unknown, nextValue: unknown) {
  if (typeof initialValue === "number" || typeof nextValue === "number") {
    return Number(initialValue ?? 0) !== Number(nextValue ?? 0)
  }
  return String(initialValue ?? "") !== String(nextValue ?? "")
}

function coerceCellValue(
  column: SpreadsheetColumnDef | undefined,
  rawValue: unknown
): string | number {
  if (column?.type === "number" || column?.field === "divisor") {
    const nextValue = Number(rawValue)
    return Number.isNaN(nextValue) ? 0 : nextValue
  }

  if (column?.type === "date") {
    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
      return formatIsoDate(rawValue)
    }

    const trimmed = String(rawValue ?? "").trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    return trimmed
  }

  if (rawValue === null || rawValue === undefined) {
    return ""
  }

  return String(rawValue)
}

function applyScheduleShiftTypeSideEffects(
  row: SpreadsheetRow,
  shiftType: string
) {
  if (!("holidayLocked" in row) || row.holidayLocked) {
    return
  }

  if (!isTimesRequired(shiftType as ShiftType | "")) {
    row.shiftIn = ""
    row.shiftOut = ""
    row.logIn = ""
    row.logOut = ""
  }
}

function preserveRowMetadata(
  row: SpreadsheetRow,
  initialRow: SpreadsheetRow | undefined
) {
  if (!initialRow) {
    return row
  }

  for (const field of ROW_METADATA_FIELDS) {
    const currentValue = row[field]
    const initialValue = initialRow[field]
    if (
      (currentValue === undefined ||
        currentValue === null ||
        currentValue === "") &&
      initialValue !== undefined &&
      initialValue !== null &&
      initialValue !== ""
    ) {
      ;(row as Record<string, unknown>)[field] = initialValue
    }
  }

  if (!row.id && initialRow.id) {
    row.id = initialRow.id
  }

  return row
}

function enrichDirtyRowsForSave(
  dirtyRows: SpreadsheetRow[],
  initialSnapshot: Map<string, SpreadsheetRow>
) {
  return dirtyRows.map((row) => {
    const initialRow = initialSnapshot.get(row.rowId)
    if (!initialRow) {
      return row
    }

    return preserveRowMetadata({ ...initialRow, ...row }, initialRow)
  })
}

function getFixedLeftColumnCount(columns: SpreadsheetColumnDef[]) {
  let count = 0
  for (const column of columns) {
    if (column.pinned !== "left") {
      break
    }
    count += 1
  }
  return count
}

type HandsontableSpreadsheetProps = {
  columns: SpreadsheetColumnDef[]
  initialRowData: SpreadsheetRow[]
  readOnly?: boolean
  isActive?: boolean
  errorRowIds?: string[]
  onRowDataChange?: (row: SpreadsheetRow) => SpreadsheetRow
  onSave: (context: {
    dirtyRows: SpreadsheetRow[]
    allRows: SpreadsheetRow[]
    dirtyRowIds: string[]
  }) => Promise<void>
  onSaveError?: (message: string) => void
  isSaving?: boolean
}

export function HandsontableSpreadsheet({
  columns,
  initialRowData,
  readOnly = false,
  isActive = true,
  errorRowIds = [],
  onRowDataChange,
  onSave,
  onSaveError,
  isSaving = false,
}: HandsontableSpreadsheetProps) {
  const { resolvedTheme } = useTheme()
  const hotTheme =
    resolvedTheme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"

  const hotTableRef = React.useRef<HotTableRef>(null)
  const initialSnapshotRef = React.useRef(
    new Map(initialRowData.map((row) => [row.rowId, structuredClone(row)]))
  )
  const rowDataRef = React.useRef<SpreadsheetRow[]>(cloneRows(initialRowData))
  const [rowData, setRowData] = React.useState<SpreadsheetRow[]>(
    cloneRows(initialRowData)
  )
  const [dirtyRowIds, setDirtyRowIds] = React.useState<Set<string>>(new Set())
  const [dirtyCells, setDirtyCells] = React.useState<Set<string>>(new Set())

  const errorRowIdSet = React.useMemo(() => new Set(errorRowIds), [errorRowIds])

  const editableFields = React.useMemo(
    () => getEditableFields(columns, readOnly),
    [columns, readOnly]
  )

  const columnByField = React.useMemo(
    () => new Map(columns.map((column) => [column.field, column])),
    [columns]
  )

  const fixedColumnsStart = React.useMemo(
    () => getFixedLeftColumnCount(columns),
    [columns]
  )

  const refreshGridDimensions = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      const hot = hotTableRef.current?.hotInstance
      if (!hot) {
        return
      }

      hot.render()
      hot.refreshDimensions()
    })
  }, [])

  const updateDirtyStateForRows = React.useCallback(
    (nextRowData: SpreadsheetRow[], rowIndexes: Iterable<number>) => {
      const affectedRows = new Map<
        string,
        { hasDirtyCells: boolean; dirtyCellKeys: string[] }
      >()

      for (const rowIndex of rowIndexes) {
        const row = nextRowData[rowIndex]
        const initialRow = row
          ? initialSnapshotRef.current.get(row.rowId)
          : undefined
        if (!row || !initialRow) {
          continue
        }

        const dirtyCellKeys: string[] = []

        for (const field of editableFields) {
          const column = columnByField.get(field)
          if (!column || !isColumnEditable(column, row, readOnly)) {
            continue
          }

          if (valuesDiffer(initialRow[field], row[field])) {
            dirtyCellKeys.push(`${row.rowId}:${field}`)
          }
        }

        affectedRows.set(row.rowId, {
          hasDirtyCells: dirtyCellKeys.length > 0,
          dirtyCellKeys,
        })
      }

      if (affectedRows.size === 0) {
        return
      }

      setDirtyRowIds((currentDirtyRowIds) => {
        const nextDirtyRowIds = new Set(currentDirtyRowIds)

        for (const [rowId, { hasDirtyCells }] of affectedRows) {
          if (hasDirtyCells) {
            nextDirtyRowIds.add(rowId)
          } else {
            nextDirtyRowIds.delete(rowId)
          }
        }

        return nextDirtyRowIds
      })

      setDirtyCells((currentDirtyCells) => {
        const nextDirtyCells = new Set(currentDirtyCells)

        for (const rowId of affectedRows.keys()) {
          for (const field of editableFields) {
            nextDirtyCells.delete(`${rowId}:${field}`)
          }
        }

        for (const { dirtyCellKeys } of affectedRows.values()) {
          for (const dirtyCellKey of dirtyCellKeys) {
            nextDirtyCells.add(dirtyCellKey)
          }
        }

        return nextDirtyCells
      })
    },
    [columnByField, editableFields, readOnly]
  )

  React.useEffect(() => {
    let cancelled = false
    const restored = cloneRows(initialRowData)
    initialSnapshotRef.current = new Map(
      restored.map((row) => [row.rowId, structuredClone(row)])
    )
    rowDataRef.current = restored

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      setRowData(restored)
      setDirtyRowIds(new Set())
      setDirtyCells(new Set())
      hotTableRef.current?.hotInstance?.loadData(
        restored,
        INTERNAL_CHANGE_SOURCE
      )
      refreshGridDimensions()
    })

    return () => {
      cancelled = true
    }
  }, [initialRowData, refreshGridDimensions])

  React.useEffect(() => {
    if (!isActive) {
      return
    }

    refreshGridDimensions()
  }, [isActive, refreshGridDimensions])

  const hotColumns = React.useMemo<Handsontable.ColumnSettings[]>(
    () =>
      columns.map((column) => {
        const columnSettings: Handsontable.ColumnSettings = {
          data: column.field,
          readOnly:
            readOnly || column.type === "readonly" || column.editable === false,
          width: column.minWidth,
        }

        if (column.type === "number") {
          columnSettings.type = "numeric"
          columnSettings.numericFormat = {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        } else if (column.type === "date") {
          columnSettings.type = "date"
          columnSettings.dateFormat = "YYYY-MM-DD"
          columnSettings.correctFormat = true
        } else if (column.type === "select") {
          columnSettings.type = "dropdown"
          const staticOptions =
            typeof column.options === "function"
              ? normalizeColumnOptions(
                  column.options(initialRowData[0] ?? { rowId: "" })
                )
              : normalizeColumnOptions(column.options ?? [])
          columnSettings.source = staticOptions.map((option) => option.value)
          columnSettings.strict = true
          columnSettings.allowInvalid = false
        } else {
          columnSettings.type = "text"
        }

        if (column.format) {
          columnSettings.renderer = (
            instance,
            td,
            row,
            _col,
            _prop,
            value
          ) => {
            const sourceRow = instance.getSourceDataAtRow(row) as SpreadsheetRow
            td.textContent = column.format?.(value, sourceRow) ?? ""
          }
        }

        return columnSettings
      }),
    [columns, initialRowData, readOnly]
  )

  const cells = React.useCallback(
    (rowIndex: number, columnIndex: number) => {
      const column = columns[columnIndex]
      const row = rowDataRef.current[rowIndex]
      const cellProperties: Handsontable.CellMeta = {}

      if (!column || !row || !isColumnEditable(column, row, readOnly)) {
        cellProperties.readOnly = true
      }

      if (column?.type === "select" && row) {
        cellProperties.type = "dropdown"
        cellProperties.source = resolveColumnOptions(column.options, row).map(
          (option) => option.value
        )
        cellProperties.strict = true
        cellProperties.allowInvalid = false
      }

      const classNames = []
      if (column?.pinned === "right") {
        classNames.push("spreadsheet-total-cell")
      }
      if (row && column && dirtyCells.has(`${row.rowId}:${column.field}`)) {
        classNames.push("spreadsheet-dirty-cell")
      }
      if (row && errorRowIdSet.has(row.rowId)) {
        classNames.push("spreadsheet-error-cell")
      }
      if (cellProperties.readOnly) {
        classNames.push("spreadsheet-readonly-cell")
      }
      if (classNames.length > 0) {
        cellProperties.className = classNames.join(" ")
      }

      return cellProperties
    },
    [columns, dirtyCells, errorRowIdSet, readOnly]
  )

  const syncProgrammaticGridValues = React.useCallback(
    (nextRows: SpreadsheetRow[], rowIndexes: Iterable<number>) => {
      const hot = hotTableRef.current?.hotInstance
      if (!hot) {
        return
      }

      const updates: Array<[number, string, unknown]> = []

      for (const rowIndex of rowIndexes) {
        const row = nextRows[rowIndex]
        if (!row) {
          continue
        }

        for (const column of columns) {
          const currentValue = hot.getDataAtRowProp(rowIndex, column.field)
          const nextValue = row[column.field]
          if (valuesDiffer(currentValue, nextValue)) {
            updates.push([rowIndex, column.field, nextValue])
          }
        }
      }

      if (updates.length > 0) {
        hot.setDataAtRowProp(updates, INTERNAL_CHANGE_SOURCE)
      }
    },
    [columns]
  )

  const handleAfterChange = React.useCallback(
    (
      changes: Handsontable.CellChange[] | null,
      source: Handsontable.ChangeSource
    ) => {
      if (
        !changes ||
        source === "loadData" ||
        source === "updateData" ||
        String(source) === INTERNAL_CHANGE_SOURCE
      ) {
        return
      }

      const nextRows = rowDataRef.current.map((row) => ({ ...row }))
      const changedRowIndexes = new Set<number>()

      for (const [rowIndex, prop, , newValue] of changes) {
        if (typeof prop !== "string") {
          continue
        }

        const row = nextRows[rowIndex]
        const column = columnByField.get(prop)
        if (!row || !column || !isColumnEditable(column, row, readOnly)) {
          continue
        }

        row[prop] = coerceCellValue(column, newValue)

        if (prop === "shiftType") {
          applyScheduleShiftTypeSideEffects(row, String(row.shiftType ?? ""))
        }

        preserveRowMetadata(row, initialSnapshotRef.current.get(row.rowId))
        changedRowIndexes.add(rowIndex)
      }

      if (changedRowIndexes.size === 0) {
        return
      }

      for (const rowIndex of changedRowIndexes) {
        if (onRowDataChange) {
          nextRows[rowIndex] = onRowDataChange(nextRows[rowIndex])
        }
      }

      rowDataRef.current = nextRows
      setRowData(nextRows)
      updateDirtyStateForRows(nextRows, changedRowIndexes)
      syncProgrammaticGridValues(nextRows, changedRowIndexes)
    },
    [
      columnByField,
      onRowDataChange,
      readOnly,
      syncProgrammaticGridValues,
      updateDirtyStateForRows,
    ]
  )

  function handleDiscard() {
    const restored = cloneRows(initialRowData)
    rowDataRef.current = restored
    setRowData(restored)
    setDirtyRowIds(new Set())
    setDirtyCells(new Set())
    hotTableRef.current?.hotInstance?.loadData(restored, INTERNAL_CHANGE_SOURCE)
    refreshGridDimensions()
  }

  async function handleSave() {
    const dirtyIds = [...dirtyRowIds]
    const rowsById = new Map(rowDataRef.current.map((row) => [row.rowId, row]))
    const dirtyRows = dirtyIds
      .map((rowId) => rowsById.get(rowId))
      .filter((row): row is SpreadsheetRow => Boolean(row))

    const missingRowIds = dirtyRows.filter((row) => !String(row.rowId ?? "").trim())
    if (missingRowIds.length > 0) {
      onSaveError?.(
        "Some rows are missing identifiers and cannot be saved. Discard changes and reload the page."
      )
      return
    }

    const enrichedDirtyRows = enrichDirtyRowsForSave(
      dirtyRows,
      initialSnapshotRef.current
    )

    await onSave({
      dirtyRows: enrichedDirtyRows,
      allRows: rowDataRef.current,
      dirtyRowIds: dirtyIds,
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-3">
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={dirtyRowIds.size === 0 || isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={dirtyRowIds.size === 0 || isSaving}
            onClick={handleDiscard}
          >
            Discard changes
          </Button>
          {dirtyRowIds.size > 0 ? (
            <span className="text-muted-foreground text-sm">
              {dirtyRowIds.size} row{dirtyRowIds.size === 1 ? "" : "s"} modified
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="spreadsheet-hot-container min-h-[480px] overflow-hidden">
        <HotTable
          key={hotTheme}
          ref={hotTableRef}
          data={rowData}
          columns={hotColumns}
          colHeaders={columns.map((column) => column.headerName)}
          rowHeaders
          width="100%"
          height="calc(100vh - 14rem)"
          stretchH="none"
          rowHeights={BODY_ROW_HEIGHT}
          columnHeaderHeight={HEADER_ROW_HEIGHT}
          autoRowSize={false}
          autoWrapRow={false}
          autoWrapCol={false}
          wordWrap={false}
          copyPaste
          fillHandle
          manualColumnResize
          manualRowResize={false}
          fixedColumnsStart={fixedColumnsStart}
          cells={cells}
          afterInit={refreshGridDimensions}
          afterChange={handleAfterChange}
          licenseKey={LICENSE_KEY}
          theme={hotTheme}
        />
      </div>
    </div>
  )
}
