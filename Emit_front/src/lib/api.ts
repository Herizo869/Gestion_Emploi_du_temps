// ============================================================
// Client API EMIT — branché sur le backend ASP.NET Core
// ============================================================
//
// Configurer l'URL via .env  →  VITE_API_URL=https://localhost:5001
// Le token JWT (issu de /api/auth/login) est stocké dans localStorage
// puis injecté en header `Authorization: Bearer <token>`.

import type {
  Enseignant, Salle, Cours, Niveau, Semestre,
  SlotEDT, Notif, LogEntry, User,
} from "@/types";

const BASE = (((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "https://localhost:5001").replace(/\/$/, "");
const TOKEN_KEY = "emit-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    localStorage.removeItem("emit-user");
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j.message ?? j.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ───── Auth ────────────────────────────────────────────────
export interface LoginResponse { token: string; user: User; }
export const apiLogin = (email: string, password: string) =>
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const apiMe = () => request<User>("/api/auth/me");

// ───── Enseignants ─────────────────────────────────────────
export const apiEnseignants = () => request<Enseignant[]>("/api/enseignants");
export const apiCreateEnseignant = (e: Partial<Enseignant>) =>
  request<Enseignant>("/api/enseignants", { method: "POST", body: JSON.stringify(e) });
export const apiUpdateEnseignant = (id: string, e: Partial<Enseignant>) =>
  request<Enseignant>(`/api/enseignants/${id}`, { method: "PUT", body: JSON.stringify(e) });
export const apiDeleteEnseignant = (id: string) =>
  request<void>(`/api/enseignants/${id}`, { method: "DELETE" });

// ───── Salles ──────────────────────────────────────────────
export const apiSalles = () => request<Salle[]>("/api/salles");
export const apiCreateSalle = (s: Partial<Salle>) =>
  request<Salle>("/api/salles", { method: "POST", body: JSON.stringify(s) });
export const apiUpdateSalle = (id: string, s: Partial<Salle>) =>
  request<Salle>(`/api/salles/${id}`, { method: "PUT", body: JSON.stringify(s) });
export const apiDeleteSalle = (id: string) =>
  request<void>(`/api/salles/${id}`, { method: "DELETE" });

// ───── Niveaux & Filières ──────────────────────────────────
export const apiNiveaux = () => request<Niveau[]>("/api/niveaux");

// ───── Cours ───────────────────────────────────────────────
export const apiCours = () => request<Cours[]>("/api/cours");
export const apiCreateCours = (c: Partial<Cours>) =>
  request<Cours>("/api/cours", { method: "POST", body: JSON.stringify(c) });
export const apiUpdateCours = (id: string, c: Partial<Cours>) =>
  request<Cours>(`/api/cours/${id}`, { method: "PUT", body: JSON.stringify(c) });
export const apiDeleteCours = (id: string) =>
  request<void>(`/api/cours/${id}`, { method: "DELETE" });

// ───── Semestres ───────────────────────────────────────────
export const apiSemestres = () => request<Semestre[]>("/api/semestres");
export const apiPublierSemestre = (id: string) =>
  request<Semestre>(`/api/semestres/${id}/publier`, { method: "POST" });

// ───── EDT ─────────────────────────────────────────────────
export const apiEdt = (params: {
  niveau?: string; filiere?: string; semestreId?: string;
} = {}) => {
  const q = new URLSearchParams();
  if (params.niveau) q.set("niveau", params.niveau);
  if (params.filiere) q.set("filiere", params.filiere);
  if (params.semestreId) q.set("semestreId", params.semestreId);
  const s = q.toString();
  return request<SlotEDT[]>(`/api/edt${s ? `?${s}` : ""}`);
};
export const apiEdtMe = (semestreId?: string) =>
  request<SlotEDT[]>(`/api/edt/me${semestreId ? `?semestreId=${semestreId}` : ""}`);
export const apiGenererEdt = (semestreId: string) =>
  request<{ slots: SlotEDT[]; conflits: number }>(`/api/edt/generate/${semestreId}`, { method: "POST" });

// ───── Notifications ───────────────────────────────────────
export const apiNotifications = () => request<Notif[]>("/api/notifications");
export const apiMarkNotifRead = (id: string) =>
  request<Notif>(`/api/notifications/${id}/read`, { method: "POST" });

// ───── Journal / Historique ────────────────────────────────
export const apiJournal = () => request<LogEntry[]>("/api/journal");

// ───── Disponibilités enseignant ───────────────────────────
export interface Dispo { jour: string; debut: string; fin: string; }
export const apiMyDispos = () => request<Dispo[]>("/api/disponibilites/me");
export const apiSaveMyDispos = (dispos: Dispo[]) =>
  request<void>("/api/disponibilites/me", { method: "PUT", body: JSON.stringify(dispos) });
export const apiDisposEnseignant = (enseignantId: string) =>
  request<Dispo[]>(`/api/disponibilites/${enseignantId}`);
