# Intégration frontend ↔ backend EMIT

Ce frontend React est maintenant branché sur l'API **ASP.NET Core (`Emit.Api`)** fournie séparément.

## 1. Configurer l'URL du backend

Copier `.env.example` → `.env` :

```bash
cp .env.example .env
```

Et adapter :

```
VITE_API_URL=https://localhost:5001
```

> ⚠️ Si le backend tourne en HTTPS auto-signé, accepter le certificat dans le navigateur
> (visiter `https://localhost:5001/swagger` une fois) avant de lancer le frontend.

## 2. Lancer

```bash
npm install
npm run dev
```

Backend (dans le projet `Emit.Api`) :

```bash
dotnet ef database update
dotnet run
```

## 3. Architecture du branchement

| Fichier | Rôle |
|---|---|
| `src/lib/api.ts` | Client HTTP typé : auth, enseignants, salles, cours, niveaux, semestres, EDT, notifications, journal, disponibilités. Gère automatiquement le **JWT** (`Authorization: Bearer …`). |
| `src/context/AuthContext.tsx` | Login réel via `POST /api/auth/login`, stockage du token + user dans `localStorage`, revalidation auto via `GET /api/auth/me`. |
| `src/context/DataContext.tsx` | Charge en parallèle toutes les ressources au montage (`useData()`) et expose : `enseignants`, `salles`, `cours`, `niveaux`, `semestres`, `edt`, `notifications`, `journal` + `refresh()`. |
| `src/data/mock.ts` | Conservé **uniquement** pour les constantes UI (`CRENEAUX`, `JOURS`) et les données d'affichage statiques (`conflits`, `statutNiveaux`) que le backend ne fournit pas encore. |

## 4. Endpoints attendus côté API

Tous correspondent à ce que `Emit.Api` expose :

```
POST   /api/auth/login              → { token, user }
GET    /api/auth/me                 → user

GET    /api/enseignants             POST /api/enseignants
PUT    /api/enseignants/{id}        DELETE /api/enseignants/{id}

GET    /api/salles                  POST /api/salles
PUT    /api/salles/{id}             DELETE /api/salles/{id}

GET    /api/niveaux                 (avec filières imbriquées)

GET    /api/cours                   POST /api/cours
PUT    /api/cours/{id}              DELETE /api/cours/{id}

GET    /api/semestres
POST   /api/semestres/{id}/publier

GET    /api/edt?niveau=&filiere=&semestreId=
GET    /api/edt/me?semestreId=
POST   /api/edt/generate/{semestreId}

GET    /api/notifications
POST   /api/notifications/{id}/read

GET    /api/journal

GET    /api/disponibilites/me
PUT    /api/disponibilites/me
GET    /api/disponibilites/{enseignantId}
```

## 5. CORS

Vérifier que `Emit.Api/Program.cs` autorise l'origine du front :

```csharp
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173")
     .AllowAnyHeader()
     .AllowAnyMethod()));
```

## 6. Comptes de test (seed du backend)

- Admin : `admin@emit.mg` / `Admin@123`
- Enseignant : compte créé via `/api/enseignants` (un user lié sera auto-généré).

## 7. Ajouter une mutation (exemple)

```tsx
import { apiCreateEnseignant } from "@/lib/api";
import { useData } from "@/context/DataContext";

const { refresh } = useData();
await apiCreateEnseignant({ prenom, nom, email, specialite, statut });
await refresh();      // recharge la liste depuis l'API
```
