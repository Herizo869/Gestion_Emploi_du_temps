import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function EnseignantLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Navbar role="enseignant" />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
