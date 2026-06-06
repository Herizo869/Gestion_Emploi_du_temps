# EMIT API — ASP.NET Core 8 + PostgreSQL + JWT

Backend pour le frontend React EMIT (gestion des emplois du temps).

## Stack

- **.NET 8** Web API (controllers)
- **PostgreSQL** via Npgsql + Entity Framework Core 8
- **JWT Bearer** auth + **BCrypt** (mots de passe hashés)
- **AutoMapper** pour les DTO
- **Swagger** (`/swagger`)
- Service de **génération automatique d'EDT** intégré (v1)

## 1. Prérequis

- .NET 8 SDK : <https://dotnet.microsoft.com/download>
- PostgreSQL 14+ en cours d'exécution
- `dotnet tool install --global dotnet-ef`

## 2. Configuration

Édite `appsettings.json` :

```json
"ConnectionStrings": {
  "Default": "Host=localhost;Port=5432;Database=emit_db;Username=postgres;Password=postgres"
},
"Jwt": {
  "Key": "GENERE_UNE_CLE_DE_AU_MOINS_32_CARACTERES",
  "Issuer": "EmitApi",
  "Audience": "EmitFront",
  "ExpiresMinutes": 120
}
```

Crée la base :
```sql
CREATE DATABASE emit_db;
```

## 3. Migrations + lancement

```bash
dotnet restore
dotnet ef migrations add Init
dotnet run
```

Au premier lancement, `DbSeeder` insère :
- 5 enseignants, 6 salles, 5 niveaux, 7 filières, 6 cours, 2 semestres
- Compte admin : **admin@emit.mg** / **Admin@123**
- Compte enseignant : **herizo@emit.mg** / **Enseignant@123**

API disponible sur `https://localhost:5001` — Swagger : `https://localhost:5001/swagger`.

## 4. Endpoints principaux

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/auth/login` | public | Connexion → JWT |
| POST | `/api/auth/register` | Admin | Créer un user |
| GET | `/api/auth/me` | auth | Profil courant |
| GET/POST/PUT/DELETE | `/api/enseignants[/{id}]` | auth / Admin | CRUD |
| GET/POST/PUT/DELETE | `/api/salles[/{id}]` | auth / Admin | CRUD |
| GET/POST/PUT/DELETE | `/api/cours[/{id}]` | auth / Admin | CRUD |
| GET | `/api/cours/me` | Enseignant | Mes cours |
| GET/POST | `/api/niveaux`, `/api/filieres` | auth / Admin | CRUD |
| GET/POST/DELETE | `/api/semestres` | auth / Admin | CRUD |
| POST | `/api/semestres/{id}/publish` | Admin | Publier |
| GET | `/api/edt?semestreId=&niveauId=&filiereId=` | auth | Filtrage EDT |
| GET | `/api/edt/me?semestreId=` | Enseignant | Mon EDT |
| POST | `/api/edt/generate/{semestreId}` | Admin | Génération auto |
| GET | `/api/edt/{semestreId}/conflits` | Admin | Détection conflits |
| GET / PATCH | `/api/notifications`, `.../{id}/read` | auth | Notifications |
| GET | `/api/journal` | Admin | Journal d'actions |

## 5. Brancher le frontend React

Dans le projet React, crée `src/lib/api.ts` :

```ts
const BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001/api";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}
```

Dans `.env` du frontend :
```
VITE_API_URL=https://localhost:5001/api
```

Exemples d'usage :
```ts
const { token, user } = await api("/auth/login", { method:"POST",
  body: JSON.stringify({ email, password }) });
localStorage.setItem("token", token);

const enseignants = await api("/enseignants");
const monEdt = await api(`/edt/me?semestreId=${semestreId}`);
await api(`/edt/generate/${semestreId}`, { method:"POST" });
```

## 6. Génération automatique d'EDT

`EdtGeneratorService.GenerateAsync(semestreId)` :
1. Supprime les slots existants du semestre.
2. Itère sur les cours du plus volumineux au plus petit.
3. Pour chaque cours, cherche `(jour × créneau × salle compatible)` sans collision enseignant/salle/groupe.
4. Crée les `SlotEDT` correspondants et met à jour `Cours.HeuresPlanifiees`.
5. Renvoie le nombre de slots créés, la liste des cours non placés, et les conflits restants.

Les **index uniques composites** sur `SlotEDT` (`Semestre+Jour+Heure × Enseignant/Salle/(Niveau,Filière)`) protègent la base contre tout doublon, même en cas d'insertion concurrente.

## 7. Sécurité

- Mots de passe : BCrypt (`BCrypt.Net-Next`).
- JWT 2h, signé HS256.
- `[Authorize(Roles="Admin")]` sur toute écriture sensible.
- `enseignantId` ajouté en claim pour scoper les requêtes "/me".
- CORS limité aux origines listées dans `Cors:Origins`.

## 8. Choix techniques

- **JWT + BCrypt** (au lieu d'ASP.NET Identity) : plus léger, suffisant pour cette app, et plus simple à brancher sur le front React. ASP.NET Identity reste pertinent si tu ajoutes plus tard : reset mot de passe par email, 2FA, lockout, providers externes.

## 9. Production

- Génère une vraie clé : `openssl rand -base64 64` → `Jwt:Key`.
- Active HTTPS.
- Variables d'env : `ASPNETCORE_ENVIRONMENT=Production`, `ConnectionStrings__Default=...`, `Jwt__Key=...`.
- Restreins `Cors:Origins` au domaine du front.
