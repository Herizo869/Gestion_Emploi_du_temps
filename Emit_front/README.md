# EMIT Planner — React + TypeScript + Tailwind CSS v4

Système de gestion d'emploi du temps et des salles pour EMIT
(École de Management et d'Innovation Technologique).

## Stack

- **React 19** + **TypeScript**
- **Vite 6** (build tool)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router v7**
- **Lucide React** (icônes)

## Installation

```bash
npm install        # ou bun install
npm run dev        # ou bun run dev
```

Puis ouvrir http://localhost:5173.

## Comptes de démo

| Rôle       | Email             | Mot de passe |
|------------|-------------------|--------------|
| Admin      | admin@emit.mg     | admin123     |
| Enseignant | herizo@emit.mg    | prof123      |

Sur la page de login, deux boutons "Accès rapide (dev)" pré-remplissent
les champs.

## Pages implémentées

### Public (sans login)
- `/edt` — Page publique emploi du temps étudiant (filtres niveau/filière/type, navigation semaine, légende, message si aucun EDT publié)

### Auth & layout (Herizo)
- `/login` — Connexion avec validation, accès rapide dev
- Sidebar dynamique selon rôle, topbar avec breadcrumb + notifications dropdown

### Admin (10 pages)
- `/admin/dashboard` — Stats, conflits, statut niveaux, occupation, activité
- `/admin/enseignants` — CRUD complet + modal + filtres
- `/admin/salles` — Liste, toggle disponibilité, badges par type, occupation
- `/admin/cours` — CRUD + multi-select enseignants + avancement
- `/admin/niveaux` — Arborescence niveaux → filières
- `/admin/semestres` — Liste avec statut, créateur, créneaux
- `/admin/disponibilites` — Grille interactive admin
- `/admin/generer` — Lancement algo + barre progression + rapport
- `/admin/edt` — Édition manuelle + modal slot + détection conflit + suggestions
- `/admin/export` — PDF portrait/paysage, CSV, lien public, publication
- `/admin/historique` — Journal avec filtres et bouton Undo

### Enseignant (5 pages)
- `/enseignant/dashboard` — En-tête, stats x4, planning, cours, notifs
- `/enseignant/cours` — Tableau cours avec avancement
- `/enseignant/disponibilites` — Grille interactive
- `/enseignant/profil` — Profil + mdp avec barre de force
- `/enseignant/notifications` — Liste filtrée + marquage lu

## Structure

```
src/
  components/        Composants partagés (UI, Sidebar, Topbar, WeeklyGrid)
  context/           AuthContext (mock auth localStorage)
  data/              Données mock
  layouts/           AdminLayout, EnseignantLayout
  pages/
    admin/           10 pages admin
    enseignant/      5 pages enseignant
    public/          Page publique
    Login.tsx
    NotFound.tsx
  App.tsx
  main.tsx
  index.css          Tailwind v4 + tokens couleur EMIT
  types.ts
```

## Notes

- L'authentification est mockée côté client (localStorage). En prod,
  brancher sur une API + tokens JWT et hash bcrypt côté serveur.
- Les données sont en dur dans `src/data/mock.ts` — remplacer par des
  appels API quand le backend sera prêt.
- La génération de l'EDT est une simulation visuelle (barre de progression).
  L'algorithme réel (backtracking) reste à implémenter côté serveur.
