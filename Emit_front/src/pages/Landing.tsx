import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarDays,
  Lock,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  LayoutTemplate,
  ArrowDown,
  CheckCircle,
  Zap,
  Users,
  Terminal,
} from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";

// ─── Animation Options ────────────────────────────────────────────────────────
type AnimationVariant = "fade-up" | "fade-left" | "fade-right" | "zoom" | "fade-down";

interface AnimatedProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number; // ms
  className?: string;
}

function Animated({ children, variant = "fade-up", delay = 0, className = "" }: AnimatedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = "transition-all ease-out";
  const duration = "duration-[900ms]";

  const variants: Record<AnimationVariant, { from: string; to: string }> = {
    "fade-up":    { from: "opacity-0 translate-y-12",  to: "opacity-100 translate-y-0" },
    "fade-down":  { from: "opacity-0 -translate-y-12", to: "opacity-100 translate-y-0" },
    "fade-left":  { from: "opacity-0 -translate-x-12", to: "opacity-100 translate-x-0" },
    "fade-right": { from: "opacity-0 translate-x-12",  to: "opacity-100 translate-x-0" },
    "zoom":       { from: "opacity-0 scale-90",         to: "opacity-100 scale-100" },
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${base} ${duration} ${visible ? variants[variant].to : variants[variant].from} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`relative z-10 ${className}`}>
      {children}
    </section>
  );
}

// ─── Animated counter (stats) ─────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !ran.current) {
          ran.current = true;
          const duration = 1400;
          const steps = 60;
          const step = end / steps;
          let cur = 0;
          const timer = setInterval(() => {
            cur = Math.min(cur + step, end);
            setCount(Math.round(cur));
            if (cur >= end) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Typewriter effect for hero title ─────────────────────────────────────────
function Typewriter({ texts }: { texts: string[] }) {
  const [displayed, setDisplayed] = useState("");
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), 60);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), 30);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }

    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, textIdx, texts]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse text-emit-sky">|</span>
    </span>
  );
}

