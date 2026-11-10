// ============================================================================
// LocalStorage helpers for student identity (BRN)
// ============================================================================

const STUDENT_ID_KEY = "school_admission_student_id";

export function getStudentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STUDENT_ID_KEY);
}

export function setStudentId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENT_ID_KEY, id);
}

export function clearStudentId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STUDENT_ID_KEY);
}

/** Validate that a BRN is exactly 17 digits */
export function isValidBrn(brn: string): boolean {
  return /^\d{17}$/.test(brn);
}
