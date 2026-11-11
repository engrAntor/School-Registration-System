# Assumptions & Architectural Strategies

This document lists architectural assumptions, domain decisions, and distributed concurrency strategies made for the School Admission System.

---

## 1. Student Identity

- **Assumption**: The 17-digit Birth Registration Number (BRN) is entered once at the top of the page and persisted in `localStorage`. All subsequent API calls attach it via the `X-Student-Id` header.
- **Reasoning**: The spec states: *"No authentication/login is required"* and specifies the identity as the 17-digit birth registration number. Storing it in `localStorage` ensures that the user's session and student identity survive page refreshes (UI Rule #4).

## 2. Admin vs Student Distinction

- **Assumption**: There is no role-based distinction. Any user can create classes (admin action) and apply for classes (student action) using the same unified interface.
- **Reasoning**: The spec states: *"No authentication/login is required."* Without an authentication provider, roles cannot be distinguished. The "Create Class" button is available in the top navigation for seamless administrative access.

## 3. Create Class Does Not Require BRN

- **Assumption**: Creating a class is an administrative action and does not require an `X-Student-Id` header.
- **Reasoning**: The API contract for `POST /classes` does not mandate `X-Student-Id`. Only student-facing endpoints (`/classes/{classId}/holds`, `/holds/{holdId}/confirm`, `DELETE /holds/{holdId}`, and `/me/holds`) require the header.

## 4. Hold Duration Display & Auto-Expiration

- **Assumption**: The countdown timer on the Application Details page calculates remaining time from the backend-provided `expiresAt` ISO 8601 UTC timestamp. The timer auto-expires locally when it reaches zero without requiring a manual page refresh.
- **Reasoning**: Spec UI Rule #2 requires: *"When the timer reaches 0, the status must update automatically to EXPIRED without requiring a manual page reload."*

## 5. Seat Count Refresh Interval

- **Assumption**: Seat counts on the Class List page auto-refresh every 5 seconds.
- **Reasoning**: Spec UI Rule #3 requires: *"Seat counts on the class list page must update automatically every few seconds."* A 5-second polling interval using React Query (`refetchInterval: 5000`) provides real-time responsiveness with minimal server overhead.

## 6. Application Details Auto-Polling

- **Assumption**: The Application Details page polls the hold status every 10 seconds to remain in sync with backend state changes (e.g., if the backend marks a hold expired or cancelled).
- **Reasoning**: Ensures client-server synchronization while avoiding excessive API traffic.

## 7. ID Format

- **Assumption**: The backend assigns IDs prefixed by entity type (e.g., `c_xxx` for classes, `h_xxxxxx` for holds). The frontend treats IDs strictly as opaque strings.
- **Reasoning**: The specification states: *"IDs in examples are illustrative; you may choose any ID format."*

## 8. Frontend Port & Cross-Origin Configuration

- **Assumption**: The frontend runs on port 3000 in development and in Docker containers. The backend runs on port 8080 (or 8081 mapped on host). Full CORS is configured on the backend to accept requests from frontend origins.
- **Reasoning**: Port 3000 is standard for Next.js applications.

## 9. Error Display & User Feedback

- **Assumption**: All API errors are captured and displayed to the user as actionable toast notifications (via Sonner). Network disconnects display *"Cannot connect to the server."*
- **Reasoning**: Spec UI Rule #5 mandates clear, user-friendly error messages and strictly prohibits blank screens or silent console-only errors.

---

## 10. Distributed Concurrency Handling Strategy (Bonus Implementation)

### Problem Statement
In a distributed environment where multiple backend process instances run on separate ports/containers (e.g., Instance A on port 8080, Instance B on port 8081) sharing the same PostgreSQL database, simultaneous hold requests could result in a **race condition (check-then-act vulnerability)**:
1. Instance A reads available seats = 1.
2. Instance B reads available seats = 1.
3. Both instances permit the hold and write to the database.
4. Result: `(held + confirmed) > totalSeats` (overselling seats), violating core business rules.

### Our Strategy: Multi-Tiered Database-Enforced Concurrency Control

