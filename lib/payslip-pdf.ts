import PDFDocument from "pdfkit/js/pdfkit.standalone.js"

import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
  type PayslipFieldDefinition,
} from "@/lib/payslip-fields"
import { calculatePayslipTotals } from "@/lib/payroll-calculator"
import { formatDisplayDate } from "@/lib/payroll-dates"
import type { PayslipPayrollInputs, PayslipPdfData } from "@/lib/types"

const PAGE_MARGIN = 16
const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const BLOCK_GAP = 8
const HEADER_HEIGHT = 70
const FOOTER_HEIGHT = 40
const TEXT = "#1c1917"
const MUTED = "#78716c"
const TABLE_HEADER = "#a8a29e"
const TEAL = "#0c2623"
const TEAL_LIGHT = "#6ee7d7"
const WHITE = "#ffffff"
const WHITE_MUTED = "#93b5af"
const POSITIVE = "#0d9488"
const NEGATIVE = "#c2410c"
const ZERO = "#d6d3d1"

const GRID_ROW_COUNT =
  1 + PAY_DETAILS_FIELDS.length + 1 + NON_TAXABLE_FIELDS.length + 1 + 1

const COLUMN_WIDTHS = {
  payItem: 0.28,
  days: 0.1,
  hrs: 0.1,
  amount: 0.14,
  dedItem: 0.22,
  dedAmount: 0.16,
} as const

const NON_TAXABLE_ADJ_LABELS: Partial<Record<string, string>> = {
  cloth: "Clothadj",
  emplach: "Emplachadj",
  holrep: "Holrepadj",
  laundry: "Laundryadj",
  medasst: "Medasstadj",
  medcash: "Medcashadj",
  otmeal: "OTMealadj",
  riceSubsidy: "Rice Subsidyadj",
}

function formatSampleAmount(value: number | undefined) {
  if (value === undefined || value === 0) {
    return "-"
  }

  const formatted = Math.abs(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return value < 0 ? `(${formatted})` : formatted
}

function formatSampleQty(value: number | undefined) {
  if (value === undefined || value === 0) {
    return "-"
  }

  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatSampleDtr(start: string, end: string) {
  return `${formatDisplayDate(start)}-${formatDisplayDate(end)}`
}

function rawFieldValue(
  inputs: PayslipPayrollInputs,
  field: PayslipFieldDefinition
) {
  return inputs[field.key as keyof PayslipPayrollInputs]
}

function getPayAmount(
  field: PayslipFieldDefinition,
  value: number,
  lineAmounts: Record<string, number>
) {
  return lineAmounts[field.key] ?? value
}

function getAdjLabel(field: PayslipFieldDefinition) {
  if (field.key === "dmbAdj" || field.key === "taxRefund") {
    return null
  }

  return NON_TAXABLE_ADJ_LABELS[field.key] ?? `${field.label.replace(/\s/g, "")}adj`
}

type AmountKind = "pay" | "deduction" | "nonTaxable" | "total"

function amountColor(value: number, kind: AmountKind = "pay") {
  if (value === 0) {
    return ZERO
  }
  if (kind === "deduction") {
    return NEGATIVE
  }
  if (value > 0) {
    return POSITIVE
  }
  if (value < 0) {
    return NEGATIVE
  }
  return MUTED
}

function netPayColor(value: number) {
  return value > 0 ? TEAL_LIGHT : value < 0 ? NEGATIVE : ZERO
}

function collectPdf(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    doc.end()
  })
}

function columnX(startX: number, ...keys: (keyof typeof COLUMN_WIDTHS)[]) {
  let x = startX
  for (const key of keys) {
    x += CONTENT_WIDTH * COLUMN_WIDTHS[key]
  }
  return x
}

function drawText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & {
    bold?: boolean
    size?: number
    color?: string
  } = {}
) {
  const { bold = false, size = 8, color = TEXT, ...textOptions } = options
  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size)
    .fillColor(color)
    .text(text, x, y, textOptions)
}

