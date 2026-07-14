import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Enseignant, Salle, Cours, Niveau, Semestre, SlotEDT, Notif, LogEntry } from "@/types";
import {
  apiEnseignants, apiSalles, apiCours, apiNiveaux, apiSemestres,
  apiEdt, apiEdtMe, apiNotifications, apiJournal,
} from "@/lib/api";
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
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      // Fonction utilitaire pour catcher les erreurs individuelles (CORS, 404, 500, etc.)
      const fetchSafe = async <T,>(promise: Promise<T>, fallback: T, name: string): Promise<T> => {
        try {
          return await promise;
        } catch (err) {
          console.error(`[DataContext] Erreur sur ${name} :`, err);
          return fallback;
        }
      };

      const [ens, sal, cou, niv, sem, ed, no, jo] = await Promise.all([
        fetchSafe(apiEnseignants(), [], "Enseignants"),
        fetchSafe(apiSalles(), [], "Salles"),
        fetchSafe(apiCours(), [], "Cours"),
        fetchSafe(apiNiveaux(), [], "Niveaux"),
        fetchSafe(apiSemestres(), [], "Semestres"),
        fetchSafe(apiEdt(), [], "EDT"),
        fetchSafe(apiNotifications(), [], "Notifications"),
        user.role === "admin" 
          ? fetchSafe(apiJournal(), [], "Journal") 
          : Promise.resolve([] as LogEntry[]),
      ]);

      setEnseignants(ens);
      setSalles(sal);
      setCours(cou);
      setNiveaux(niv);
      setSemestres(sem);
      setEdt(ed);
      setNotifications(no);
      setJournal(jo);
    } catch (e) {
      console.error("[DataContext] Erreur globale fatale :", e);
      setError(e instanceof Error ? e.message : "Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);



  

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