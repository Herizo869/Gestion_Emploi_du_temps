using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();
        if (await db.Users.AnyAsync()) return;

        // ══════════════════════════════════════════════════
        // ENSEIGNANTS
        // ══════════════════════════════════════════════════
        var e1 = new Enseignant { Prenom = "Herizo",  Nom = "RAKOTO",  Email = "herizo@emit.mg",  Specialite = "Génie logiciel",      Statut = StatutEnseignant.Permanent };
        var e2 = new Enseignant { Prenom = "Miaro",   Nom = "RABE",    Email = "miaro@emit.mg",   Specialite = "Bases de données",     Statut = StatutEnseignant.Permanent };
        var e3 = new Enseignant { Prenom = "Andry",   Nom = "RANAIVO", Email = "andry@emit.mg",   Specialite = "Réseaux",              Statut = StatutEnseignant.Vacataire };
        var e4 = new Enseignant { Prenom = "Kanto",   Nom = "RASOLO",  Email = "kanto@emit.mg",   Specialite = "Algorithmique",        Statut = StatutEnseignant.Permanent };
        var e5 = new Enseignant { Prenom = "Fita",    Nom = "RANDRIA", Email = "fita@emit.mg",    Specialite = "Web & Mobile",         Statut = StatutEnseignant.Invite };
        var e6 = new Enseignant { Prenom = "Lalao",   Nom = "RAJOANA", Email = "lalao@emit.mg",   Specialite = "Management",           Statut = StatutEnseignant.Permanent };
        var e7 = new Enseignant { Prenom = "Hery",    Nom = "RAJAO",   Email = "hery@emit.mg",    Specialite = "Communication",        Statut = StatutEnseignant.Permanent };
        var e8 = new Enseignant { Prenom = "Tiana",   Nom = "RAKOT",   Email = "tiana@emit.mg",   Specialite = "Intelligence Artificielle", Statut = StatutEnseignant.Permanent };
        var e9 = new Enseignant { Prenom = "Nivo",    Nom = "RAMAD",   Email = "nivo@emit.mg",    Specialite = "Géomatique & SIG",     Statut = StatutEnseignant.Vacataire };
        db.Enseignants.AddRange(e1, e2, e3, e4, e5, e6, e7, e8, e9);

        // ══════════════════════════════════════════════════
        // SALLES
        // ══════════════════════════════════════════════════
        db.Salles.AddRange(
            new Salle { Numero = "A101",   Batiment = "A", Capacite = 40,  Type = TypeSalle.Cours,  Disponible = true  },
            new Salle { Numero = "A102",   Batiment = "A", Capacite = 40,  Type = TypeSalle.Cours,  Disponible = true  },
            new Salle { Numero = "A103",   Batiment = "A", Capacite = 40,  Type = TypeSalle.Cours,  Disponible = true  },
            new Salle { Numero = "B201",   Batiment = "B", Capacite = 25,  Type = TypeSalle.TP,     Disponible = true  },
            new Salle { Numero = "B202",   Batiment = "B", Capacite = 25,  Type = TypeSalle.TP,     Disponible = false },
            new Salle { Numero = "B203",   Batiment = "B", Capacite = 25,  Type = TypeSalle.TP,     Disponible = true  },
            new Salle { Numero = "AMPHI-1",Batiment = "C", Capacite = 200, Type = TypeSalle.Amphi,  Disponible = true  },
            new Salle { Numero = "AMPHI-2",Batiment = "C", Capacite = 150, Type = TypeSalle.Amphi,  Disponible = true  }
        );

        // ══════════════════════════════════════════════════
        // NIVEAUX
        // ══════════════════════════════════════════════════
        var nL1 = new Niveau { Libelle = NiveauLibelle.L1, EffectifMax = 120 };
        var nL2 = new Niveau { Libelle = NiveauLibelle.L2, EffectifMax = 100 };
        var nL3 = new Niveau { Libelle = NiveauLibelle.L3, EffectifMax = 80  };
        var nM1 = new Niveau { Libelle = NiveauLibelle.M1, EffectifMax = 50  };
        var nM2 = new Niveau { Libelle = NiveauLibelle.M2, EffectifMax = 40  };
        db.Niveaux.AddRange(nL1, nL2, nL3, nM1, nM2);

        // ══════════════════════════════════════════════════
        // FILIÈRES — LICENCE (L1, L2, L3)
        //
        // Chaque domaine partage ses filières sur les 3 années de licence.
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Domaine : Licence Management
        var fL1_AES  = new Filiere { Libelle = "AES",  Description = "Administration Économique et Sociale",          Domaine = "Licence Management",                    Niveau = nL1 };
        var fL2_AES  = new Filiere { Libelle = "AES",  Description = "Administration Économique et Sociale",          Domaine = "Licence Management",                    Niveau = nL2 };
        var fL3_AES  = new Filiere { Libelle = "AES",  Description = "Administration Économique et Sociale",          Domaine = "Licence Management",                    Niveau = nL3 };

        // Domaine : Licence Informatique
        var fL1_DA2I  = new Filiere { Libelle = "DA2I",  Description = "Développement d'Application Internet-Intranet",               Domaine = "Licence Informatique", Niveau = nL1 };
        var fL2_DA2I  = new Filiere { Libelle = "DA2I",  Description = "Développement d'Application Internet-Intranet",               Domaine = "Licence Informatique", Niveau = nL2 };
        var fL3_DA2I  = new Filiere { Libelle = "DA2I",  Description = "Développement d'Application Internet-Intranet",               Domaine = "Licence Informatique", Niveau = nL3 };

        var fL1_CIGSI = new Filiere { Libelle = "CIGSI", Description = "Conception, Intégration et Gestion des Systèmes d'Information",Domaine = "Licence Informatique", Niveau = nL1 };
        var fL2_CIGSI = new Filiere { Libelle = "CIGSI", Description = "Conception, Intégration et Gestion des Systèmes d'Information",Domaine = "Licence Informatique", Niveau = nL2 };
        var fL3_CIGSI = new Filiere { Libelle = "CIGSI", Description = "Conception, Intégration et Gestion des Systèmes d'Information",Domaine = "Licence Informatique", Niveau = nL3 };

        // Domaine : Licence Information et Communication
        var fL1_ICM  = new Filiere { Libelle = "ICM",  Description = "Information et Communication Multimédia",      Domaine = "Licence Information et Communication",   Niveau = nL1 };
        var fL2_ICM  = new Filiere { Libelle = "ICM",  Description = "Information et Communication Multimédia",      Domaine = "Licence Information et Communication",   Niveau = nL2 };
        var fL3_ICM  = new Filiere { Libelle = "ICM",  Description = "Information et Communication Multimédia",      Domaine = "Licence Information et Communication",   Niveau = nL3 };

        // ══════════════════════════════════════════════════
        // FILIÈRES — MASTER (M1, M2)
        //
        // Domaine : Master Management
        var fM1_MD    = new Filiere { Libelle = "MD",      Description = "Management Décisionnel",                           Domaine = "Master Management", Niveau = nM1 };
        var fM2_MD    = new Filiere { Libelle = "MD",      Description = "Management Décisionnel",                           Domaine = "Master Management", Niveau = nM2 };

        var fM1_MEDA  = new Filiere { Libelle = "MEDA",    Description = "Management d'Entreprises et Développement des Affaires", Domaine = "Master Management", Niveau = nM1 };
        var fM2_MEDA  = new Filiere { Libelle = "MEDA",    Description = "Management d'Entreprises et Développement des Affaires", Domaine = "Master Management", Niveau = nM2 };

        var fM1_MBAg  = new Filiere { Libelle = "MBA-GEN", Description = "MBA Général",                                     Domaine = "Master Management", Niveau = nM1 };
        var fM2_MBAg  = new Filiere { Libelle = "MBA-GEN", Description = "MBA Général",                                     Domaine = "Master Management", Niveau = nM2 };

        var fM1_MBABA = new Filiere { Libelle = "MBA-BA",  Description = "MBA Business Analytics",                          Domaine = "Master Management", Niveau = nM1 };
        var fM2_MBABA = new Filiere { Libelle = "MBA-BA",  Description = "MBA Business Analytics",                          Domaine = "Master Management", Niveau = nM2 };

        var fM1_MBAFI = new Filiere { Libelle = "MBA-FI",  Description = "MBA Finance and Investment",                      Domaine = "Master Management", Niveau = nM1 };
        var fM2_MBAFI = new Filiere { Libelle = "MBA-FI",  Description = "MBA Finance and Investment",                      Domaine = "Master Management", Niveau = nM2 };

        // Domaine : Master Informatique
        var fM1_SIGD  = new Filiere { Libelle = "SIGD",  Description = "Système d'Information, Géomatique et Décision",     Domaine = "Master Informatique", Niveau = nM1 };
        var fM2_SIGD  = new Filiere { Libelle = "SIGD",  Description = "Système d'Information, Géomatique et Décision",     Domaine = "Master Informatique", Niveau = nM2 };

        var fM1_M2I   = new Filiere { Libelle = "M2I",   Description = "Modélisation et Ingénierie Informatique",           Domaine = "Master Informatique", Niveau = nM1 };
        var fM2_M2I   = new Filiere { Libelle = "M2I",   Description = "Modélisation et Ingénierie Informatique",           Domaine = "Master Informatique", Niveau = nM2 };

        var fM1_SDIA  = new Filiere { Libelle = "SDIA",  Description = "Sciences de Données et Intelligence Artificielle",  Domaine = "Master Informatique", Niveau = nM1 };
        var fM2_SDIA  = new Filiere { Libelle = "SDIA",  Description = "Sciences de Données et Intelligence Artificielle",  Domaine = "Master Informatique", Niveau = nM2 };

        var fM1_IGTI  = new Filiere { Libelle = "IGTI",  Description = "Ingénierie Géospatiale et Technologies de l'Information", Domaine = "Master Informatique", Niveau = nM1 };
        var fM2_IGTI  = new Filiere { Libelle = "IGTI",  Description = "Ingénierie Géospatiale et Technologies de l'Information", Domaine = "Master Informatique", Niveau = nM2 };

        // Domaine : Master Information, Communication et Multimédia
        var fM1_MICM  = new Filiere { Libelle = "MICM",  Description = "Information et Communication Multimédia",            Domaine = "Master Information, Communication et Multimédia", Niveau = nM1 };
        var fM2_MICM  = new Filiere { Libelle = "MICM",  Description = "Information et Communication Multimédia",            Domaine = "Master Information, Communication et Multimédia", Niveau = nM2 };

        var fM1_CNMP  = new Filiere { Libelle = "CNMP",  Description = "Communication Numérique et Management de Projet",   Domaine = "Master Information, Communication et Multimédia", Niveau = nM1 };
        var fM2_CNMP  = new Filiere { Libelle = "CNMP",  Description = "Communication Numérique et Management de Projet",   Domaine = "Master Information, Communication et Multimédia", Niveau = nM2 };

        var fM1_CM    = new Filiere { Libelle = "CM",    Description = "Communication Multimédia",                           Domaine = "Master Information, Communication et Multimédia", Niveau = nM1 };
        var fM2_CM    = new Filiere { Libelle = "CM",    Description = "Communication Multimédia",                           Domaine = "Master Information, Communication et Multimédia", Niveau = nM2 };

        var fM1_CINE  = new Filiere { Libelle = "CINE",  Description = "Cinématographie",                                   Domaine = "Master Information, Communication et Multimédia", Niveau = nM1 };
        var fM2_CINE  = new Filiere { Libelle = "CINE",  Description = "Cinématographie",                                   Domaine = "Master Information, Communication et Multimédia", Niveau = nM2 };

        db.Filieres.AddRange(
            // Licence
            fL1_AES,  fL2_AES,  fL3_AES,
            fL1_DA2I, fL2_DA2I, fL3_DA2I,
            fL1_CIGSI,fL2_CIGSI,fL3_CIGSI,
            fL1_ICM,  fL2_ICM,  fL3_ICM,
            // Master Management
            fM1_MD,   fM2_MD,
            fM1_MEDA, fM2_MEDA,
            fM1_MBAg, fM2_MBAg,
            fM1_MBABA,fM2_MBABA,
            fM1_MBAFI,fM2_MBAFI,
            // Master Informatique
            fM1_SIGD, fM2_SIGD,
            fM1_M2I,  fM2_M2I,
            fM1_SDIA, fM2_SDIA,
            fM1_IGTI, fM2_IGTI,
            // Master Info-Com-Multimedia
            fM1_MICM, fM2_MICM,
            fM1_CNMP, fM2_CNMP,
            fM1_CM,   fM2_CM,
            fM1_CINE, fM2_CINE
        );

        // ══════════════════════════════════════════════════
        // COURS (exemples représentatifs par filière)
        // ══════════════════════════════════════════════════
        // --- Licence Informatique - DA2I ---
        var cAlgo    = new Cours { Intitule = "Algorithmique",               Type = CoursType.CM, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nL1, Filiere = fL1_DA2I };
        var cProgWeb = new Cours { Intitule = "Programmation Web",           Type = CoursType.TP, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = nL2, Filiere = fL2_DA2I };
        var cDevMob  = new Cours { Intitule = "Développement Mobile",        Type = CoursType.TP, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nL3, Filiere = fL3_DA2I };
        // --- Licence Informatique - CIGSI ---
        var cSI      = new Cours { Intitule = "Systèmes d'Information",      Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nL1, Filiere = fL1_CIGSI };
        var cBDD     = new Cours { Intitule = "Bases de Données",            Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nL2, Filiere = fL2_CIGSI };
        var cGL      = new Cours { Intitule = "Génie Logiciel",              Type = CoursType.CM, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = nL3, Filiere = fL3_CIGSI };
        // --- Licence Management - AES ---
        var cEco     = new Cours { Intitule = "Introduction à l'Économie",   Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nL1, Filiere = fL1_AES };
        var cCompta  = new Cours { Intitule = "Comptabilité Générale",       Type = CoursType.CM, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nL2, Filiere = fL2_AES };
        var cGRH     = new Cours { Intitule = "Gestion des Ressources Humaines", Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nL3, Filiere = fL3_AES };
        // --- Licence Info-Com - ICM ---
        var cComBase = new Cours { Intitule = "Introduction à la Communication", Type = CoursType.CM, VolumeHoraire = 18, HeuresPlanifiees = 0, Niveau = nL1, Filiere = fL1_ICM };
        var cMedia   = new Cours { Intitule = "Médias Numériques",           Type = CoursType.TP, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nL2, Filiere = fL2_ICM };
        var cMulti   = new Cours { Intitule = "Production Multimédia",       Type = CoursType.TP, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nL3, Filiere = fL3_ICM };
        // --- Master Informatique ---
        var cIA      = new Cours { Intitule = "Intelligence Artificielle",   Type = CoursType.CM, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_SDIA };
        var cBigData = new Cours { Intitule = "Big Data & Analytics",        Type = CoursType.TP, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nM2, Filiere = fM2_SDIA };
        var cGIS     = new Cours { Intitule = "Systèmes d'Information Géographiques", Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_SIGD };
        var cM2Ing   = new Cours { Intitule = "Architecture Logicielle",     Type = CoursType.CM, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_M2I };
        var cGeosp   = new Cours { Intitule = "Télédétection & Géospatial",  Type = CoursType.TP, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_IGTI };
        // --- Master Management ---
        var cStrateg = new Cours { Intitule = "Management Stratégique",      Type = CoursType.CM, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_MD };
        var cFinance = new Cours { Intitule = "Finance d'Entreprise",        Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_MEDA };
        var cMBAcore = new Cours { Intitule = "MBA Fondamentaux",            Type = CoursType.CM, VolumeHoraire = 30, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_MBAg };
        // --- Master Info-Com-Multimedia ---
        var cComNum  = new Cours { Intitule = "Communication Numérique",     Type = CoursType.CM, VolumeHoraire = 20, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_CNMP };
        var cCinema  = new Cours { Intitule = "Réalisation Cinématographique", Type = CoursType.TP, VolumeHoraire = 24, HeuresPlanifiees = 0, Niveau = nM1, Filiere = fM1_CINE };

        db.Cours.AddRange(
            cAlgo, cProgWeb, cDevMob,
            cSI, cBDD, cGL,
            cEco, cCompta, cGRH,
            cComBase, cMedia, cMulti,
            cIA, cBigData, cGIS, cM2Ing, cGeosp,
            cStrateg, cFinance, cMBAcore,
            cComNum, cCinema
        );

        // Affectation enseignants → cours
        db.CoursEnseignants.AddRange(
            new CoursEnseignant { Cours = cAlgo,    Enseignant = e4 },
            new CoursEnseignant { Cours = cProgWeb, Enseignant = e5 },
            new CoursEnseignant { Cours = cDevMob,  Enseignant = e5 },
            new CoursEnseignant { Cours = cSI,      Enseignant = e2 },
            new CoursEnseignant { Cours = cBDD,     Enseignant = e2 },
            new CoursEnseignant { Cours = cGL,      Enseignant = e1 },
            new CoursEnseignant { Cours = cEco,     Enseignant = e6 },
            new CoursEnseignant { Cours = cCompta,  Enseignant = e6 },
            new CoursEnseignant { Cours = cGRH,     Enseignant = e6 },
            new CoursEnseignant { Cours = cComBase, Enseignant = e7 },
            new CoursEnseignant { Cours = cMedia,   Enseignant = e7 },
            new CoursEnseignant { Cours = cMulti,   Enseignant = e7 },
            new CoursEnseignant { Cours = cIA,      Enseignant = e8 },
            new CoursEnseignant { Cours = cBigData, Enseignant = e8 },
            new CoursEnseignant { Cours = cGIS,     Enseignant = e9 },
            new CoursEnseignant { Cours = cM2Ing,   Enseignant = e1 },
            new CoursEnseignant { Cours = cGeosp,   Enseignant = e9 },
            new CoursEnseignant { Cours = cStrateg, Enseignant = e6 },
            new CoursEnseignant { Cours = cFinance, Enseignant = e6 },
            new CoursEnseignant { Cours = cMBAcore, Enseignant = e6 },
            new CoursEnseignant { Cours = cComNum,  Enseignant = e7 },
            new CoursEnseignant { Cours = cCinema,  Enseignant = e7 }
        );

        // ══════════════════════════════════════════════════
        // SEMESTRES
        // ══════════════════════════════════════════════════
        var semestre1 = new Semestre { Libelle = "Semestre 1", Annee = "2024-2025", Statut = StatutSemestre.Publie,   DatePublication = DateTime.UtcNow.AddDays(-30) };
        var semestre2 = new Semestre { Libelle = "Semestre 2", Annee = "2024-2025", Statut = StatutSemestre.Brouillon };
        db.Semestres.AddRange(semestre1, semestre2);

        // EDT publie: un cours + un creneau pour chaque niveau/filiere afin que tous les emplois du temps affichent des donnees.
        var seedTeachers = new[] { e1, e2, e3, e4, e5, e6, e7, e8, e9 };
        var seedRooms = db.Salles.Local.Where(s => s.Disponible).ToArray();
        var seedFilieres = db.Filieres.Local.ToArray();
        var seedDays = new[] { Jour.Lundi, Jour.Mardi, Jour.Mercredi, Jour.Jeudi, Jour.Vendredi };
        var seedHours = new[]
        {
            (debut: new TimeOnly(7, 30), fin: new TimeOnly(9, 0)),
            (debut: new TimeOnly(9, 15), fin: new TimeOnly(10, 45)),
            (debut: new TimeOnly(11, 0), fin: new TimeOnly(12, 30)),
            (debut: new TimeOnly(13, 30), fin: new TimeOnly(15, 0)),
            (debut: new TimeOnly(15, 15), fin: new TimeOnly(16, 45)),
            (debut: new TimeOnly(17, 0), fin: new TimeOnly(18, 30)),
        };
        var seedTitles = new[]
        {
            "Fondamentaux", "Atelier pratique", "Methodologie", "Projet encadre", "Outils numeriques",
            "Analyse appliquee", "Systemes avances", "Communication professionnelle"
        };

        for (var i = 0; i < seedFilieres.Length; i++)
        {
            var filiere = seedFilieres[i];
            var niveau = filiere.Niveau;
            var teacher = seedTeachers[i % seedTeachers.Length];
            var room = seedRooms[i % seedRooms.Length];
            var day = seedDays[(i / seedHours.Length) % seedDays.Length];
            var hour = seedHours[i % seedHours.Length];
            var type = i % 3 == 0 ? CoursType.CM : i % 3 == 1 ? CoursType.TD : CoursType.TP;
            var title = $"{seedTitles[i % seedTitles.Length]} {filiere.Libelle}";

            var course = new Cours
            {
                Intitule = title,
                Type = type,
                VolumeHoraire = 18,
                HeuresPlanifiees = 2,
                Niveau = niveau,
                Filiere = filiere
            };

            db.Cours.Add(course);
            db.CoursEnseignants.Add(new CoursEnseignant { Cours = course, Enseignant = teacher });
            db.Slots.Add(new SlotEDT
            {
                Jour = day,
                HeureDebut = hour.debut,
                HeureFin = hour.fin,
                Cours = course,
                Enseignant = teacher,
                Salle = room,
                Niveau = niveau,
                Filiere = filiere,
                Semestre = semestre1
            });
        }

        // ══════════════════════════════════════════════════
        // USERS
        // ══════════════════════════════════════════════════
        db.Users.Add(new User
        {
            Prenom       = "Super",
            Nom          = "Admin",
            Email        = "admin@emit.mg",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role         = Role.Admin
        });

        // Comptes enseignants (un pour chaque enseignant seedé)
        var enseignantsList = new[] { e1, e2, e3, e4, e5, e6, e7, e8, e9 };
        foreach (var ens in enseignantsList)
        {
            db.Users.Add(new User
            {
                Prenom       = ens.Prenom,
                Nom          = ens.Nom,
                Email        = ens.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Enseignant@123"),
                Role         = Role.Enseignant,
                Enseignant   = ens
            });
        }

        await db.SaveChangesAsync();
    }
}
