# Octalve Suite Portal - Technical User Story

## 1. System Architecture & Tech Stack
The application is a modern, server-rendered React web application utilizing a robust full-stack architecture.

- **Framework:** Next.js 16 (App Router) for hybrid server/client rendering and API routes.
- **Language:** TypeScript for end-to-end type safety.
- **Database:** PostgreSQL.
- **ORM:** Prisma Client (v7.8) with `@prisma/adapter-pg` for database operations and schema management.
- **Authentication:** `better-auth` handling secure user sessions, role-based access control (RBAC), and impersonation capabilities.
- **Styling:** Custom CSS (`globals.css`) using modern CSS variables for theming, completely bypassing utility-first frameworks like Tailwind for a bespoke design language.
- **UI Libraries:** `lucide-react` for iconography, `recharts` for admin analytics dashboards.

## 2. Database Schema & Domain Model
The Prisma schema (`schema.prisma`) defines a highly relational data model tailored for project management and phased delivery.

### Core Entities
- **User:** Extended with `Role` enum (`CLIENT`, `STAFF`, `PROJECT_MANAGER`, `SUPER_ADMIN`). Handles traditional auth relations (`Session`, `Account`) via Better-Auth.
- **ProjectTemplate & TemplatePhase:** Allows admins to define reusable blueprints (e.g., "Launch Suite", "Growth Suite") containing predefined phases and deliverables.
- **ProjectRequest:** The entry point for new leads. Tracks the client's initial brief and AI recommendations. Transitions into a `Project` upon admin approval.
- **Project:** The main operational entity. Tracks high-level financials (`totalAmount`, `depositAmount`, `balanceAmount`) and overall `ProjectStatus` (e.g., `APPROVED_AWAITING_DEPOSIT`, `ACTIVE`, `COMPLETED`).
- **ProjectPhase:** Belongs to a Project. Governed by a strict state machine `PhaseStatus` (`LOCKED` -> `IN_PROGRESS` -> `AWAITING_APPROVAL` -> `APPROVED`). Phases dictate the current blocker in the project lifecycle.
- **Deliverable:** The granular output within a Phase. Has internal statuses (`DRAFT`, `READY_FOR_REVIEW`) and visibility toggles (`visibleToClient`).
- **PhaseMessage:** Enables real-time-like communication scoped to a specific `ProjectPhase`.
- **ProjectPayment:** Tracks discrete invoices (`DEPOSIT` or `BALANCE`), including client claims of payment and admin confirmations.
- **Review:** Collects post-project feedback.

## 3. Application Structure & Routing
Next.js App Router is used to segment the application by role, ensuring clear separation of concerns and layout structures.

- `src/app/admin/*`: Super Admin dashboard, client management, template configuration, payment confirmation, and analytics.
- `src/app/client/*`: Client-facing views for phase tracking, deliverable approval, messaging, and payment submission.
- `src/app/staff/*`: Internal dashboards for workload management, deliverable uploads, and phase messaging.
- `src/components/portal/PortalShell.tsx`: A robust, role-aware layout wrapper that dynamically generates sidebars, manages global navigation state, and aggregates notifications (e.g., pending approvals or payments) based on the user's role.

## 4. Key Technical Workflows

### 4.1 State Machine & Automation
The progression of a project is highly automated based on domain events:
- **Payment Event:** When a `ProjectPayment` (type: DEPOSIT) is marked `CONFIRMED` by an admin, the `Project` status updates to `ACTIVE`, and Phase 1's status shifts from `LOCKED` to `IN_PROGRESS`.
- **Approval Event:** When a Client approves a `ProjectPhase`, the system automatically locates the next phase in the sequence and unlocks it. If it's the final phase, it may trigger an `AWAITING_BALANCE` state on the project.

### 4.2 AI Integration Layer
The system includes an AI utility layer (`src/lib/ai.ts`) designed to act as an assistant:
- **Brief Refinement:** Parses raw user input to structure professional project briefs.
- **Package Routing:** Uses heuristic checks (and future NLP capabilities) to map client goals to the appropriate `PackageType`.
- **Contextual Help:** A chatbot widget (`AIAssistant.tsx`) provides role-aware answers about system mechanics (e.g., how to approve a phase, how payments are handled).

### 4.3 Component Architecture
The application uses a "Screens" approach for complex, role-specific views rather than highly nested files:
- `AdminScreens.tsx` (70kb+): Contains the heavy data-tables, project management modals, and template editors.
- `ClientScreens.tsx` (45kb+): Contains the consumer-grade UI for phase viewing and approval interactions.
- `AppContext.tsx`: A React Context provider that hydrates the shell with real-time project state, pending tasks, and the current user session, heavily reducing prop-drilling across the monolithic screen components.

## 5. Security & Access Control
- **Route Protection:** Handled via Next.js middleware and `better-auth` server-side validation to ensure boundary enforcement (e.g., a `CLIENT` cannot access `/admin`).
- **Data Scoping:** Database queries (via Prisma) implicitly filter records based on the user's ID and Role. Clients only see their own `Project` records; Staff only see `ProjectPhase` records assigned to them.
- **Impersonation:** The `Session` model includes an `impersonatedBy` field, indicating the Better-Auth admin plugin is utilized to allow Super Admins to log in as Clients for troubleshooting.
