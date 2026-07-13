import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Enseignant, Salle, Cours, Niveau, Semestre, SlotEDT, Notif, LogEntry } from "@/types";
import {
  apiEnseignants, apiSalles, apiCours, apiNiveaux, apiSemestres,
  apiEdt, apiEdtMe, apiNotifications, apiJournal,
} from "@/lib/api";
import { createNotificationsConnection } from "@/lib/notificationsHub";
import type { HubConnection } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";

interface DataCtx {
  enseignants: Enseignant[];
  salles: Salle[];
  cours: Cours[];
  niveaux: Niveau[];
  semestres: Semestre[];
  edt: SlotEDT[];
  notifications: Notif[];
  journal: LogEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setEnseignants: (x: Enseignant[]) => void;
  setSalles: (x: Salle[]) => void;
  setNotifications: (x: Notif[]) => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [edt, setEdt] = useState<SlotEDT[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [journal, setJournal] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return; // ← LA CORRECTION : ne rien charger si pas connecté

    setLoading(true); setError(null);
    try {
      const safe = <T,>(p: Promise<T>, fb: T): Promise<T> =>
        p.catch((err) => {
          console.error("[DataContext] Erreur de chargement :", err);
          return fb;
        });
      const [ens, sal, cou, niv, sem, ed, no, jo] = await Promise.all([
        safe(apiEnseignants(), []),
        safe(apiSalles(), []),
        safe(apiCours(), []),
        safe(apiNiveaux(), []),
        safe(apiSemestres(), []),
        // 👇 Admin → tous les EDT, Enseignant → seulement ses créneaux
        user.role === "admin" ? safe(apiEdt(), []) : safe(apiEdtMe(), []),
        safe(apiNotifications(), []),
        user.role === "admin" ? safe(apiJournal(), []) : Promise.resolve([] as LogEntry[]),
      ]);
      setEnseignants(ens); setSalles(sal); setCours(cou); setNiveaux(niv);
      setSemestres(sem); setEdt(ed); setNotifications(no); setJournal(jo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Connexion temps réel au Hub des notifications ─────────────────────────
  // Remplace le besoin de re-fetch manuel : les nouvelles notifications
  // arrivent en push et sont ajoutées en tête de liste.
  const hubRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!user) {
      hubRef.current?.stop();
      hubRef.current = null;
      return;
    }

    const connection = createNotificationsConnection();
    hubRef.current = connection;

    connection.on("ReceiveNotification", (notif: Notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    connection.start().catch((err) => {
      console.error("[SignalR] Échec de connexion au Hub notifications :", err);
    });

    return () => {
      connection.stop();
      if (hubRef.current === connection) hubRef.current = null;
    };
  }, [user]);

  return (
    <Ctx.Provider
      value={{
        enseignants, salles, cours, niveaux, semestres, edt, notifications, journal,
        loading, error, refresh,
        setEnseignants, setSalles, setNotifications,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData must be inside DataProvider");
  return c;
}