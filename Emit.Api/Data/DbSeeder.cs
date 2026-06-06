using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Data;

public static class DbSeeder
{
        public static async Task SeedAsync(AppDbContext db)
    {
        // En environnement de développement rapide, EnsureCreatedAsync crée le schéma
        // si aucune migration n'a été appliquée. Pour la production, préférez
        // db.Database.MigrateAsync() et appliquez les migrations explicitement.
        await db.Database.EnsureCreatedAsync();
        if (await db.Users.AnyAsync()) return;

        // --- Enseignants ---
        var e1 = new Enseignant { Prenom = "Herizo", Nom = "RAKOTO", Email = "herizo@emit.mg", Specialite = "Génie logiciel", Statut = StatutEnseignant.Permanent };
        var e2 = new Enseignant { Prenom = "Miaro", Nom = "RABE", Email = "miaro@emit.mg", Specialite = "Bases de données", Statut = StatutEnseignant.Permanent };
        var e3 = new Enseignant { Prenom = "Andry", Nom = "RANAIVO", Email = "andry@emit.mg", Specialite = "Réseaux", Statut = StatutEnseignant.Vacataire };
        var e4 = new Enseignant { Prenom = "Kanto", Nom = "RASOLO", Email = "kanto@emit.mg", Specialite = "Algorithmique", Statut = StatutEnseignant.Permanent };
        var e5 = new Enseignant { Prenom = "Fita", Nom = "RANDRIA", Email = "fita@emit.mg", Specialite = "Web & Mobile", Statut = StatutEnseignant.Invite };
        db.Enseignants.AddRange(e1, e2, e3, e4, e5);

        // --- Salles ---
        db.Salles.AddRange(
            new Salle { Numero = "A101", Batiment = "A", Capacite = 40, Type = TypeSalle.Cours, Disponible = true },
            new Salle { Numero = "A102", Batiment = "A", Capacite = 40, Type = TypeSalle.Cours, Disponible = true },
            new Salle { Numero = "B201", Batiment = "B", Capacite = 25, Type = TypeSalle.TP, Disponible = true },
            new Salle { Numero = "B202", Batiment = "B", Capacite = 25, Type = TypeSalle.TP, Disponible = false },
            new Salle { Numero = "AMPHI-1", Batiment = "C", Capacite = 200, Type = TypeSalle.Amphi, Disponible = true },
            new Salle { Numero = "AMPHI-2", Batiment = "C", Capacite = 150, Type = TypeSalle.Amphi, Disponible = true }
        );

        // --- Niveaux + Filieres ---
        var n1 = new Niveau { Libelle = NiveauLibelle.L1, EffectifMax = 120 };
        var n2 = new Niveau { Libelle = NiveauLibelle.L2, EffectifMax = 100 };
        var n3 = new Niveau { Libelle = NiveauLibelle.L3, EffectifMax = 80 };
        var n4 = new Niveau { Libelle = NiveauLibelle.M1, EffectifMax = 50 };
        var n5 = new Niveau { Libelle = NiveauLibelle.M2, EffectifMax = 40 };
        db.Niveaux.AddRange(n1, n2, n3, n4, n5);

        var f1 = new Filiere { Libelle = "INFO", Description = "Informatique", Niveau = n1 };
        var f2 = new Filiere { Libelle = "RESEAUX", Description = "Réseaux & Télécoms", Niveau = n1 };
        var f3 = new Filiere { Libelle = "INFO", Description = "Informatique", Niveau = n2 };
        var f4 = new Filiere { Libelle = "INFO", Description = "Informatique", Niveau = n3 };
        var f5 = new Filiere { Libelle = "RESEAUX", Description = "Réseaux", Niveau = n3 };
        var f6 = new Filiere { Libelle = "GL", Description = "Génie logiciel", Niveau = n4 };
        var f7 = new Filiere { Libelle = "GL", Description = "Génie logiciel", Niveau = n5 };
        db.Filieres.AddRange(f1, f2, f3, f4, f5, f6, f7);

        // --- Cours ---
        var c1 = new Cours { Intitule = "Algorithmique", Type = CoursType.CM, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = n1, Filiere = f1 };
        var c3 = new Cours { Intitule = "Bases de données", Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = n2, Filiere = f3 };
        var c5 = new Cours { Intitule = "Génie logiciel", Type = CoursType.CM, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = n3, Filiere = f4 };
        var c6 = new Cours { Intitule = "Web & Mobile", Type = CoursType.TP, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = n3, Filiere = f4 };
        var c7 = new Cours { Intitule = "Architectures réseaux", Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = n3, Filiere = f5 };
        var c8 = new Cours { Intitule = "DevOps", Type = CoursType.TP, VolumeHoraire = 16, HeuresPlanifiees = 0, Niveau = n4, Filiere = f6 };
        db.Cours.AddRange(c1, c3, c5, c6, c7, c8);

        db.CoursEnseignants.AddRange(
            new CoursEnseignant { Cours = c1, Enseignant = e4 },
            new CoursEnseignant { Cours = c3, Enseignant = e2 },
            new CoursEnseignant { Cours = c5, Enseignant = e1 },
            new CoursEnseignant { Cours = c6, Enseignant = e5 },
            new CoursEnseignant { Cours = c7, Enseignant = e3 },
            new CoursEnseignant { Cours = c8, Enseignant = e1 }
        );

        // --- Semestres ---
        db.Semestres.AddRange(
            new Semestre { Libelle = "Semestre 1", Annee = "2024-2025", Statut = StatutSemestre.Publie, DatePublication = DateTime.UtcNow.AddDays(-30) },
            new Semestre { Libelle = "Semestre 2", Annee = "2024-2025", Statut = StatutSemestre.Brouillon }
        );

        // --- Users ---
        db.Users.Add(new User
        {
            Prenom = "Super",
            Nom = "Admin",
            Email = "admin@emit.mg",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = Role.Admin
        });
        db.Users.Add(new User
        {
            Prenom = e1.Prenom,
            Nom = e1.Nom,
            Email = e1.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Enseignant@123"),
            Role = Role.Enseignant,
            Enseignant = e1
        });

        await db.SaveChangesAsync();
    }
}
