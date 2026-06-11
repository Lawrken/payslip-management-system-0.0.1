import { readFile } from "node:fs/promises"
import path from "node:path"

import { google, type gmail_v1 } from "googleapis"

import {
  DEDUCTION_FIELDS,
  NON_TAXABLE_FIELDS,
  PAY_DETAILS_FIELDS,
  type PayslipFieldDefinition,
} from "@/lib/payslip-fields"
import { calculatePayslipTotals } from "@/lib/payroll-calculator"
import { formatDisplayDate, formatDtrCutOffRange } from "@/lib/payroll-dates"
import type { PayslipEmailData, PayslipPayrollInputs } from "@/lib/types"

const TEMPLATE_PATH = path.join(process.cwd(), "emails", "payslip.html")
const DEFAULT_SEND_DELAY_MS = 3000

let gmailClient: gmail_v1.Gmail | undefined
let template: string | undefined

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required to send payslip emails.`)
  }
  return value
}

function getGmailClient() {
  if (!gmailClient) {
    const auth = new google.auth.OAuth2(
      getRequiredEnv("GMAIL_CLIENT_ID"),
      getRequiredEnv("GMAIL_CLIENT_SECRET")
    )
    auth.setCredentials({
      refresh_token: getRequiredEnv("GMAIL_REFRESH_TOKEN"),
    })
    gmailClient = google.gmail({ version: "v1", auth })
  }
  return gmailClient
}

async function getTemplate() {
  template ??= await readFile(TEMPLATE_PATH, "utf8")
  return template
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatNumber(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function replacePlaceholder(html: string, key: string, value: string) {
  const escaped = escapeHtml(value)
  return html
    .replace(new RegExp(`<!--\\s*{{${key}}}\\s*-->\\s*[^<]*`, "g"), escaped)
    .replaceAll(`{{${key}}}`, escaped)
}

function replaceMarkedTable(html: string, marker: string, tableHtml: string) {
  const markerIndex = html.indexOf(marker)
  if (markerIndex < 0) {
    return html
  }

  const tableStart = html.indexOf("<table", markerIndex + marker.length)
  if (tableStart < 0) {
    return html
  }

  const tableTokenPattern = /<\/?table\b/gi
  tableTokenPattern.lastIndex = tableStart
  let depth = 0
  let tableEnd = -1

  for (const match of html.matchAll(tableTokenPattern)) {
    if (match.index < tableStart) {
      continue
    }

    if (match[0].startsWith("</")) {
      depth -= 1
      if (depth === 0) {
        tableEnd = html.indexOf(">", match.index) + 1
        break
      }
    } else {
      depth += 1
    }
  }

  if (tableEnd <= tableStart) {
    return html
  }

  return `${html.slice(0, markerIndex)}${tableHtml}${html.slice(tableEnd)}`
}

function buildTextBody(data: PayslipEmailData) {
  return [
    `Payslip for ${data.employeeName} (${data.employeeId})`,
    `Payroll period: ${data.payrollPeriodLabel}`,
    `DTR cut-off: ${formatDtrCutOffRange(data.dtrCutOffStart, data.dtrCutOffEnd)}`,
    `Payout date: ${formatDisplayDate(data.payoutDate)}`,
    `Gross pay: ${formatCurrency(data.totals.grossPay)}`,
    `Deductions: ${formatCurrency(data.totals.totalDeductions)}`,
    `Net pay: ${formatCurrency(data.totals.netPay)}`,
  ].join("\n")
}

function fieldValue(
  inputs: PayslipPayrollInputs,
  field: PayslipFieldDefinition
) {
  return inputs[field.key as keyof PayslipPayrollInputs] ?? 0
}

function renderMutedCell(content = "-") {
  return `<td align="right" style="padding: 8px; color: #d6d3d1">${content}</td>`
}

function renderPayDetailsTable(data: PayslipEmailData) {
  const calculation = calculatePayslipTotals(data.inputs, data.employeeDivisor)
  const rows = PAY_DETAILS_FIELDS.flatMap((field) => {
    const value = fieldValue(data.inputs, field)
    const amount = calculation.lineAmounts[field.key] ?? 0
    if (value <= 0 && amount === 0) {
      return []
    }

    const days =
      field.inputKind === "days"
        ? `<td align="right" style="padding: 8px; color: #44403c">${formatNumber(value)}</td>`
        : renderMutedCell()
    const hours =
      field.inputKind === "hours"
        ? `<td align="right" style="padding: 8px; color: #44403c">${formatNumber(value)}</td>`
        : renderMutedCell()
    const amountCell =
      amount !== 0 || field.inputKind === "peso"
        ? `<td align="right" style="padding: 8px 0; font-weight: 500; color: ${amount < 0 ? "#c2410c" : "#0d9488"}">${formatCurrency(amount)}</td>`
        : `<td align="right" style="padding: 8px 0; color: #d6d3d1">-</td>`

    return [
      `<tr><td style="padding: 8px 0; color: #44403c">${escapeHtml(field.label)}</td>${days}${hours}${amountCell}</tr>`,
    ]
  })

  if (rows.length === 0) {
    rows.push(
      `<tr><td colspan="4" style="padding: 8px 0; color: #78716c">No pay details entered.</td></tr>`
    )
  }

  return `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 13px">
                        <tr>
                          <td style="padding: 0 0 10px; color: #a8a29e; font-size: 11px">Item</td>
                          <td align="right" style="padding: 0 8px 10px; color: #a8a29e; font-size: 11px">Days</td>
                          <td align="right" style="padding: 0 8px 10px; color: #a8a29e; font-size: 11px">Hrs</td>
                          <td align="right" style="padding: 0 0 10px; color: #a8a29e; font-size: 11px">Amount</td>
                        </tr>
                        ${rows.join("\n")}
                        <tr>
                          <td colspan="3" style="padding: 14px 0 6px; color: #78716c">Taxable earnings</td>
                          <td align="right" style="padding: 14px 0 6px; font-weight: 600; color: #1c1917">${formatCurrency(data.totals.taxableEarnings)}</td>
                        </tr>
                      </table>`
}