// ─── Scroll progress bar ──────────────────────────────────────────────────────
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = document.documentElement;
    const scrolled = el.scrollTop;
    const total = el.scrollHeight - el.clientHeight;
    setProgress(total > 0 ? (scrolled / total) * 100 : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-white/5">
      <div
        className="h-full bg-gradient-to-r from-emit-sky via-indigo-400 to-white transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Slide progress dots (side navigation) ───────────────────────────────────
const SLIDES = [
  { id: "slide-hero",         label: "Titre" },
  { id: "slide-problem",      label: "Problématique" },
  { id: "slide-architecture", label: "Architecture" },
  { id: "slide-features",     label: "Fonctionnalités" },
  { id: "slide-security",     label: "Sécurité" },
  { id: "slide-demo",         label: "Aperçu" },
  { id: "slide-conclusion",   label: "Conclusion" },
];

function SideNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SLIDES.forEach(({ id }, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(idx); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
      {SLIDES.map(({ id, label }, idx) => (
        <button
          key={id}
          title={label}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          className={`group relative flex items-center justify-end gap-2 transition-all duration-300`}
        >
          <span className={`hidden group-hover:inline-block text-[10px] font-semibold text-white bg-emit-navy/80 backdrop-blur px-2 py-0.5 rounded-full`}>
            {label}
          </span>
          <span className={`block rounded-full transition-all duration-300 ${
            idx === active
              ? "w-3 h-3 bg-emit-sky shadow-[0_0_8px_rgba(126,200,227,0.8)]"
              : "w-2 h-2 bg-white/30 hover:bg-white/60"
          }`} />
        </button>
      ))}
    </nav>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-[#081234] text-white selection:bg-emit-sky selection:text-emit-navy overflow-x-hidden">
      {/* ── Global Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-80px) scale(1.15); }
          66%      { transform: translate(-40px,40px) scale(0.9); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1.1); }
          33%      { transform: translate(-70px,50px) scale(0.85); }
          66%      { transform: translate(40px,-40px) scale(1.2); }
        }
        @keyframes blob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-40px,-50px) scale(1.08); }
        }
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          10% { transform: translate(-2%,-2%); }
          30% { transform: translate(2%,2%); }
          50% { transform: translate(-1%,1%); }
          70% { transform: translate(1%,-1%); }
          90% { transform: translate(-2%,1%); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes grid-fade {
          0%,100% { opacity: 0.03; }
          50%      { opacity: 0.06; }
        }
        .blob1 { animation: blob1 18s ease-in-out infinite; }
        .blob2 { animation: blob2 22s ease-in-out infinite; }
        .blob3 { animation: blob3 14s ease-in-out infinite; }
        .text-shimmer {
          background: linear-gradient(90deg,#7ec8e3 0%,#a5f3fc 30%,#fff 50%,#a5f3fc 70%,#7ec8e3 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .card-glow:hover {
          box-shadow: 0 0 40px rgba(126,200,227,0.18), 0 8px 30px rgba(0,0,0,0.35);
        }
        .grain::after {
          content:'';position:fixed;inset:0;z-index:1;pointer-events:none;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
          opacity:0.12;
          animation: grain 0.4s steps(1) infinite;
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(126,200,227,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(126,200,227,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          animation: grid-fade 6s ease-in-out infinite;
        }
      `}</style>

      {/* Film grain overlay */}
      <div className="grain" />

      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg" />

      {/* Animated background blobs */}
      <div className="pointer-events-none fixed -left-56 -top-56 h-[600px] w-[600px] rounded-full bg-emit-sky/12 blur-[140px] blob1 z-0" />
      <div className="pointer-events-none fixed -right-40 -bottom-40 h-[700px] w-[700px] rounded-full bg-indigo-600/15 blur-[150px] blob2 z-0" />
      <div className="pointer-events-none fixed left-1/3 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/8 blur-[120px] blob3 z-0" />

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Side navigation dots */}
      <SideNav />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-[3px] left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 bg-[#081234]/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block border-l border-white/20 pl-3 text-xs tracking-widest uppercase text-emit-sky font-bold">
            Présentation Projet
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/edt" className="rounded-lg px-4 py-2 text-sm font-medium text-emit-sky hover:text-white hover:bg-white/5 transition-all">
            EDT Public
          </Link>
          <Button
            id="nav-login-btn"
            variant="primary"
            size="sm"
            onClick={() => navigate("/login")}
            leftIcon={<Lock className="h-4 w-4" />}
            className="relative overflow-hidden shadow-lg shadow-emit-sky/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-emit-sky/30"
          >
            Se connecter
          </Button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 1 — HERO                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-hero" className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-12 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-7 max-w-4xl">
          <Animated variant="fade-down" delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-emit-sky hover:border-emit-sky/40 transition-all">
              <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              Soutenance de Projet L3 — 2026
            </div>
          </Animated>

          <Animated variant="fade-up" delay={150}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight">
              <Typewriter texts={["Gestion des Emplois du Temps", "Planification Automatisée", "Solution EMIT 2026"]} />
            </h1>
          </Animated>

          <Animated variant="fade-up" delay={300}>
            <p className="text-base text-slate-300 md:text-xl leading-relaxed max-w-2xl mx-auto">
              Une solution digitale intelligente, automatisée et sécurisée pour orchestrer l'attribution des salles, des cours et des disponibilités à l'EMIT.
            </p>
          </Animated>

          <Animated variant="fade-up" delay={450}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                id="cta-connect-hero"
                size="lg"
                onClick={() => navigate("/login")}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-white text-emit-navy hover:bg-emit-sky hover:text-emit-navy transition-all duration-300 px-8 py-3.5 shadow-lg hover:-translate-y-1"
              >
                Se connecter
              </Button>
              <Button
                id="cta-edt-hero"
                variant="outline"
                size="lg"
                onClick={() => navigate("/edt")}
                leftIcon={<CalendarDays className="h-5 w-5" />}
                className="border-white/20 text-white hover:bg-white/5 hover:border-emit-sky/40 transition-all duration-300 px-6 hover:-translate-y-1"
              >
                Accéder à l'EDT Public
              </Button>
            </div>
          </Animated>

          {/* Animated stat row */}
          <Animated variant="fade-up" delay={600}>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/5 pt-10 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emit-sky"><Counter end={7} /> slides</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Présentation complète</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-indigo-300"><Counter end={3} /> rôles</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Admin · Ens. · Public</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emerald-400">100<span className="text-lg">%</span></p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sans conflit horaire</p>
              </div>
            </div>
          </Animated>
        </div>

        <button
          onClick={() => scrollToSection("slide-problem")}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-xs text-slate-400 hover:text-emit-sky transition-all animate-bounce"
        >
          <span>Découvrir</span>
          <ArrowDown className="h-4 w-4" />
        </button>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 2 — PROBLÉMATIQUE                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-problem" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          <div className="space-y-7">
            <Animated variant="fade-right">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 02 / Problématique</span>
              <h2 className="text-3xl font-extrabold sm:text-4xl md:text-5xl mt-2">Le Défi de la<br />Planification</h2>
            </Animated>
            <div className="space-y-5">
              {[
                { icon: "⚡", title: "Chevauchements d'horaires", desc: "Éviter qu'un enseignant ou une classe soit affecté à deux cours simultanément.", delay: 0 },
                { icon: "🏛️", title: "Capacité des salles", desc: "Faire correspondre l'effectif (L1, L2, L3…) avec la capacité réelle de chaque salle.", delay: 100 },
                { icon: "📋", title: "Disponibilités enseignants", desc: "Prendre en compte les contraintes personnelles et professionnelles de chaque intervenant.", delay: 200 },
              ].map(({ icon, title, desc, delay }) => (
                <Animated key={title} variant="fade-right" delay={delay}>
                  <div className="group flex items-start gap-4 rounded-xl p-4 border border-white/5 bg-white/3 hover:bg-white/5 hover:border-red-500/20 transition-all duration-300 card-glow">
                    <span className="text-2xl transition-transform group-hover:scale-110 duration-300">{icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">{title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Animated>
              ))}
            </div>
          </div>

          <Animated variant="fade-left" delay={100}>
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/3 p-8 backdrop-blur-md shadow-2xl text-center space-y-5 card-glow transition-all duration-500 hover:border-red-400/20">
              {/* Decorative corner */}
              <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
              <div className="text-5xl">🤯</div>
              <h3 className="font-bold text-xl text-white">L'approche traditionnelle</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Tableaux Excel complexes, formulaires papier égarés, modifications de dernière minute — sources d'erreurs chronophages.
              </p>
              <div className="space-y-2 text-left text-xs">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />Risque de double-affectation élevé
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />Modifications impossibles à tracer
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />Aucune visibilité en temps réel
                </div>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-xs font-bold">
                → Notre solution résout toutes ces problématiques
              </div>
            </div>
          </Animated>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 3 — ARCHITECTURE & TECH STACK                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-architecture" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="space-y-14 w-full">
          <Animated variant="fade-up">
            <div className="text-center space-y-4">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 03 / Architecture</span>
              <h2 className="text-3xl font-extrabold sm:text-4xl md:text-5xl">Stack Technique & Architecture</h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto">
                Trois couches distinctes — présentation, logique métier, données — avec une séparation claire des responsabilités.
              </p>
            </div>
          </Animated>

          {/* Architecture diagram hint */}
          <Animated variant="zoom" delay={100}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0 max-w-3xl mx-auto">
              {[
                { label: "React + Vite", sub: "UI / Présentation", color: "border-emit-sky/40 text-emit-sky bg-emit-sky/5" },
                null,
                { label: ".NET 8 API", sub: "Logique Métier", color: "border-violet-400/40 text-violet-300 bg-violet-500/5" },
                null,
                { label: "PostgreSQL + Supabase", sub: "Données & Auth", color: "border-emerald-400/40 text-emerald-300 bg-emerald-500/5" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} className="text-slate-500 text-lg md:mx-3">→</div>
                ) : (
                  <div key={i} className={`rounded-xl border px-5 py-3.5 text-center ${item.color} transition-all hover:scale-105`}>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{item.sub}</p>
                  </div>
                )
              )}
            </div>
          </Animated>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <LayoutTemplate className="h-6 w-6" />, color: "emit-sky", colorClass: "bg-emit-sky/15 text-emit-sky hover:border-emit-sky/50 hover:shadow-emit-sky/5", title: "Frontend (Client)", desc: "Application Single Page ultra-fluide.", items: ["• React 18 + TypeScript + Vite", "• Tailwind CSS v4 design system", "• Context API – gestion d'état", "• Lucide React – iconographie"], delay: 0 },
              { icon: <Cpu className="h-6 w-6" />, color: "violet", colorClass: "bg-violet-500/15 text-violet-400 hover:border-violet-500/50 hover:shadow-violet-500/5", title: "Backend (API REST)", desc: "Web API modulaire en C# / .NET 8.0.", items: ["• Entity Framework Core 8", "• Algorithme de génération EDT", "• Authentification JWT sécurisée", "• Swagger / OpenAPI docs"], delay: 100 },
              { icon: <Database className="h-6 w-6" />, color: "emerald", colorClass: "bg-emerald-500/15 text-emerald-400 hover:border-emerald-500/50 hover:shadow-emerald-500/5", title: "Persistance & Auth", desc: "PostgreSQL industriel via Supabase.", items: ["• Supabase Auth + email verify", "• Triggers SQL automatisés", "• Row Level Security (RLS)", "• Migrations EF Core contrôlées"], delay: 200 },
            ].map(({ icon, colorClass, title, desc, items, delay }) => (
              <Animated key={title} variant="fade-up" delay={delay}>
                <div className={`group h-full rounded-2xl bg-white/4 border border-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-lg card-glow text-left space-y-4 ${colorClass}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-300 ${colorClass.split(" ").slice(0,2).join(" ")}`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-current transition-colors">{title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{desc}</p>
                  </div>
                  <ul className="space-y-1 text-xs font-semibold opacity-80">
                    {items.map(it => <li key={it}>{it}</li>)}
                  </ul>
                </div>
              </Animated>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 4 — FONCTIONNALITÉS                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-features" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="grid lg:grid-cols-12 gap-14 items-center w-full">
          <div className="lg:col-span-5 space-y-6">
            <Animated variant="fade-right">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 04 / Fonctionnalités</span>
              <h2 className="text-3xl font-extrabold sm:text-4xl mt-2">Ce que le Système Fait</h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mt-2">
                De la saisie des disponibilités à la génération automatique — tout en un seul portail.
              </p>
            </Animated>
            <Animated variant="fade-right" delay={100}>
              <ul className="space-y-3.5">
                {[
                  "Génération algorithmique sans conflit d'horaire",
                  "Déclaration interactive des créneaux enseignants",
                  "Filtrage multi-critères (niveau, filière, salle)",
                  "Export instantané PDF & CSV imprimable",
                  "Notifications email en cas de changement",
                  "Journal d'audit des modifications (historique)",
                ].map((item, i) => (
                  <li key={i} className="group flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors cursor-default">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    {item}
                  </li>
                ))}
              </ul>
            </Animated>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { emoji: "🤖", title: "Génération Intelligente", desc: "Algorithme glouton respectant salles, volumes horaires et disponibilités.", color: "hover:border-emit-sky/30", delay: 0 },
              { emoji: "📅", title: "Calendrier Interactif", desc: "Vue grille hebdomadaire avec code couleur CM / TD / TP.", color: "hover:border-indigo-400/30", delay: 50 },
              { emoji: "🔐", title: "Double Authentification", desc: "Deux rôles hermétiques : Admin & Enseignant via Supabase JWT.", color: "hover:border-violet-400/30", delay: 100 },
              { emoji: "📂", title: "Export Multi-Format", desc: "PDF portrait / paysage, CSV pour intégration dans d'autres outils.", color: "hover:border-emerald-400/30", delay: 150 },
              { emoji: "🔔", title: "Notifications Push", desc: "Alerte instantanée en cas de modification de planning.", color: "hover:border-yellow-400/30", delay: 200 },
              { emoji: "📊", title: "Dashboard Admin", desc: "Vue centralisée : taux d'occupation des salles, progression des cours.", color: "hover:border-pink-400/30", delay: 250 },
            ].map(({ emoji, title, desc, color, delay }) => (
              <Animated key={title} variant="zoom" delay={delay}>
                <div className={`group rounded-xl border border-white/10 bg-white/4 p-5 space-y-2 transition-all duration-300 ${color} hover:bg-white/8 hover:-translate-y-1 card-glow`}>
                  <div className="text-2xl transition-transform group-hover:scale-125 duration-300">{emoji}</div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emit-sky transition-colors">{title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Animated>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 5 — SÉCURITÉ                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-security" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-14 items-center w-full">
          <Animated variant="fade-left">
            <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8 shadow-2xl space-y-6 transition-all duration-500 hover:border-emerald-500/40 card-glow overflow-hidden">
              <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Sécurité Multi-Couche</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                La sécurité est implémentée à trois niveaux — client, API et base de données — pour zéro surface d'attaque.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "🛡️", title: "Row Level Security (RLS)", desc: "Chaque ligne de profil n'est visible que par son propriétaire." },
                  { icon: "🔒", title: "Anti-Self-Escalation Trigger", desc: "Trigger SQL bloquant la promotion de rôle non-admin → admin." },
                  { icon: "⚙️", title: "Auto-Profile Trigger", desc: "Création automatique avec rôle 'enseignant' à l'inscription." },
                  { icon: "📧", title: "Email Verification", desc: "Connexion bloquée tant que l'adresse email n'est pas vérifiée." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="group flex items-start gap-3 rounded-lg bg-white/3 border border-white/5 px-3 py-2.5 hover:bg-emerald-500/5 hover:border-emerald-500/15 transition-all">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Animated>

          <div className="space-y-7">
            <Animated variant="fade-right">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 05 / Sécurité</span>
              <h2 className="text-3xl font-extrabold sm:text-4xl mt-2">Authentification par Rôles Hermétiques</h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mt-2">
                Deux rôles séparés, avec des interfaces et des permissions strictement distinctes :
              </p>
            </Animated>
            <div className="space-y-4">
              <Animated variant="fade-right" delay={100}>
                <div className="group rounded-xl border border-emit-sky/20 bg-emit-sky/5 p-5 hover:border-emit-sky/40 transition-all card-glow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emit-sky/15 border border-emit-sky/20 text-emit-sky font-extrabold text-sm">A</div>
                    <h4 className="font-bold text-white group-hover:text-emit-sky transition-colors">Administrateur</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Contrôle complet : gestion des enseignants, salles, semestres, déclenchement de la génération d'emploi du temps, résolution des conflits et journal d'audit.</p>
                </div>
              </Animated>
              <Animated variant="fade-right" delay={200}>
                <div className="group rounded-xl border border-white/10 bg-white/4 p-5 hover:border-white/20 transition-all card-glow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 font-extrabold text-sm">E</div>
                    <h4 className="font-bold text-white">Enseignant</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Consultation de ses cours assignés, son planning individuel, édition de ses disponibilités hebdomadaires, téléchargement de son emploi du temps personnel.</p>
                </div>
              </Animated>
              <Animated variant="fade-right" delay={300}>
                <div className="group rounded-xl border border-slate-700/40 bg-white/2 p-5 hover:border-slate-500/40 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/3 border border-white/8 text-slate-500 font-extrabold text-sm">P</div>
                    <h4 className="font-bold text-slate-300">Public (Étudiant)</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">Accès sans compte requis à la grille d'emploi du temps publique, filtrable par niveau, filière et semestre. Téléchargement PDF disponible.</p>
                </div>
              </Animated>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 6 — DÉMO VISUELLE                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-demo" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="space-y-10 w-full">
          <Animated variant="fade-up">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 06 / Aperçu Interface</span>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Une Grille Intuitive & Code Couleur</h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Représentation fidèle de l'interface réelle : CM en bleu marine, TD en bleu ciel, TP en vert.
              </p>
            </div>
          </Animated>

          <Animated variant="zoom" delay={100}>
            <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/4 overflow-hidden shadow-2xl backdrop-blur-md transition-all hover:border-emit-sky/20">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 bg-white/5 border-b border-white/8 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                  <span className="h-3 w-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 mx-4 rounded-md bg-white/5 border border-white/8 px-3 py-1 text-[10px] text-slate-400">
                  https://emit-planning.mg/edt
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-white/8 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emit-sky">Emploi du Temps — Semestre 1</span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">Publié</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-emit-navy animate-pulse" /> CM</span>
                    <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-emit-sky animate-pulse" /> TD</span>
                    <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> TP</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center">
                    <thead>
                      <tr className="text-slate-400 text-[10px]">
                        <th className="pb-2 w-20 text-left text-slate-500">Horaire</th>
                        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map(j => (
                          <th key={j} className="pb-2">{j}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      {[
                        { time: "07h30", cells: [
                          { label: "Algorithmique", sub: "L1 · AMPHI-1", cls: "bg-white/5 border-white/8" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "Réseaux", sub: "L3 · AMPHI-2", cls: "bg-white/5 border-white/8" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "Maths", sub: "L1 · A102", cls: "bg-white/5 border-white/8" },
                        ]},
                        { time: "09h15", cells: [
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "POO Java TD", sub: "L2 · A101", cls: "bg-emit-sky/20 border-emit-sky/20 text-emit-sky" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "DevOps TP", sub: "M1 · B201", cls: "bg-green-500/20 border-green-500/20 text-green-400" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                        ]},
                        { time: "13h30", cells: [
                          { label: "Bases de Données", sub: "L2 · AMPHI-1", cls: "bg-white/5 border-white/8" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "BDD SQL TP", sub: "L2 · B201", cls: "bg-green-500/20 border-green-500/20 text-green-400" },
                          { label: "—", sub: "", cls: "bg-transparent border-transparent text-slate-600" },
                          { label: "DevOps", sub: "M1 · AMPHI-2", cls: "bg-white/5 border-white/8" },
                        ]},
                      ].map(({ time, cells }) => (
                        <tr key={time}>
                          <td className="py-1.5 text-left text-[10px] text-slate-500">{time}</td>
                          {cells.map((cell, ci) => (
                            <td key={ci} className="py-1 px-1">
                              {cell.label !== "—" ? (
                                <div className={`rounded-lg border px-1 py-2 transition-all hover:scale-105 cursor-pointer ${cell.cls}`}>
                                  <p className="font-bold text-white text-[10px] leading-tight">{cell.label}</p>
                                  <p className="text-[9px] opacity-60 mt-0.5">{cell.sub}</p>
                                </div>
                              ) : (
                                <div className="h-10" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Animated>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE 7 — CONCLUSION                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section id="slide-conclusion" className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center space-y-8 max-w-2xl">
          <Animated variant="zoom">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emit-sky/10 text-4xl border border-emit-sky/20 mx-auto">
              🎓
            </div>
          </Animated>
          <Animated variant="fade-up" delay={100}>
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-emit-sky font-bold">Slide 07 / Conclusion</span>
              <h2 className="text-3xl font-extrabold sm:text-5xl">
                <span className="text-shimmer">Prêt pour la Démo ?</span>
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Le système est opérationnel et déployé. Connectez-vous pour administrer les plannings ou consultez directement la vue publique en temps réel.
              </p>
            </div>
          </Animated>

          <Animated variant="fade-up" delay={200}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                id="cta-connect-final"
                size="lg"
                onClick={() => navigate("/login")}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-white text-emit-navy hover:bg-emit-sky hover:text-emit-navy transition-all duration-300 px-8 py-3.5 hover:-translate-y-1"
              >
                Se connecter au portail
              </Button>
              <Button
                id="cta-edt-final"
                variant="outline"
                size="lg"
                onClick={() => navigate("/edt")}
                leftIcon={<CalendarDays className="h-5 w-5" />}
                className="border-white/20 text-white hover:bg-white/5 hover:border-emit-sky/40 transition-all duration-300 px-6 hover:-translate-y-1"
              >
                Visualiser l'EDT
              </Button>
            </div>
          </Animated>

          <Animated variant="fade-up" delay={350}>
            <div className="mt-6 grid grid-cols-3 gap-6 border-t border-white/5 pt-8 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-xl font-extrabold text-emit-sky"><Counter end={12} />+</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Entités gérées</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-violet-300"><Counter end={5} /> niveaux</p>
                <p className="text-[10px] text-slate-500 mt-0.5">L1 → M2</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-emerald-400">∞ semestres</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Illimité</p>
              </div>
            </div>
          </Animated>

          <Animated variant="fade-up" delay={450}>
            <p className="text-[10px] text-slate-600">
              Développé par l'équipe EMIT L3 · Propulsé par .NET 8.0 & React 2026
            </p>
          </Animated>
        </div>
      </Section>

      {/* ── Footer navigation ───────────────────────────────────────────────── */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-6 border-t border-white/5 bg-[#081234]/40 text-xs text-slate-500">
        <span>© 2026 EMIT · Tous droits réservés.</span>
        <div className="flex flex-wrap gap-4">
          {SLIDES.map(({ id, label }) => (
            <button key={id} onClick={() => scrollToSection(id)} className="hover:text-emit-sky transition-colors">
              {label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