To guarantee mathematical safety across distributed nodes without requiring an external distributed lock manager (e.g., Redis Redlock), our architecture employs a two-tier strategy directly in PostgreSQL:

#### Tier 1: Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)
When `CreateHoldCommandHandler` invokes `HoldSeatSafelyAsync`:
1. An explicit database transaction is opened (`BeginTransactionAsync()`).
2. The specific `SchoolClass` record is locked using:
   ```sql
   SELECT * FROM "Classes" WHERE "Id" = @classId FOR UPDATE;
   ```
3. PostgreSQL acquires an exclusive row-level lock on that specific class record:
   - If Instance A holds the lock, Instance B's query blocks and waits at the database level until Instance A completes or rolls back its transaction.
   - While the row is locked, Instance A computes the active holds dynamically:
     ```sql
     SELECT COUNT(*) FROM "Holds" 
     WHERE "ClassId" = @classId 
       AND ("Status" = 1 OR ("Status" = 0 AND "ExpiresAt" > @now));
     ```
   - If `activeHoldsCount >= totalSeats`, the transaction throws a `DomainException` (mapping to HTTP `409 Conflict`) and rolls back.
   - Otherwise, the new `Hold` record is inserted, the transaction commits, and the row lock is released.

#### Tier 2: Partial Unique Index Constraint (Student Invariant Protection)
To prevent a single student from holding or confirming more than one seat in the same class across concurrent processes, a partial unique index is enforced at the database schema level (`AdmissionDbContext.OnModelCreating`):
```csharp
modelBuilder.Entity<Hold>()
    .HasIndex(h => new { h.StudentId, h.ClassId })
    .IsUnique()
    .HasFilter("\"Status\" IN (0, 1)"); // 0 = HELD, 1 = CONFIRMED
```
- If two concurrent requests for the same student bypass any application check, PostgreSQL rejects the second insertion with a unique constraint violation (`IX_Holds_StudentId_ClassId`).
- The backend catches `DbUpdateException`, translates it into a domain conflict error, and returns HTTP `409 Conflict`.

### Why This Guarantees `(held + confirmed) <= totalSeats`
- **ACID Transaction Isolation**: The seat check and hold creation happen inside a serialized transaction boundary guarded by `FOR UPDATE`.
- **Zero Race Window**: No other backend instance can read or modify the active hold count for that class until the current transaction finishes.
- **Process Agnostic**: It is completely independent of the number of running backend instances or threads.

---

## 11. Automated Frontend Testing (Bonus Implementation)

### Architecture & Framework
- **Test Framework**: Jest with `ts-jest` and `@testing-library/react` + `@testing-library/jest-dom`.
- **Environment**: `jest-environment-jsdom` simulating browser DOM, localStorage, and timers.

### Covered Scenarios
1. **BRN Validation & Persistence (`src/lib/storage.test.ts`)**:
   - Validates 17-digit numeric regex behavior (`isValidBrn`).
   - Verifies rejection of incomplete, over-length, and non-digit characters.
   - Verifies `localStorage` integration for student identity saving, retrieval, and clearing.

2. **Student Identity Component (`src/components/BrnInput.test.tsx`)**:
   - Renders input field with placeholder and user icon.
   - Enforces numeric-only input filtering (strips non-digits).
   - Enforces 17-character maximum length clamp.
   - Shows live counter for remaining digits when incomplete.
   - Auto-saves valid 17-digit BRN to `localStorage` upon completion.
   - Automatically rehydrates saved identity on initial mount.

3. **Countdown Timer & Expiration Component (`src/components/CountdownTimer.test.tsx`)**:
   - Correctly calculates and formats remaining time as `mm:ss`.
   - Progressively decrements second-by-second using mocked fake timers.
   - Automatically changes state to `EXPIRED` and executes `onExpired()` callback when time reaches zero.
   - Immediately renders `EXPIRED` if initialized with a past timestamp.

4. **UI Badges & Progress Visualization (`src/components/StatusAndSeatBadges.test.tsx`)**:
   - Verifies proper rendering and color variants for all hold states (`HELD`, `CONFIRMED`, `EXPIRED`, `CANCELLED`).
   - Verifies seat progress bar display for confirmed, held, and available counts.
