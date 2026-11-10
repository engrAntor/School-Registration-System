# Assumptions

This document lists assumptions made where the specification was ambiguous or unspecified.

## 1. Student Identity

- **Assumption**: The 17-digit Birth Registration Number (BRN) is entered once at the top of the page and persisted in `localStorage`. All subsequent API calls attach it via the `X-Student-Id` header.
- **Reasoning**: The spec says "No authentication/login is required" and the identity is the BRN. Using localStorage ensures the identity survives page refreshes (UI Rule #4).

## 2. Admin vs Student Distinction

- **Assumption**: There is no role-based distinction. Any user can create classes (admin action) and apply for classes (student action) using the same interface.
- **Reasoning**: The spec states "No authentication/login is required." Since there is no login, there is no way to distinguish admins from students. The "Create Class" action is simply available to everyone through the UI.

## 3. Create Class Does Not Require BRN

- **Assumption**: Creating a class is a school admin action and does not require a student identity (X-Student-Id header).
- **Reasoning**: The API contract for `POST /classes` does not mention the `X-Student-Id` header. Only student-facing endpoints (holds, confirm, cancel, my-holds) require it.

## 4. Hold Duration Display

- **Assumption**: The countdown timer on the Application Details page shows the remaining time based on the `expiresAt` timestamp from the backend. The timer auto-expires in the UI when it reaches zero without requiring a page reload.
- **Reasoning**: Spec UI Rule #2 requires automatic status update to EXPIRED without manual page reload.

## 5. Seat Count Refresh Interval

- **Assumption**: Seat counts on the Class List page auto-refresh every 5 seconds.
- **Reasoning**: Spec UI Rule #3 says "must update automatically every few seconds." Five seconds provides a good balance between responsiveness and server load.

## 6. Application Details Auto-Polling

- **Assumption**: The Application Details page polls the hold status every 10 seconds to stay in sync with backend state changes (e.g., if the backend expires a hold).
- **Reasoning**: Keeps the UI in sync while avoiding excessive API calls.

## 7. ID Format

- **Assumption**: The backend determines the ID format for classes (`id`) and holds (`holdId`). The frontend treats these as opaque strings.
- **Reasoning**: The spec says "IDs in examples are illustrative; you may choose any ID format."

## 8. Frontend Port

- **Assumption**: The frontend runs on port 3000 in development and in Docker.
- **Reasoning**: Standard Next.js default port. The spec only mandates the backend on port 8080.

## 9. Error Display

- **Assumption**: All API errors are displayed as toast notifications with user-friendly messages. Network errors show "Cannot connect to the server."
- **Reasoning**: Spec UI Rule #5 requires "user-friendly error messages" and prohibits "blank screens or console-only errors."

## 10. Concurrent Seat Allocation

- **Assumption**: The backend is solely responsible for enforcing the rule that `(held + confirmed) ≤ totalSeats`. The frontend trusts the backend's response and displays a "No Seats Available" message when `availableSeats` is 0, or shows the 409 Conflict error.
- **Reasoning**: Concurrency control must be handled server-side. The frontend's role is to present accurate data and handle error responses gracefully.

