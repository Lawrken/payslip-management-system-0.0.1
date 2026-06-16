# Payslip Management System

Next.js payroll and payslip management app with shadcn/ui.

## Database (Neon + Vercel)

Use a **pooled** Neon connection string for runtime (`DATABASE_URL` in Vercel). The hostname usually includes `-pooler`.

- Runtime (`DATABASE_URL`): pooled endpoint — used by the Next.js app
- Migrations (`drizzle-kit migrate`): use a **direct** (non-pooler) URL locally or in CI

The app configures `postgres-js` for serverless with `prepare: false`, `max: 1`, and short idle timeouts to avoid exhausting Neon free-tier connections.

After pulling schema changes, run:

```bash
pnpm db:migrate
```

To backfill schedule completeness flags for existing rows (after adding `is_complete`):

```bash
tsx -r tsconfig-paths/register scripts/backfill-schedule-complete.ts
```

## Development

```bash
pnpm install
pnpm dev
```

## Adding components

```bash
npx shadcn@latest add button
```