function renderDeductionTable(data: PayslipEmailData) {
  const rows = DEDUCTION_FIELDS.flatMap((field) => {
    const value = fieldValue(data.inputs, field)
    if (value <= 0) {
      return []
    }
    return [
      `<tr><td style="padding: 8px 0; color: #44403c">${escapeHtml(field.label)}</td><td align="right" style="padding: 8px 0; font-weight: 500; color: #c2410c">${formatCurrency(value)}</td></tr>`,
    ]
  })

  if (rows.length === 0) {
    rows.push(
      `<tr><td colspan="2" style="padding: 8px 0; color: #78716c">No deductions entered.</td></tr>`
    )
  }

  return `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 13px">
                        <tr>
                          <td style="padding: 0 0 10px; color: #a8a29e; font-size: 11px">Item</td>
                          <td align="right" style="padding: 0 0 10px; color: #a8a29e; font-size: 11px">Amount</td>
                        </tr>
                        ${rows.join("\n")}
                        <tr>
                          <td style="padding: 14px 0 6px; color: #78716c">Total</td>
                          <td align="right" style="padding: 14px 0 6px; font-weight: 600; color: #1c1917">${formatCurrency(data.totals.totalDeductions)}</td>
                        </tr>
                      </table>`
}

function renderNonTaxableItems(data: PayslipEmailData) {
  const items = NON_TAXABLE_FIELDS.flatMap((field) => {
    const value = fieldValue(data.inputs, field)
    if (value <= 0) {
      return []
    }
    return [
      `<td width="50%" style="padding: 0 4px 8px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f8f7; border-radius: 10px">
          <tr>
            <td style="padding: 12px 14px">
              <p style="margin: 0; font-size: 11px; color: #78716c">${escapeHtml(field.label)}</p>
              <p style="margin: 4px 0 0; font-size: 13px; font-weight: 500; color: #1c1917">${formatCurrency(value)}</p>
            </td>
          </tr>
        </table>
      </td>`,
    ]
  })

  const rows =
    items.length > 0
      ? Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => {
          const first = items[index * 2]
          const second =
            items[index * 2 + 1] ??
            `<td width="50%" style="padding: 0 0 8px 4px">&nbsp;</td>`
          return `<tr>${first}${second}</tr>`
        }).join("\n")
      : `<tr><td style="padding: 8px 0; color: #78716c">No non-taxable earnings entered.</td></tr>`

  return `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        ${rows}
                      </table>`
}

