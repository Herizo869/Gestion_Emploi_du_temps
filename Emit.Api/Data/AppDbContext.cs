using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Emit.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opt) : base(opt) { }

    // ✅ Propriétés DbSet (avec getters explicites pour éviter les problèmes de lazy loading)
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Enseignant> Enseignants { get; set; } = null!;
    public DbSet<Salle> Salles { get; set; } = null!;
    public DbSet<Niveau> Niveaux { get; set; } = null!;
    public DbSet<Filiere> Filieres { get; set; } = null!;
    public DbSet<Cours> Cours { get; set; } = null!;
    public DbSet<CoursEnseignant> CoursEnseignants { get; set; } = null!;
    public DbSet<Semestre> Semestres { get; set; } = null!;
    public DbSet<SlotEDT> Slots { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<LogEntry> Journal { get; set; } = null!;
    public DbSet<Disponibilite> Disponibilites { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ==========================================
        // 1️⃣ CONFIGURATION GÉNÉRALE POUR POSTGRESQL
        // ==========================================
        
        // ✅ Convertir les DateTime en UTC (recommandé pour PostgreSQL)
        foreach (var entityType in b.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("timestamp with time zone");
                }
            }
        }

        // ✅ Utiliser des noms de tables en minuscules (convention PostgreSQL)
        foreach (var entity in b.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(tableName.ToLowerInvariant());
            }
        }

        // ==========================================
        // 2️⃣ ENTITÉS ET RELATIONS
        // ==========================================

        // 📌 USER
        b.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            
            // Relation avec Enseignant
            entity.HasOne(u => u.Enseignant)
                .WithMany()
                .HasForeignKey(u => u.EnseignantId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Index pour les recherches fréquentes
            entity.HasIndex(u => u.Role);
            entity.HasIndex(u => u.Email);
        });

        // 📌 ENSEIGNANT
        b.Entity<Enseignant>(entity =>
        {
            entity.ToTable("enseignants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Nom);
            entity.HasIndex(e => e.Prenom);
        });

        // 📌 SALLE
        b.Entity<Salle>(entity =>
        {
            entity.ToTable("salles");
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.Numero).IsUnique();
            entity.HasIndex(s => s.Type);
        });

        // 📌 NIVEAU
        b.Entity<Niveau>(entity =>
        {
            entity.ToTable("niveaux");
            entity.HasKey(n => n.Id);
            entity.HasIndex(n => n.Nom).IsUnique();
        });

        // 📌 FILIERE
        b.Entity<Filiere>(entity =>
        {
            entity.ToTable("filieres");
            entity.HasKey(f => f.Id);
            
            // Relation avec Niveau (Cascade)
            entity.HasOne(f => f.Niveau)
                .WithMany(n => n.Filieres)
                .HasForeignKey(f => f.NiveauId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Index composite pour recherche rapide
            entity.HasIndex(f => new { f.NiveauId, f.Nom }).IsUnique();
        });

        // 📌 SEMESTRE
        b.Entity<Semestre>(entity =>
        {
            entity.ToTable("semestres");
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.Nom).IsUnique();
            
            // Index pour les recherches par période
            entity.HasIndex(s => new { s.AnneeUniversitaire, s.Period });
        });

        // 📌 COURS
        b.Entity<Cours>(entity =>
        {
            entity.ToTable("cours");
            entity.HasKey(c => c.Id);
            
            // Relations avec Niveau et Filiere (Restrict)
            entity.HasOne(c => c.Niveau)
                .WithMany(n => n.Cours)
                .HasForeignKey(c => c.NiveauId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(c => c.Filiere)
                .WithMany(f => f.Cours)
                .HasForeignKey(c => c.FiliereId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Index pour les recherches
            entity.HasIndex(c => c.Code).IsUnique();
            entity.HasIndex(c => c.Intitule);
            entity.HasIndex(c => new { c.NiveauId, c.FiliereId, c.SemestreId });
        });

        // 📌 COURSENSEIGNANT (Table d'association)
        b.Entity<CoursEnseignant>(entity =>
        {
            entity.ToTable("cours_enseignants");
            
            // Clé composite
            entity.HasKey(ce => new { ce.CoursId, ce.EnseignantId });
            
            // Relations
            entity.HasOne(ce => ce.Cours)
                .WithMany(c => c.Enseignants)
                .HasForeignKey(ce => ce.CoursId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(ce => ce.Enseignant)
                .WithMany(e => e.Cours)
                .HasForeignKey(ce => ce.EnseignantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 📌 SLOTEDT (Emploi du temps)
        b.Entity<SlotEDT>(entity =>
        {
            entity.ToTable("slots_edt");
            entity.HasKey(s => s.Id);
            
            // ✅ Index UNIQUES pour éviter les conflits de planning
            // 1. Par enseignant
            entity.HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.EnseignantId })
                .IsUnique()
                .HasDatabaseName("ix_slots_enseignant_unique");
                
            // 2. Par salle
            entity.HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.SalleId })
                .IsUnique()
                .HasDatabaseName("ix_slots_salle_unique");
                
            // 3. Par niveau/filiere
            entity.HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.NiveauId, s.FiliereId })
                .IsUnique()
                .HasDatabaseName("ix_slots_niveau_filiere_unique");
                
            // Index pour les recherches par date
            entity.HasIndex(s => new { s.Jour, s.HeureDebut, s.HeureFin });
            
            // Relations
            entity.HasOne(s => s.Cours)
                .WithMany(c => c.Slots)
                .HasForeignKey(s => s.CoursId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(s => s.Enseignant)
                .WithMany(e => e.Slots)
                .HasForeignKey(s => s.EnseignantId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(s => s.Salle)
                .WithMany(sa => sa.Slots)
                .HasForeignKey(s => s.SalleId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(s => s.Niveau)
                .WithMany()
                .HasForeignKey(s => s.NiveauId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(s => s.Filiere)
                .WithMany()
                .HasForeignKey(s => s.FiliereId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(s => s.Semestre)
                .WithMany(se => se.Slots)
                .HasForeignKey(s => s.SemestreId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 📌 NOTIFICATION
        b.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(n => n.Id);
            
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Index pour les notifications non lues
            entity.HasIndex(n => new { n.UserId, n.EstLu });
            entity.HasIndex(n => n.DateCreation);
        });

        // 📌 LOGENTRY (Journal)
        b.Entity<LogEntry>(entity =>
        {
            entity.ToTable("logs");
            entity.HasKey(l => l.Id);
            
            // Index pour les recherches
            entity.HasIndex(l => l.Niveau);
            entity.HasIndex(l => l.DateHeure);
            entity.HasIndex(l => l.UtilisateurId);
            entity.HasIndex(l => new { l.DateHeure, l.Niveau });
        });

        // 📌 DISPONIBILITE
        b.Entity<Disponibilite>(entity =>
        {
            entity.ToTable("disponibilites");
            entity.HasKey(d => d.Id);
            
            // Index pour éviter les doublons de disponibilité
            entity.HasIndex(d => new { d.EnseignantId, d.Jour, d.HeureDebut, d.HeureFin })
                .IsUnique()
                .HasDatabaseName("ix_disponibilites_unique");
                
            // Relations
            entity.HasOne(d => d.Enseignant)
                .WithMany(e => e.Disponibilites)
                .HasForeignKey(d => d.EnseignantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(d => d.Salle)
                .WithMany()
                .HasForeignKey(d => d.SalleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    // ==========================================
    // 3️⃣ MÉTHODES UTILITAIRES
    // ==========================================

    /// <summary>
    /// Vérifie si la base de données existe et est accessible
    /// </summary>
    public async Task<bool> TestConnexionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await Database.CanConnectAsync(cancellationToken);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Exécute une transaction SQL
    /// </summary>
    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return await Database.BeginTransactionAsync(cancellationToken);
    }
}