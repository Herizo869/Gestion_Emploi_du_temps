import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import EnseignantLayout from "./layouts/EnseignantLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminEnseignants from "./pages/admin/Enseignants";
import AdminSalles from "./pages/admin/Salles";
import AdminCours from "./pages/admin/Cours";
import AdminNiveaux from "./pages/admin/Niveaux";
import AdminSemestres from "./pages/admin/Semestres";
import AdminDisponibilites from "./pages/admin/Disponibilites";
import AdminGenerer from "./pages/admin/Generer";
import AdminEdt from "./pages/admin/Edt";
import AdminExport from "./pages/admin/Export";
import AdminHistorique from "./pages/admin/Historique";
import AdminProfil from "./pages/admin/Profil";

import EnsDashboard from "./pages/enseignant/Dashboard";
import EnsCours from "./pages/enseignant/Cours";
import EnsDisponibilites from "./pages/enseignant/Disponibilites";
import EnsEdt from "./pages/enseignant/Edt";
import EnsProfil from "./pages/enseignant/Profil";
import EnsNotifications from "./pages/enseignant/Notifications";

import PublicEdt from "./pages/public/Edt";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/edt" element={<PublicEdt />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="enseignants" element={<AdminEnseignants />} />
        <Route path="salles" element={<AdminSalles />} />
        <Route path="cours" element={<AdminCours />} />
        <Route path="niveaux" element={<AdminNiveaux />} />
        <Route path="semestres" element={<AdminSemestres />} />
        <Route path="disponibilites" element={<AdminDisponibilites />} />
        <Route path="generer" element={<AdminGenerer />} />
        <Route path="edt" element={<AdminEdt />} />
        <Route path="export" element={<AdminExport />} />
        <Route path="historique" element={<AdminHistorique />} />
        <Route path="profil" element={<AdminProfil />} />
      </Route>

      <Route
        path="/enseignant"
        element={
          <ProtectedRoute role="enseignant">
            <EnseignantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EnsDashboard />} />
        <Route path="cours" element={<EnsCours />} />
        <Route path="disponibilites" element={<EnsDisponibilites />} />
        <Route path="edt" element={<EnsEdt />} />
        <Route path="profil" element={<EnsProfil />} />
        <Route path="notifications" element={<EnsNotifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
