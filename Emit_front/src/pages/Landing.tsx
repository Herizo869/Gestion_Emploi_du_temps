import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarDays,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  Users,
  CheckCircle,
} from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";

interface PresentationSlide {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  illustration: React.ReactNode;
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides: PresentationSlide[] = [
    {
      title: "Planification Automatisée & Intelligente",
      description:
        "Générez les emplois du temps de l'EMIT en un clic. Notre algorithme prend en compte le volume horaire, les capacités des salles et évite les conflits d'horaires.",
      badge: "Génération Intelligente",
      icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
      illustration: (
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-emit-navy/50 p-6 backdrop-blur-md border border-white/10">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between text-xs text-emit-sky font-semibold border-b border-white/10 pb-2">
              <span>Semestre 1 - L3 AES</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Optimisé</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 text-center">
                <span className="block text-[10px] text-slate-400">Lundi 08h</span>
                <span className="font-bold text-white text-xs">Algorithmique</span>
                <span className="block text-[9px] text-emit-sky">Salle AMPHI-1</span>
              </div>
              <div className="rounded-lg bg-emit-sky/15 p-2.5 border border-emit-sky/10 text-center">
                <span className="block text-[10px] text-emit-sky">Mardi 10h</span>
                <span className="font-bold text-white text-xs">Systèmes</span>
                <span className="block text-[9px] text-emit-sky">Salle B201</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5 border border-white/5 text-center">
                <span className="block text-[10px] text-slate-400">Jeudi 14h</span>
                <span className="font-bold text-white text-xs">Bases de Données</span>
                <span className="block text-[9px] text-emit-sky">Salle AMPHI-2</span>
              </div>
            </div>
            <div className="flex justify-end pt-2 text-[10px] text-slate-400">
              ⚡ Généré en 2.4s sans chevauchement
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Gestion Simplifiée des Disponibilités",
      description:
        "Les enseignants saisissent directement leurs préférences et disponibilités horaires depuis leur espace personnel. Plus besoin de formulaires papier interminables.",
      badge: "Espace Enseignant",
      icon: <Users className="h-6 w-6 text-emit-sky" />,
      illustration: (
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-emit-navy/50 p-6 backdrop-blur-md border border-white/10">
          <div className="space-y-3 w-full text-white text-sm">
            <p className="text-xs text-emit-sky font-semibold border-b border-white/10 pb-2">Créneaux enseignements choisis</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded bg-emerald-500/10 p-2 border border-emerald-500/20">
                <span>Lundi (Matin)</span>
                <span className="text-xs text-emerald-400">✓ Disponible</span>
              </div>
              <div className="flex items-center justify-between rounded bg-red-500/10 p-2 border border-red-500/20">
                <span>Mercredi (Après-midi)</span>
                <span className="text-xs text-red-400">✗ Indisponible</span>
              </div>
              <div className="flex items-center justify-between rounded bg-emerald-500/10 p-2 border border-emerald-500/20">
                <span>Vendredi (Matin)</span>
                <span className="text-xs text-emerald-400">✓ Disponible</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Consultation Publique & Téléchargement",
      description:
        "Un accès direct sans authentification pour les étudiants afin de visualiser l'emploi du temps hebdomadaire mis à jour en temps réel et de le télécharger en PDF.",
      badge: "Lien Public Étudiants",
      icon: <CalendarDays className="h-6 w-6 text-emerald-400" />,
      illustration: (
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-emit-navy/50 p-6 backdrop-blur-md border border-white/10">
          <div className="w-full text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emit-sky/20">
              <CalendarDays className="h-6 w-6 text-emit-sky" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Consultation immédiate</p>
              <p className="text-xs text-slate-300 mt-1">
                Aucun compte requis pour visualiser les plannings des cours.
              </p>
            </div>
            <Link to="/edt" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emit-sky px-4 py-2 text-xs font-bold text-emit-navy hover:bg-white transition-all">
              Consulter l'emploi du temps
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ),
    },
  ];

  // Auto-play slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-emit-navy text-white">
      {/* Background Decorative Blur Gradients */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-96 w-96 rounded-full bg-emit-sky/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emit-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 bg-emit-navy/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block border-l border-white/20 pl-3 text-xs tracking-wider uppercase text-emit-sky font-semibold">
            Emploi du temps
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/edt"
            className="rounded-lg px-4 py-2 text-sm font-medium text-emit-sky hover:text-white hover:bg-white/5 transition-all"
          >
            Consulter EDT
          </Link>
          <Button
            id="nav-login-btn"
            variant="primary"
            size="sm"
            onClick={() => navigate("/login")}
            leftIcon={<Lock className="h-4 w-4" />}
            className="shadow-lg shadow-emit-sky/10"
          >
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero & Slides Container */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-12 lg:grid lg:grid-cols-2 lg:gap-16 max-w-7xl mx-auto w-full">
        {/* Left Side: Text and Slides controller */}
        <div className="flex flex-col justify-center space-y-6 text-left max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-emit-sky">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Portail EMIT Officiel
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
              Gestion Simplifiée des <br />
              <span className="bg-gradient-to-r from-emit-sky to-white bg-clip-text text-transparent">
                Emplois du Temps
              </span>
            </h1>
            <p className="text-base text-slate-300 md:text-lg leading-relaxed">
              Une plateforme moderne développée pour l'École de Management et d'Innovation Technologique (EMIT) afin de structurer et d'organiser les cours efficacement.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              id="cta-connect"
              size="lg"
              onClick={() => navigate("/login")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="bg-white text-emit-navy hover:bg-emit-sky hover:text-emit-navy transition-all px-8 py-3.5 shadow-lg shadow-white/5"
            >
              Se connecter
            </Button>
            <Button
              id="cta-edt-public"
              variant="outline"
              size="lg"
              onClick={() => navigate("/edt")}
              leftIcon={<CalendarDays className="h-5 w-5" />}
              className="border-white/20 text-white hover:bg-white/5 hover:border-white/40 px-6"
            >
              Emploi du temps public
            </Button>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Zéro Conflit</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Salles et profs alignés</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Synchronisé</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Mis à jour instantanément</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Slide/Presentation Cards */}
        <div className="relative mt-12 w-full lg:mt-0 flex flex-col items-center">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 p-6 md:p-8 shadow-2xl relative">
            {/* Slide content with animations */}
            <div className="space-y-6 transition-all duration-500">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emit-sky/20 px-2.5 py-1 text-xs font-semibold text-emit-sky">
                  {slides[activeSlide].badge}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                  {slides[activeSlide].icon}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white leading-snug">
                  {slides[activeSlide].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {slides[activeSlide].description}
                </p>
              </div>

              {/* Dynamic Illustration based on active slide */}
              <div className="h-44 w-full mt-4">
                {slides[activeSlide].illustration}
              </div>
            </div>

            {/* Slide navigation controls */}
            <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4">
              <div className="flex gap-1.5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeSlide ? "w-6 bg-emit-sky" : "w-2 bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-6 text-center text-xs text-slate-500 border-t border-white/5 bg-emit-navy/20">
        <p>© 2026 École de Management et d'Innovation Technologique (EMIT). Tous droits réservés.</p>
      </footer>
    </div>
  );
}
