import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AiAssistant from "@/components/AiAssistant";

export default function AdminLayout() {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className={`flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-900 transition-[padding] duration-300 ease-in-out ${isAiOpen ? "sm:pr-[400px]" : "pr-0"}`}>
      <Navbar role="admin" onToggleAi={() => setIsAiOpen(!isAiOpen)} />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6">
        <Outlet />
      </main>
      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
