# Octalve Workspace

Production workspace for managing Octalve projects, clients, approvals, payments, wallet activity, delivery phases, team operations, and operational settings.

Live URL:

```txt
https://workspace.octalve.com
```

`console.octalve.cloud` is a separate Octalve Cloud console project and must not be used for Workspace validation.

## Production scope

Octalve Workspace supports:

- Role-based access for admin, staff/project managers, and clients
- Client project requests and project creation
- Database-managed delivery templates
- Project phases, deliverables, approval requests, and change requests
- Manual bank transfer, Paystack, Flutterwave, and wallet payments
- Client wallet funding and wallet ledger history
- Admin payment finance audit
- Admin wallet overview and wallet top-up audit details
- Notifications routed to the relevant project, payment, or wallet audit record
- Team, client, review, analytics, and system settings modules

## Run locally

```bash
pnpm install
pnpm dev
```

Default local URL:

```txt
http://localhost:3003
```

## Environment setup

```bash
cp .env.example .env
pnpm db:generate
pnpm dev
```

Production deployments must use the production PostgreSQL database and the live Workspace URL:

```txt
https://workspace.octalve.com
```

## Database

Prisma is configured through:

```txt
prisma/schema.prisma
prisma.config.ts
src/lib/prisma.ts
```

Production database updates are handled through the deployment workflow. Do not run local `db:push` against production unless the production database owner has explicitly approved it.

## Authentication

Authentication is powered by Better Auth and Prisma.

Important files:

```txt
src/lib/auth.ts
src/lib/auth-server.ts
src/lib/auth-client.ts
src/app/api/auth/[...all]/route.ts
```

## Finance routes

```txt
/client/payments
/client/payments/[paymentId]
/client/wallet
/admin/payments
/admin/payments/[paymentId]
/admin/wallet
/admin/wallet/[topUpId]
```

Finance API routes include:

```txt
/api/payments/[id]/methods
/api/payments/[id]/initialize
/api/payments/[id]/mark-paid
/api/payments/[id]/confirm
/api/payments/[id]/reject
/api/payments/paystack/verify
/api/payments/flutterwave/verify
/api/wallet
/api/wallet/topups/initialize
/api/wallet/topups/paystack/verify
/api/wallet/topups/flutterwave/verify
/api/admin/payments/[id]/finance-audit
/api/admin/wallet
/api/admin/wallet/[topUpId]
/api/webhooks/paystack
/api/webhooks/flutterwave
```

Gateway credentials must remain in server environment variables. Do not expose gateway secrets with `NEXT_PUBLIC_`.

## Production validation

Before closing a production batch, run:

```bash
pnpm db:generate
pnpm build
```

Then validate:

```txt
https://workspace.octalve.com/login
https://workspace.octalve.com/admin/wallet
https://workspace.octalve.com/admin/payments
https://workspace.octalve.com/client/wallet
https://workspace.octalve.com/client/payments
```

Protected routes should either load after authentication or redirect safely to `/login`. They must not return a `500` response.

## Logo

The current logo path is:

```txt
public/octalve-logo.svg
```