function drawCellText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PDFKit.Mixins.TextOptions & {
    bold?: boolean
    size?: number
    color?: string
  } = {}
) {
  drawText(doc, text, x, y, {
    width,
    height,
    lineBreak: false,
    ellipsis: true,
    ...options,
  })
}

function rowTextY(y: number, rowHeight: number, fontSize: number) {
  return y + (rowHeight - fontSize) / 2
}

function drawLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options: { labelColor?: string; valueColor?: string } = {}
) {
  const labelColor = options.labelColor ?? WHITE_MUTED
  const valueColor = options.valueColor ?? WHITE
  doc.font("Helvetica-Bold").fontSize(8)
  const labelWidth = doc.widthOfString(`${label} `)
  drawText(doc, `${label} `, x, y, { width, bold: true, size: 8, color: labelColor })
  drawText(doc, value, x + labelWidth, y, {
    width: Math.max(width - labelWidth, 40),
    size: 8,
    color: valueColor,
  })
}

function drawSampleHeader(doc: PDFKit.PDFDocument, data: PayslipPdfData, y: number) {
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, HEADER_HEIGHT, 6).fill(TEAL)

  const leftX = PAGE_MARGIN + 12
  const rightX = PAGE_MARGIN + CONTENT_WIDTH * 0.5
  const colWidth = CONTENT_WIDTH * 0.5 - 12
  const lineHeight = 16
  const headerY = y + 10

  drawLabelValue(
    doc,
    "PAYROLL PERIOD:",
    data.payrollPeriodLabel,
    leftX,
    headerY,
    colWidth
  )
  drawLabelValue(
    doc,
    "DTR CUT-OFF:",
    formatSampleDtr(data.dtrCutOffStart, data.dtrCutOffEnd),
    rightX,
    headerY,
    colWidth
  )

  drawLabelValue(doc, "TIN:", data.tin || "-", leftX, headerY + lineHeight, colWidth)
  drawText(doc, "HELPORT PHILIPPINES BRANCH OFFICE PAYROLL", rightX, headerY + lineHeight, {
    width: colWidth * 0.62,
    bold: true,
    size: 7.5,
    color: TEAL_LIGHT,
  })
  drawLabelValue(
    doc,
    "SSS NO.:",
    data.sssNo || "-",
    rightX + colWidth * 0.62,
    headerY + lineHeight,
    colWidth * 0.38
  )

  drawLabelValue(
    doc,
    "EMPLOYEE NAME:",
    data.employeeName,
    leftX,
    headerY + lineHeight * 2,
    colWidth
  )
  drawLabelValue(
    doc,
    "PHIC NO.:",
    data.phicNo || "-",
    rightX,
    headerY + lineHeight * 2,
    colWidth
  )

  drawLabelValue(
    doc,
    "EMPLOYEE ID:",
    data.employeeId,
    leftX,
    headerY + lineHeight * 3,
    colWidth
  )
  drawLabelValue(
    doc,
    "HDMF NO.:",
    data.hdmfNo || "-",
    rightX,
    headerY + lineHeight * 3,
    colWidth
  )

  return y + HEADER_HEIGHT
}

