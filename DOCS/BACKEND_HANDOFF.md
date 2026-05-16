# Octalve Suite Backend Handoff

This project now includes a production-ready backend scaffold while keeping the frontend demo usable with local mock state.

## Stack prepared

- Next.js App Router
- Better Auth for authentication
- Prisma ORM
- PostgreSQL datasource in `prisma/schema.prisma`
- Manual payment workflow models
- Project request, project, template, phase, deliverable, message, review, and payment models

Better Auth requires a database and supports adapters such as Prisma. The included setup follows the Better Auth Next.js route pattern with `/api/auth/[...all]` and the Prisma adapter.

## Setup commands

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

For production, replace `DATABASE_URL`, `BETTER_AUTH_SECRET`, and the bank details in `.env`.

## Important files

```txt
prisma/schema.prisma
src/lib/prisma.ts
src/lib/auth.ts
src/lib/auth-client.ts
src/app/api/auth/[...all]/route.ts
src/components/portal/AppContext.tsx
src/lib/types.ts
src/lib/seed.ts
```

## Backend integration plan

The frontend currently uses `AppContext.tsx` and localStorage so the UI can run immediately. The backend developer should replace local operations with API calls in this order:

1. Auth/session: connect login/signup to Better Auth.
2. Client project request: `POST /api/client/project-requests`.
3. Admin request approval: `POST /api/admin/project-requests/:id/approve`.
4. Manual payments: mark paid, confirm, reject.
5. Phase workflow: assign phase, add deliverable, request approval, approve phase, request changes.
6. Phase messages: send/read messages in real time or near-real time.
7. Reviews: create review after project completion.
8. Analytics: calculate from database instead of mock state.

## Suggested API contract

### Auth

```txt
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
POST /api/auth/sign-out
GET  /api/auth/get-session
```

### Project requests

```txt
GET  /api/admin/project-requests
POST /api/client/project-requests
POST /api/admin/project-requests/:id/approve
POST /api/admin/project-requests/:id/reject
POST /api/admin/project-requests/:id/request-info
```

### Projects

```txt
GET    /api/projects
POST   /api/admin/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### Templates

```txt
GET    /api/templates
POST   /api/templates
PATCH  /api/templates/:id
DELETE /api/templates/:id
```

### Phases

```txt
PATCH /api/phases/:id/assign
POST  /api/phases/:id/deliverables
POST  /api/phases/:id/request-approval
POST  /api/phases/:id/approve
POST  /api/phases/:id/request-changes
POST  /api/phases/:id/messages
```

### Payments

```txt
GET  /api/payments
POST /api/payments/:id/mark-paid
POST /api/admin/payments/:id/confirm
POST /api/admin/payments/:id/reject
```

## Workflow rules the backend must enforce

- A client can own multiple projects.
- Client-created projects start as `PENDING_REVIEW`.
- Admin approval creates a project and payment records.
- Project phases do not open until deposit is confirmed.
- Only one active phase should normally be open at a time.
- A phase moves to `AWAITING_APPROVAL` when PM/admin requests client approval.
- Client approval unlocks the next phase.
- The final phase is locked until balance payment is confirmed.
- All phase messages are shared between client, assigned staff, PM, and admin.
- Staff can add deliverables but PM/admin should request client approval.
- Draft deliverables should not be client-visible unless marked ready.

## AI integration points

The current AI helper is local/demo logic in `src/lib/ai.ts`. For real AI later, replace it with server-side calls:

- AI package recommendation
- AI brief cleaner
- AI phase/deliverable generator
- AI project summary
- AI risk detection
- AI support assistant

Do AI calls server-side only. Never expose provider API keys to the browser.
