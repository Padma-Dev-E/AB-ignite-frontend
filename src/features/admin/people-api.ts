import { apiFetch } from "../../lib/api/client";
import type { AdminUser } from "./types";

export type AdminUserSession = {
  id: number;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  revokedAt: string | null;
  sessionVersion: number;
  isActive: boolean;
};

export const peopleQueryKeys = {
  users: ["admin", "people", "users"] as const,
  search: (query: string) => ["admin", "people", "users", "search", query] as const,
  sessions: (userId: number) => ["admin", "people", "users", userId, "sessions"] as const,
};

export function listPeople(after: number | null = null, search = "") {
  const params = new URLSearchParams({ limit: "10" });
  if (after !== null) params.set("after", String(after));
  if (search.trim()) params.set("q", search.trim());
  return apiFetch<{ items: AdminUser[]; nextAfter: number | null }>(`/api/admin/users?${params}`);
}

export function listPersonSessions(userId: number) {
  return apiFetch<{ items: AdminUserSession[]; nextAfter: number | null }>(`/api/admin/users/${userId}/sessions?limit=10`);
}

function json(body: unknown): RequestInit {
  return { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

export type AdminRole = AdminUser["role"];
const auditMessage = (action: string) => `Automatically recorded admin action: ${action}.`;
export function createPerson(input: { name: string; email: string; department: string; jobTitle?: string; businessProfile?: string; role: AdminRole }) {
  return apiFetch<{ user: AdminUser; temporaryPassword: string }>("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, reason: auditMessage("user created") }) });
}
export function updatePersonRole(userId: number, role: AdminRole) {
  return apiFetch<AdminUser>(`/api/admin/users/${userId}/role`, json({ role, reason: auditMessage("user role changed") }));
}

export function updatePersonActivation(userId: number, active: boolean) {
  return apiFetch<AdminUser>(`/api/admin/users/${userId}/activation`, json({ active, reason: auditMessage(active ? "user activated" : "user deactivated") }));
}

export function resetPersonSignInSecurity(userId: number) {
  return apiFetch<AdminUser>(`/api/admin/users/${userId}/reset`, { ...json({ reason: auditMessage("user sign-in security reset") }), method: "POST" });
}
export function resetPersonPassword(userId: number) {
  return apiFetch<{ temporaryPassword: string }>(`/api/admin/users/${userId}/password`, { ...json({ reason: auditMessage("user password reset") }), method: "POST" });
}
export function revokePersonSession(userId: number, sessionId: number) {
  return apiFetch<{ id: number; revokedAt: string }>(`/api/admin/users/${userId}/sessions/${sessionId}`, { ...json({ reason: auditMessage("user session revoked") }), method: "DELETE" });
}
