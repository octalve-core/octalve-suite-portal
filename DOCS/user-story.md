# Octalve Suite Portal - Non-Technical User Story

## 1. Overview
Octalve Suite Portal is a comprehensive, centralized platform for managing digital agency projects, from initial client inquiries to final project delivery. It streamlines communication, standardizes project execution through templates, and ensures financial milestones are met before work progresses. 

## 2. User Personas (Roles)
- **Client:** A customer who requests projects, makes payments, reviews deliverables, and approves phases.
- **Staff / Project Manager:** An agency employee responsible for executing tasks, uploading deliverables, communicating with clients, and pushing phases to approval.
- **Super Admin:** The agency owner or top-level administrator who oversees the entire pipeline, approves new leads, manages staff, configures templates, and confirms payments.

## 3. The Core User Journey

### Phase 1: Onboarding & Request
1. **Inquiry:** A prospective Client signs up and submits a **Project Request** (providing business details, goals, and timeline).
2. **AI Assistance:** An integrated AI Assistant reviews the client's raw request, structures it into a professional brief, and recommends one of the core Octalve packages (e.g., *Launch*, *Impact*, *Growth*, *Partner*, or *Custom*).
3. **Approval:** The Super Admin reviews the request. Upon approval, the system automatically spins up an active **Project**, populated with predefined phases and deliverables based on the selected package template.

### Phase 2: Kickoff & Deposit
1. **Invoice:** The Project is created in an "Awaiting Deposit" state.
2. **Payment:** The Client is notified to make a deposit payment. They review the bank details, make the transfer, and mark the invoice as "Paid" in the portal.
3. **Confirmation:** The Super Admin verifies the payment and confirms it, which automatically transitions the project to "Active" and unlocks the first phase.

### Phase 3: Project Execution & Phased Approvals
1. **Phases & Deliverables:** The project is broken down into sequential **Phases**. Only one phase is typically active at a time. Staff members work on the deliverables (e.g., design files, documents, web previews) for the active phase.
2. **In-Phase Communication:** Clients and Staff communicate contextually within a phase using the built-in messaging system.
3. **Review Cycle:** When deliverables are ready, the Project Manager marks the phase as "Awaiting Approval." 
4. **Client Action:** The Client is notified. They review the deliverables and can either:
   - **Request Changes:** Sending the phase back to "In Progress" with comments.
   - **Approve:** Locking the current phase as completed and automatically unlocking the next phase.

### Phase 4: Completion & Review
1. **Final Payment:** Before the final deliverables are released, the system may pause the project at an "Awaiting Balance" state. The Client makes the final payment, which the Admin confirms.
2. **Project Closure:** Once the final phase is approved, the project is marked as "Completed."
3. **Testimonial:** The Client is prompted to leave a star rating and review regarding their experience with the Octalve team.

## 4. Value Proposition
- **For Clients:** A transparent, single pane of glass to view project progress, centralize communications, and manage invoices without getting lost in email threads.
- **For the Agency (Octalve):** Automated guardrails (like locking phases until payment is made or previous phases are approved) prevent scope creep, ensure timely payments, and provide a standardized workflow via templates.
