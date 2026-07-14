import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `Tu es l'assistant IA officiel de l'application de Gestion des Emplois du Temps de l'EMIT (Ecole de Management et d'Innovation Technologique).
Tu es intégré directement dans le tableau de bord Administrateur.
Tu connais parfaitement l'application :
- Elle permet de gérer des semestres, des enseignants, des salles et des cours.
- L'administrateur peut générer automatiquement l'emploi du temps en utilisant un algorithme glouton sans conflit.
- Il y a deux rôles : Administrateur et Enseignant.
- L'interface est moderne, utilisant React, Tailwind CSS et .NET 8 pour l'API. La base de données est PostgreSQL via Supabase avec sécurité RLS.
- L'admin peut exporter l'EDT en PDF/CSV et publier l'EDT pour le public (accessible sans connexion).
Ton rôle est d'aider l'administrateur, de répondre à ses questions sur l'utilisation du système ou sur la planification en général. Sois concis, professionnel et utile. Ne mentionne pas que tu es un modèle d'IA générique.`;

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Bonjour ! Je suis l'IA de l'EMIT. Comment puis-je vous aider dans votre gestion aujourd'hui ?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      const payload = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage.content }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Erreur de l'API");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Désolé, une erreur est survenue lors de la communication avec l'IA. Vérifiez votre clé API ou votre connexion." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl z-[60] flex flex-col border-l border-slate-200 dark:border-slate-800 animate-[slideIn_.2s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-emit-navy text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="h-5 w-5 text-emit-sky" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Assistant IA</h3>
              <p className="text-[11px] text-emit-sky/80">Propulsé par Groq (Llama 3)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user'
                  ? 'bg-emit-sky text-emit-navy'
                  : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                  ? 'bg-emit-navy text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-none'
                }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">L'IA réfléchit...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur l'application..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emit-sky/50 outline-none transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 h-10 w-10 flex items-center justify-center rounded-lg bg-emit-navy text-white disabled:opacity-50 hover:bg-emit-sky hover:text-emit-navy transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400">Ne partagez pas de données sensibles.</span>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </>
  );
}
