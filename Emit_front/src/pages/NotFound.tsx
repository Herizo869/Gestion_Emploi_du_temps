import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-emit-navy">404</p>
        <p className="mt-2 text-lg text-slate-600">Page introuvable</p>
        <Link to="/edt" className="mt-6 inline-block rounded-lg bg-emit-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-emit-navy-dark">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
