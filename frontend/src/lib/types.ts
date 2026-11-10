// ============================================================================
// School Admission System — TypeScript Types
// Matches API contracts from the assignment specification exactly
// ============================================================================

/** Status values for an application hold */
export type HoldStatus = "HELD" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

/** A class (shift) with seat information — GET /classes and GET /classes/{classId} */
export interface SchoolClass {
  id: string;
  name: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

/** Request body for POST /classes */
export interface CreateClassRequest {
  name: string;
  totalSeats: number;
}

/** Response from POST /classes */
export interface CreateClassResponse {
  id: string;
  name: string;
  totalSeats: number;
}

/** Response from POST /classes/{classId}/holds */
export interface HoldResponse {
  holdId: string;
  classId: string;
  studentId: string;
  status: HoldStatus;
  expiresAt: string;
}

/** Response from GET /holds/{holdId} */
export interface HoldDetail {
  holdId: string;
  classId: string;
  status: HoldStatus;
  expiresAt: string;
}

/** Response from POST /holds/{holdId}/confirm */
export interface ConfirmResponse {
  holdId: string;
  status: "CONFIRMED";
}

/** Item in the array from GET /me/holds */
export interface MyHold {
  holdId: string;
  classId: string;
  className: string;
  status: HoldStatus;
  expiresAt: string;
}

/** API error shape */
export interface ApiError {
  message: string;
  statusCode?: number;
}

