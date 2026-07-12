import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props { role?: string; children: React.ReactNode; }

export default function ProtectedRoute({ role, children }: Props) {
  const { user, loading } = useAuth();

  // Attendre que Supabase Auth ait résolu la session initiale
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emit-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role) {
    const expected = role.toLowerCase();
    const actual = (user.role ?? "").toLowerCase();
    if (actual !== expected) return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}