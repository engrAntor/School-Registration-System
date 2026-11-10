// ============================================================================
// API Client — Axios instance + typed functions for all 8 API endpoints
// Backend URL from NEXT_PUBLIC_API_URL env var (default: http://localhost:8080)
// Student identity passed via X-Student-Id header
// ============================================================================

import axios, { AxiosError } from "axios";
import type {
  SchoolClass,
  CreateClassRequest,
  CreateClassResponse,
  HoldResponse,
  HoldDetail,
  ConfirmResponse,
  MyHold,
} from "./types";
import { getStudentId } from "./storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach X-Student-Id header from localStorage on every request
api.interceptors.request.use((config) => {
  const studentId = getStudentId();
  if (studentId) {
    config.headers["X-Student-Id"] = studentId;
  }
  return config;
});

/** Extract a user-friendly error message from any error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string; error?: string; title?: string }>;
    if (axiosErr.response?.data) {
      const d = axiosErr.response.data;
      return d.message || d.error || d.title || `Error ${axiosErr.response.status}`;
    }
    if (axiosErr.code === "ERR_NETWORK") {
      return "Cannot connect to the server. Please ensure the backend is running.";
    }
    return axiosErr.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

// ─── 1. POST /classes ─────────────────────────────────────────────────────────
export async function createClass(data: CreateClassRequest): Promise<CreateClassResponse> {
  const res = await api.post<CreateClassResponse>("/classes", data);
  return res.data;
}

// ─── 2. GET /classes ──────────────────────────────────────────────────────────
export async function listClasses(): Promise<SchoolClass[]> {
  const res = await api.get<SchoolClass[]>("/classes");
  return res.data;
}

// ─── 3. GET /classes/{classId} ────────────────────────────────────────────────
export async function getClass(classId: string): Promise<SchoolClass> {
  const res = await api.get<SchoolClass>(`/classes/${classId}`);
  return res.data;
}

// ─── 4. POST /classes/{classId}/holds ─────────────────────────────────────────
export async function createHold(classId: string): Promise<HoldResponse> {
  const res = await api.post<HoldResponse>(`/classes/${classId}/holds`);
  return res.data;
}

// ─── 5. GET /holds/{holdId} ───────────────────────────────────────────────────
export async function getHold(holdId: string): Promise<HoldDetail> {
  const res = await api.get<HoldDetail>(`/holds/${holdId}`);
  return res.data;
}

// ─── 6. POST /holds/{holdId}/confirm ──────────────────────────────────────────
export async function confirmHold(holdId: string): Promise<ConfirmResponse> {
  const res = await api.post<ConfirmResponse>(`/holds/${holdId}/confirm`);
  return res.data;
}

// ─── 7. DELETE /holds/{holdId} ────────────────────────────────────────────────
export async function cancelHold(holdId: string): Promise<void> {
  await api.delete(`/holds/${holdId}`);
}

// ─── 8. GET /me/holds ─────────────────────────────────────────────────────────
export async function getMyHolds(): Promise<MyHold[]> {
  const res = await api.get<MyHold[]>("/me/holds");
  return res.data;
}
