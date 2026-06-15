export const EMPLOYEE_STATUSES = ["Active", "New Hire", "Re-active"] as const

export const POSITION_TITLES = [
  "Admin Assistant",
  "Agent - Debt Collection",
  "Assistant Team Leader (Interim)",
  "Customer Service Representative",
  "Frontline Customer Service Representative",
  "IT Support (Mid-Level)",
  "Jewelry Outreach",
  "Jr. IT Support",
  "Network Engineer",
  "Outbound Sales Agent",
  "QA Lead",
  "QA Specialist",
  "QA Specialist (Interim)",
  "Recruiter",
  "Reports Analyst",
  "Software Support Specialist",
  "Software Support Team Lead (Interim)",
  "Team Leader",
  "Team Leader (Interim)",
  "Team Leader (Local Debt Collection)",
  "Team Leader (Operations - BPO)",
  "Telesales Agent",
  "Trainer (Operations - BPO)",
  "Training Specialist",
  "WFM Lead",
] as const

export const DEPARTMENTS = [
  "Human Resource",
  "IT Department",
  "Operations - BPO (CHN)",
  "Operations - BPO (US)",
  "Operations - BPO (US) Logistics",
  "Operations - Local Debt Collection",
  "Software Support/Development",
] as const

export const PROGRAMS = [
  "AHL",
  "Aqua Strong",
  "BPO (CHN)",
  "BPO (US)",
  "BPO (US) Logistics",
  "Dreame",
  "GMCC",
  "Hankoko",
  "Human Resource",
  "IT Department",
  "Lendsure",
  "Local Debt Collection",
  "Next Chapter",
  "Operations - BPO (US)",
  "Software Support/Development",
  "SOLA United",
] as const

export const ACCOUNTS = [
  "Admin Department",
  "Akulaku (Agent Cost)",
  "Aqua Strong (Admin Cost)",
  "Aqua Strong (Agent Cost)",
  "Atome (Agent Cost)",
  "Atome (QA) - Admin Cost",
  "Atome (SMS) - Admin Cost",
  "Atome (TL) - Admin Cost",
  "Atome (Training) - Admin Cost",
  "BPO (US) (Agent Cost)",
  "BPO (US) Admin Cost",
  "Dreame (Agent Cost)",
  "Dreame Tech (Agent Cost)",
  "Floater",
  "Hankoko (Agent Cost)",
  "Human Resource",
  "IT Department",
  "Logistics",
  "Logistics (Admin Cost)",
  "Logistics (Agent Cost)",
  "Next Chapter (Agent Cost)",
  "Recruitment",
  "Software Support/Development",
] as const

export const EMPLOYEE_DIVISORS = [261, 313] as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]
export type PositionTitle = (typeof POSITION_TITLES)[number]
export type Department = (typeof DEPARTMENTS)[number]
export type Program = (typeof PROGRAMS)[number]
export type Account = (typeof ACCOUNTS)[number]
export type EmployeeDivisor = (typeof EMPLOYEE_DIVISORS)[number]

export function isEmployeeOption<T extends readonly string[]>(
  value: string,
  options: T
): value is T[number] {
  return options.includes(value)
}

export function isEmployeeDivisor(value: number): value is EmployeeDivisor {
  return EMPLOYEE_DIVISORS.includes(value as EmployeeDivisor)
}
