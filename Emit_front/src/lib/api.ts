import type {
  Enseignant, Salle, Cours, Niveau, Filiere, Semestre,
  SlotEDT, Notif, LogEntry, User, GenerationEdtResult,
} from "@/types";

export type { GenerationEdtResult };

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
export const apiCreateNiveau = (data: { libelle: string; effectifMax: number }) =>
  request<Niveau>("/api/niveaux", { method: "POST", body: JSON.stringify(data) });
export const apiCreateFiliere = (niveauId: string, data: { libelle: string; description: string }) =>
  request<Filiere>(`/api/filieres?niveauId=${niveauId}`, { method: "POST", body: JSON.stringify(data) });
export const apiDeleteFiliere = (id: string) =>
  request<void>(`/api/filieres/${id}`, { method: "DELETE" });

// ───── Cours ───────────────────────────────────────────────
export const apiCours = () => request<Cours[]>("/api/cours");
export const apiCoursMine = () => request<Cours[]>("/api/cours/me");
export const apiCreateCours = (c: Partial<Cours>) =>
  request<Cours>("/api/cours", { method: "POST", body: JSON.stringify(c) });
export const apiUpdateCours = (id: string, c: Partial<Cours>) =>
  request<Cours>(`/api/cours/${id}`, { method: "PUT", body: JSON.stringify(c) });
export const apiDeleteCours = (id: string) =>
  request<void>(`/api/cours/${id}`, { method: "DELETE" });

// ───── Semestres ───────────────────────────────────────────
export const apiSemestres = () => request<Semestre[]>("/api/semestres");
export const apiCreateSemestre = (data: { libelle: string; annee: string }) =>
  request<Semestre>("/api/semestres", { method: "POST", body: JSON.stringify(data) });
export const apiPublierSemestre = (id: string) =>
  request<Semestre>(`/api/semestres/${id}/publier`, { method: "POST" });
export const apiArchiverSemestre = (id: string) =>
  request<Semestre>(`/api/semestres/${id}/archiver`, { method: "POST" });
export const apiDupliquerSemestre = (id: string) =>
  request<Semestre>(`/api/semestres/${id}/dupliquer`, { method: "POST" });
export const apiDepublierSemestre = (id: string) =>
  request<Semestre>(`/api/semestres/${id}/depublier`, { method: "POST" });

// ───── EDT ─────────────────────────────────────────────────
export const apiEdt = (params: {
  niveau?: string;
  niveauId?: string;
  filiere?: string;
  filiereId?: string;
  semestreId?: string;
  salleId?: string;
} = {}) => {
  const q = new URLSearchParams();
  const niveauVal = params.niveau || params.niveauId;
  const filiereVal = params.filiere || params.filiereId;
  if (niveauVal) q.set("niveau", niveauVal);
  if (filiereVal) q.set("filiere", filiereVal);
  if (params.semestreId) q.set("semestreId", params.semestreId);
  if (params.salleId) q.set("salleId", params.salleId);
  const s = q.toString();
  return request<SlotEDT[]>(`/api/edt${s ? `?${s}` : ""}`);
};
export const apiEdtMe = (semestreId?: string) =>
  request<SlotEDT[]>(`/api/edt/me${semestreId ? `?semestreId=${semestreId}` : ""}`);
export interface GenerationEdtResult {
  slotsCrees: number;
  coursNonPlanifies: string[];
  conflits: { id: string; type: string; description: string; date: string }[];
}
export const apiGenererEdt = (semestreId: string) =>
  request<GenerationEdtResult>(`/api/edt/generate/${semestreId}`, { method: "POST" });

// ───── Notifications ───────────────────────────────────────
export const apiNotifications = () => request<Notif[]>("/api/notifications");
export const apiMarkNotifRead = (id: string) =>
  request<Notif>(`/api/notifications/${id}/read`, { method: "POST" });

// ───── Journal / Historique ────────────────────────────────
export const apiJournal = () => request<LogEntry[]>("/api/journal");

// ───── Disponibilités ──────────────────────────────────────
export interface Dispo {
  jour: string;
  creneau: string;
  estDisponible: boolean;
  estIndisponible: boolean;
}
export interface ConflitDispo {
  jour: string;
  creneau: string;
  cours1: string;
  cours2: string;
}
export const apiMyDispos = (semestreId: string, coursId: string) =>
  request<Dispo[]>(`/api/disponibilites/me?semestreId=${semestreId}&coursId=${coursId}`);
export const apiSaveMyDispos = (semestreId: string, coursId: string, dispos: Dispo[]) =>
  request<{ conflits: ConflitDispo[] }>(`/api/disponibilites/me?semestreId=${semestreId}&coursId=${coursId}`, { method: "PUT", body: JSON.stringify(dispos) });
export const apiMesConflitsDispos = (semestreId: string) =>
  request<ConflitDispo[]>(`/api/disponibilites/mes-conflits?semestreId=${semestreId}`);
export const apiDisposEnseignant = (enseignantId: string, semestreId: string, coursId: string) =>
  request<Dispo[]>(`/api/disponibilites/${enseignantId}?semestreId=${semestreId}&coursId=${coursId}`);
export const apiSaveDisponibilites = (enseignantId: string, semestreId: string, coursId: string, disponibilites: Dispo[]) =>
  request<{ conflits: ConflitDispo[] }>(`/api/disponibilites/${enseignantId}?semestreId=${semestreId}&coursId=${coursId}`, { method: "PUT", body: JSON.stringify(disponibilites) });
export const apiConflitsDispos = (enseignantId: string, semestreId: string) =>
  request<ConflitDispo[]>(`/api/disponibilites/conflits?semestreId=${semestreId}&enseignantId=${enseignantId}`);

// ───── Export ──────────────────────────────────────────────
export interface ExportParams {
  semestreId?: string;
  niveauId?: string;
  filiereId?: string;
  salleId?: string;
  orientation?: "portrait" | "paysage";
}

function buildExportQuery(params: ExportParams) {
  const q = new URLSearchParams();
  if (params.semestreId) q.set("semestreId", params.semestreId);
  if (params.niveauId) q.set("niveauId", params.niveauId);
  if (params.filiereId) q.set("filiereId", params.filiereId);
  if (params.salleId) q.set("salleId", params.salleId);
  if (params.orientation) q.set("orientation", params.orientation);
  return q.toString();
}

async function downloadFile(path: string, filename: string) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Échec du téléchargement (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const apiDownloadPdf = (params: ExportParams = {}) =>
  downloadFile(`/api/export/pdf?${buildExportQuery(params)}`, "edt.pdf");
export const apiDownloadCsv = (params: ExportParams = {}) =>
  downloadFile(`/api/export/csv?${buildExportQuery(params)}`, "edt.csv");