# Octalve Suite Portal

Premium project delivery portal for Octalve Suite: admin, staff/project manager, and client experiences.

## What's new in this version

- Working create/edit/delete template modal
- Expand/collapse phases in every template card
- Working team add/edit/delete controls
- Working project card actions
- Working phase details route for admin with live phase thread
- Better icons using `lucide-react`
- Softer typography and lighter font weight
- Interactive analytics with Recharts
- Better Auth + Prisma + PostgreSQL scaffold
- Backend handoff documentation

## Run locally

```bash
pnpm install
pnpm dev
```

Open:

```txt
http://localhost:3000
```

## Demo access

Use the quick login buttons on the login screen:

- Client demo
- Staff demo
- Admin demo

The current UI still runs with localStorage/mock data so you can test immediately before the backend is connected.

## Backend setup

```bash
cp .env.example .env
pnpm db:generate
pnpm db:push
pnpm dev
```

The backend scaffold is prepared in:

```txt
prisma/schema.prisma
src/lib/prisma.ts
src/lib/auth.ts
src/lib/auth-client.ts
src/app/api/auth/[...all]/route.ts
BACKEND_HANDOFF.md
```

## Logo

Logo replacement placeholders are in:

```txt
src/components/portal/PortalShell.tsx
src/components/portal/AuthScreens.tsx
```

Replace:

```tsx
<div className="logo-mark">O</div>
```

with:

```tsx
<img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" />
```

Then place your logo in:

```txt
public/octalve-logo.svg
```

## Main routes

### Admin

```txt
/admin
/admin/projects
/admin/projects/new
/admin/projects/[projectId]
/admin/projects/[projectId]/phases/[phaseId]
/admin/project-requests
/admin/clients
/admin/templates
/admin/team
/admin/payments
/admin/analytics
/admin/reviews
/admin/settings
```

### Client

```txt
/client
/client/projects
/client/projects/new
/client/phases
/client/phases/[phaseId]
/client/approvals
/client/payments
/client/support
```

### Staff / Project Manager

```txt
/staff
/staff/projects
/staff/phases
/staff/phases/[phaseId]
/staff/messages
/staff/workload
/staff/settings
```

## Notes for next iteration

The app is structured so the backend developer can replace localStorage logic inside `src/components/portal/AppContext.tsx` with real API calls while keeping the UI intact.