async function renderPayslipEmail(data: PayslipEmailData) {
  const appUrl = getRequiredEnv("APP_URL").replace(/\/$/, "")
  let html = await getTemplate()
  const replacements = {
    appUrl,
    employeeName: data.employeeName,
    employeeId: data.employeeId,
    employeeEmail: data.employeeEmail,
    payrollPeriodLabel: data.payrollPeriodLabel,
    dtrCutOffRange: formatDtrCutOffRange(
      data.dtrCutOffStart,
      data.dtrCutOffEnd
    ),
    payoutDate: formatDisplayDate(data.payoutDate),
    tin: data.tin,
    sssNo: data.sssNo,
    phicNo: data.phicNo,
    hdmfNo: data.hdmfNo,
    taxableEarnings: formatCurrency(data.totals.taxableEarnings),
    totalDeductions: formatCurrency(data.totals.totalDeductions),
    nonTaxableEarnings: formatCurrency(data.totals.nonTaxableEarnings),
    grossPay: formatCurrency(data.totals.grossPay),
    netPay: formatCurrency(data.totals.netPay),
  }

  html = html.replaceAll("../public/helport.png", `${appUrl}/helport.png`)
  for (const [key, value] of Object.entries(replacements)) {
    html = replacePlaceholder(html, key, value)
  }

  html = replaceMarkedTable(
    html,
    "<!-- PAY_DETAILS_ROWS -->",
    renderPayDetailsTable(data)
  )
  html = replaceMarkedTable(
    html,
    "<!-- DEDUCTION_ROWS -->",
    renderDeductionTable(data)
  )
  html = replaceMarkedTable(
    html,
    "<!-- NON_TAXABLE_ITEMS -->",
    renderNonTaxableItems(data)
  )

  return {
    subject: `Payslip - ${data.payrollPeriodLabel} - Payout ${formatDisplayDate(data.payoutDate)}`,
    html,
    text: buildTextBody(data),
  }
}

function getSendDelayMs() {
  const raw = process.env.GMAIL_SEND_DELAY_MS?.trim()
  if (!raw) {
    return DEFAULT_SEND_DELAY_MS
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_SEND_DELAY_MS
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim()
}

function escapeAddressName(value: string) {
  return stripHeaderValue(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(stripHeaderValue(value), "utf8").toString("base64")}?=`
}

function formatAddress(name: string, email: string) {
  return `${encodeHeader(escapeAddressName(name))} <${stripHeaderValue(email)}>`
}

function encodeMimePart(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trim()
}

function encodeRawMessage(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

async function buildRawMessage(data: PayslipEmailData) {
  if (!data.employeeEmail.trim()) {
    throw new Error(
      `${data.employeeName} (${data.employeeId}) has no email address.`
    )
  }

  const rendered = await renderPayslipEmail(data)
  const senderEmail = getRequiredEnv("GMAIL_SENDER_EMAIL")
  const senderName = process.env.GMAIL_SENDER_NAME?.trim() || "Helport Payroll"
  const boundary = `payslip-${data.id}-${crypto.randomUUID()}`

  const message = [
    `From: ${formatAddress(senderName, senderEmail)}`,
    `To: ${formatAddress(data.employeeName, data.employeeEmail)}`,
    `Subject: ${encodeHeader(rendered.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${data.id}.${Date.now()}@payslip.local>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimePart(rendered.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimePart(rendered.html),
    `--${boundary}--`,
    "",
  ].join("\r\n")

  return encodeRawMessage(message)
}

export async function sendPayslipEmail(data: PayslipEmailData) {
  const response = await getGmailClient().users.messages.send({
    userId: "me",
    requestBody: {
      raw: await buildRawMessage(data),
    },
  })
  return response
}

export async function sendPayslipEmailBatch(data: PayslipEmailData[]) {
  getGmailClient()
  getRequiredEnv("GMAIL_SENDER_EMAIL")

  const sent: PayslipEmailData[] = []
  const failed: { payslip: PayslipEmailData; error: string }[] = []
  const delayMs = getSendDelayMs()

  for (const [index, payslip] of data.entries()) {
    try {
      await sendPayslipEmail(payslip)
      sent.push(payslip)
    } catch (error) {
      failed.push({
        payslip,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send payslip email.",
      })
    }

    if (delayMs > 0 && index < data.length - 1) {
      await delay(delayMs)
    }
  }

  return { sent, failed }
}
