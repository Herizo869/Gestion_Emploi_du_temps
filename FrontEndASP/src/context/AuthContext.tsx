import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; role?: User["role"]; error?: string };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const FAKE_USERS: Array<User & { password: string }> = [
  {
    id: "u-admin",
    prenom: "Admin",
    nom: "EMIT",
    email: "admin@emit.mg",
    role: "admin",
    password: "admin123",
  },
  {
    id: "u-prof",
    prenom: "Herizo",
    nom: "RAKOTO",
    email: "herizo@emit.mg",
    role: "enseignant",
    specialite: "Génie logiciel",
    statut: "permanent",
    password: "prof123",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("emit-user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const login: AuthCtx["login"] = (email, password) => {
    if (!email || !password) return { ok: false, error: "Veuillez remplir tous les champs" };
    const found = FAKE_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: "Identifiants incorrects" };
    const { password: _, ...u } = found;
    setUser(u);
    localStorage.setItem("emit-user", JSON.stringify(u));
    return { ok: true, role: u.role };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("emit-user");
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
