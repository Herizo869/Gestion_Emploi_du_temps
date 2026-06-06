import React, { createContext, useContext, useEffect, useState } from "react"; import { apiLogin, apiMe } from "@/lib/api"; // adapte le chemin si nécessaire
type User = any; type AuthContextType = { user: User | null; login: (email: string, password: string) => Promise<{ ok: boolean; role?: string; error?: string }>; logout: () => void; };
const TOKEN_KEY = "emit-token"; const USER_KEY = "emit-user";
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; } catch { return null; } });
  useEffect(() => { (async () => { const token = localStorage.getItem(TOKEN_KEY); if (!token) return; try { const me = await apiMe(); setUser(me); localStorage.setItem(USER_KEY, JSON.stringify(me)); } catch { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); } })(); }, []);
  const login = async (email: string, password: string) => { try { const r = await apiLogin(email, password); if (r?.token) { localStorage.setItem(TOKEN_KEY, r.token); localStorage.setItem(USER_KEY, JSON.stringify(r.user)); setUser(r.user); return { ok: true, role: r.user?.role }; } return { ok: false, error: "Réponse invalide" }; } catch (e: any) { return { ok: false, error: e?.message ?? "Erreur" }; } };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); window.location.href = "/login"; };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);