function drawPayRow({
  doc,
  field,
  inputs,
  lineAmounts,
  deductionField,
  x,
  y,
  rowHeight,
  cols,
}: {
  doc: PDFKit.PDFDocument
  field: PayslipFieldDefinition
  inputs: PayslipPayrollInputs
  lineAmounts: Record<string, number>
  deductionField?: PayslipFieldDefinition
  x: number
  y: number
  rowHeight: number
  cols: ReturnType<typeof getColumnBounds>
}) {
  const textY = rowTextY(y, rowHeight, 8)
  const value = rawFieldValue(inputs, field)

  drawCellText(doc, field.label, cols.payItem, textY, cols.payItemW, rowHeight, {
    size: 8,
    color: TEXT,
  })

  if (typeof value !== "number") {
    drawCellText(doc, "-", cols.days, textY, cols.daysW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    drawCellText(doc, "-", cols.hrs, textY, cols.hrsW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    drawCellText(doc, "-", cols.amount, textY, cols.amountW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
  } else if (field.inputKind === "days") {
    drawCellText(
      doc,
      formatSampleQty(value),
      cols.days,
      textY,
      cols.daysW,
      rowHeight,
      { align: "right", size: 8, color: TEXT }
    )
    drawCellText(doc, "-", cols.hrs, textY, cols.hrsW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    const amount = getPayAmount(field, value, lineAmounts)
    drawCellText(
      doc,
      formatSampleAmount(amount),
      cols.amount,
      textY,
      cols.amountW,
      rowHeight,
      {
        align: "right",
        size: 8,
        bold: amount !== 0,
        color: amountColor(amount, "pay"),
      }
    )
  } else if (field.inputKind === "hours") {
    drawCellText(doc, "-", cols.days, textY, cols.daysW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    drawCellText(
      doc,
      formatSampleQty(value),
      cols.hrs,
      textY,
      cols.hrsW,
      rowHeight,
      { align: "right", size: 8, color: TEXT }
    )
    const amount = getPayAmount(field, value, lineAmounts)
    drawCellText(
      doc,
      formatSampleAmount(amount),
      cols.amount,
      textY,
      cols.amountW,
      rowHeight,
      {
        align: "right",
        size: 8,
        bold: amount !== 0,
        color: amountColor(amount, "pay"),
      }
    )
  } else {
    drawCellText(doc, "-", cols.days, textY, cols.daysW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    drawCellText(doc, "-", cols.hrs, textY, cols.hrsW, rowHeight, {
      align: "right",
      size: 8,
      color: ZERO,
    })
    const amount = getPayAmount(field, value, lineAmounts)
    drawCellText(
      doc,
      formatSampleAmount(amount),
      cols.amount,
      textY,
      cols.amountW,
      rowHeight,
      {
        align: "right",
        size: 8,
        bold: true,
        color: amountColor(amount, "pay"),
      }
    )
  }

  if (deductionField) {
    const dedValue = rawFieldValue(inputs, deductionField)
    drawCellText(
      doc,
      deductionField.label,
      cols.dedItem,
      textY,
      cols.dedItemW,
      rowHeight,
      { size: 8, color: TEXT }
    )
    const hasDed = typeof dedValue === "number" && dedValue !== 0
    drawCellText(
      doc,
      hasDed ? formatSampleAmount(dedValue) : "-",
      cols.dedAmount,
      textY,
      cols.dedAmountW,
      rowHeight,
      {
        align: "right",
        size: 8,
        bold: hasDed,
        color: hasDed ? amountColor(dedValue, "deduction") : ZERO,
      }
    )
  }
}

function getColumnBounds(x: number) {
  const payItem = x
  const days = columnX(x, "payItem")
  const hrs = columnX(x, "payItem", "days")
  const amount = columnX(x, "payItem", "days", "hrs")
  const dedItem = columnX(x, "payItem", "days", "hrs", "amount")
  const dedAmount = columnX(x, "payItem", "days", "hrs", "amount", "dedItem")

  return {
    payItem,
    days,
    hrs,
    amount,
    dedItem,
    dedAmount,
    payItemW: CONTENT_WIDTH * COLUMN_WIDTHS.payItem,
    daysW: CONTENT_WIDTH * COLUMN_WIDTHS.days,
    hrsW: CONTENT_WIDTH * COLUMN_WIDTHS.hrs,
    amountW: CONTENT_WIDTH * COLUMN_WIDTHS.amount,
    dedItemW: CONTENT_WIDTH * COLUMN_WIDTHS.dedItem,
    dedAmountW: CONTENT_WIDTH * COLUMN_WIDTHS.dedAmount,
  }
}

function drawMainGrid({
  doc,
  data,
  inputs,
  lineAmounts,
  x,
  y,
  height,
}: {
  doc: PDFKit.PDFDocument
  data: PayslipPdfData
  inputs: PayslipPayrollInputs
  lineAmounts: Record<string, number>
  x: number
  y: number
  height: number
}) {
  const rowHeight = height / GRID_ROW_COUNT
  const cols = getColumnBounds(x)
  let rowY = y

  const headerY = rowTextY(rowY, rowHeight, 7.5)
  drawCellText(doc, "Pay Details", cols.payItem, headerY, cols.payItemW, rowHeight, {
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  drawCellText(doc, "Days", cols.days, headerY, cols.daysW, rowHeight, {
    align: "right",
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  drawCellText(doc, "Hrs", cols.hrs, headerY, cols.hrsW, rowHeight, {
    align: "right",
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  drawCellText(doc, "Amount", cols.amount, headerY, cols.amountW, rowHeight, {
    align: "right",
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  drawCellText(doc, "Deductions", cols.dedItem, headerY, cols.dedItemW, rowHeight, {
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  drawCellText(doc, "Amount", cols.dedAmount, headerY, cols.dedAmountW, rowHeight, {
    align: "right",
    bold: true,
    size: 7.5,
    color: TABLE_HEADER,
  })
  rowY += rowHeight

  for (const [index, field] of PAY_DETAILS_FIELDS.entries()) {
    drawPayRow({
      doc,
      field,
      inputs,
      lineAmounts,
      deductionField: DEDUCTION_FIELDS[index],
      x,
      y: rowY,
      rowHeight,
      cols,
    })
    rowY += rowHeight
  }

  const subtotalY = rowTextY(rowY, rowHeight, 8)
  drawCellText(
    doc,
    "TAXABLE EARNINGS",
    cols.payItem,
    subtotalY,
    cols.payItemW + cols.daysW + cols.hrsW,
    rowHeight,
    { bold: true, size: 8 }
  )
  drawCellText(
    doc,
    formatSampleAmount(data.totals.taxableEarnings),
    cols.amount,
    subtotalY,
    cols.amountW,
    rowHeight,
    {
      align: "right",
      bold: true,
      size: 8,
      color: amountColor(data.totals.taxableEarnings, "pay"),
    }
  )
  drawCellText(
    doc,
    "TOTAL DEDUCTIONS",
    cols.dedItem,
    subtotalY,
    cols.dedItemW,
    rowHeight,
    { bold: true, size: 8 }
  )
  drawCellText(
    doc,
    formatSampleAmount(data.totals.totalDeductions),
    cols.dedAmount,
    subtotalY,
    cols.dedAmountW,
    rowHeight,
    {
      align: "right",
      bold: true,
      size: 8,
      color: amountColor(data.totals.totalDeductions, "deduction"),
    }
  )
  rowY += rowHeight

  for (const field of NON_TAXABLE_FIELDS) {
    const textY = rowTextY(rowY, rowHeight, 8)
    const value = rawFieldValue(inputs, field)
    const adjLabel = getAdjLabel(field)

    drawCellText(doc, field.label, cols.payItem, textY, cols.payItemW, rowHeight, {
      size: 8,
    })
    drawCellText(doc, "-", cols.days, textY, cols.daysW, rowHeight, {
      align: "right",
      size: 8,
    })
    drawCellText(doc, "-", cols.hrs, textY, cols.hrsW, rowHeight, {
      align: "right",
      size: 8,
    })
    drawCellText(
      doc,
      typeof value === "number" ? formatSampleAmount(value) : "-",
      cols.amount,
      textY,
      cols.amountW,
      rowHeight,
      {
        align: "right",
        size: 8,
        bold: typeof value === "number" && value !== 0,
        color:
          typeof value === "number"
            ? amountColor(value, "nonTaxable")
            : ZERO,
      }
    )

    if (adjLabel) {
      drawCellText(doc, adjLabel, cols.dedItem, textY, cols.dedItemW, rowHeight, {
        size: 8,
        color: MUTED,
      })
      drawCellText(doc, "-", cols.dedAmount, textY, cols.dedAmountW, rowHeight, {
        align: "right",
        size: 8,
        color: ZERO,
      })
    }

    rowY += rowHeight
  }

  const nonTaxableTotalY = rowTextY(rowY, rowHeight, 8)
  drawCellText(
    doc,
    "NON-TAXABLE EARNINGS",
    cols.payItem,
    nonTaxableTotalY,
    cols.payItemW + cols.daysW + cols.hrsW,
    rowHeight,
    { bold: true, size: 8 }
  )
  drawCellText(
    doc,
    formatSampleAmount(data.totals.nonTaxableEarnings),
    cols.amount,
    nonTaxableTotalY,
    cols.amountW,
    rowHeight,
    {
      align: "right",
      bold: true,
      size: 8,
      color: amountColor(data.totals.nonTaxableEarnings, "nonTaxable"),
    }
  )
  rowY += rowHeight

  doc.rect(x, rowY, CONTENT_WIDTH, rowHeight).fill(TEAL)
  const summaryY = rowTextY(rowY, rowHeight, 8)
  drawCellText(doc, "GROSS PAY", cols.payItem, summaryY, cols.payItemW, rowHeight, {
    bold: true,
    size: 8,
    color: WHITE,
  })
  drawCellText(
    doc,
    formatSampleAmount(data.totals.grossPay),
    cols.amount,
    summaryY,
    cols.amountW,
    rowHeight,
    {
      align: "right",
      bold: true,
      size: 8,
      color: WHITE,
    }
  )
  drawCellText(doc, "NET PAY", cols.dedItem, summaryY, cols.dedItemW, rowHeight, {
    bold: true,
    size: 8,
    color: WHITE_MUTED,
  })
  drawCellText(
    doc,
    formatSampleAmount(data.totals.netPay),
    cols.dedAmount,
    summaryY,
    cols.dedAmountW,
    rowHeight,
    {
      align: "right",
      bold: true,
      size: 9,
      color: netPayColor(data.totals.netPay),
    }
  )
}

function drawSampleFooter(doc: PDFKit.PDFDocument, data: PayslipPdfData, y: number) {
  drawLabelValue(
    doc,
    "Payout Date:",
    formatDisplayDate(data.payoutDate),
    PAGE_MARGIN,
    y,
    CONTENT_WIDTH
  )
  drawText(doc, "HELPORT PHILIPPINES BRANCH OFFICE", PAGE_MARGIN, y + 14, {
    width: CONTENT_WIDTH,
    bold: true,
    size: 8,
  })
  drawText(
    doc,
    "Password-protected PDF generated from the employee payslip portal.",
    PAGE_MARGIN,
    y + 28,
    {
      width: CONTENT_WIDTH,
      size: 7,
      height: 10,
      lineBreak: false,
      ellipsis: true,
      color: MUTED,
    }
  )
}

export async function buildPasswordLockedPayslipPdf(
  data: PayslipPdfData,
  password: string
) {
  const doc = new PDFDocument({
    size: "LETTER",
    layout: "portrait",
    margin: 0,
    pdfVersion: "1.7ext3",
    userPassword: password,
    ownerPassword: crypto.randomUUID(),
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
    info: {
      Title: `Payslip - ${data.payrollPeriodLabel}`,
      Author: "Helport Payroll",
      Subject: `Payslip for ${data.employeeName}`,
    },
  })

  let cursorY = drawSampleHeader(doc, data, PAGE_MARGIN) + BLOCK_GAP

  const footerY = PAGE_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT
  const gridHeight = footerY - BLOCK_GAP - cursorY

  const calculation = calculatePayslipTotals(data.inputs, data.employeeDivisor)

  drawMainGrid({
    doc,
    data,
    inputs: data.inputs,
    lineAmounts: calculation.lineAmounts,
    x: PAGE_MARGIN,
    y: cursorY,
    height: gridHeight,
  })

  drawSampleFooter(doc, data, footerY)

  return collectPdf(doc)
}
