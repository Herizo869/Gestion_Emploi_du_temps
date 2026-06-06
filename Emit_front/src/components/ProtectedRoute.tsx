import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props { role?: string; children: React.ReactNode; }

export default function ProtectedRoute({ role, children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role) {
    const expected = role.toLowerCase();
    const actual = (user.role ?? "").toLowerCase();
    if (actual !== expected) return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}