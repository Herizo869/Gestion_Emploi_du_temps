using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opt) : base(opt) { }



    public DbSet<UserProfile> Profiles => Set<UserProfile>();

    public DbSet<User> Users => Set<User>();
    public DbSet<Enseignant> Enseignants => Set<Enseignant>();
    public DbSet<Salle> Salles => Set<Salle>();
    public DbSet<Niveau> Niveaux => Set<Niveau>();
    public DbSet<Filiere> Filieres => Set<Filiere>();
    public DbSet<Cours> Cours => Set<Cours>();
    public DbSet<CoursEnseignant> CoursEnseignants => Set<CoursEnseignant>();
    public DbSet<Semestre> Semestres => Set<Semestre>();
    public DbSet<SlotEDT> Slots => Set<SlotEDT>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<LogEntry> Journal => Set<LogEntry>();
    public DbSet<Disponibilite> Disponibilites => Set<Disponibilite>();
<<<<<<< Updated upstream

=======
    public DbSet<SystemSettings> SystemSettings => Set<SystemSettings>();
    
>>>>>>> Stashed changes
    protected override void OnModelCreating(ModelBuilder b)
    {
        // Table gérée par Supabase/trigger — EF ne doit pas essayer de la créer/migrer
        // Les colonnes Supabase sont en minuscules/snake_case, pas en PascalCase
        b.Entity<UserProfile>(e =>
        {
            e.ToTable("profiles", t => t.ExcludeFromMigrations());
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.Email).HasColumnName("email");
            e.Property(p => p.FullName).HasColumnName("full_name");
            e.Property(p => p.AvatarUrl).HasColumnName("avatar_url");
            e.Property(p => p.Role).HasColumnName("role");
        });

        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>()
            .HasOne(u => u.Enseignant)
            .WithMany()
            .HasForeignKey(u => u.EnseignantId)
            .OnDelete(DeleteBehavior.SetNull);

        b.Entity<Enseignant>().HasIndex(e => e.Email).IsUnique();
        b.Entity<Enseignant>().HasIndex(e => e.SupabaseAuthUserId).IsUnique();
        b.Entity<Salle>().HasIndex(s => s.Numero).IsUnique();

        b.Entity<CoursEnseignant>().HasKey(x => new { x.CoursId, x.EnseignantId });
        b.Entity<CoursEnseignant>()
            .HasOne(x => x.Cours).WithMany(c => c.Enseignants).HasForeignKey(x => x.CoursId);
        b.Entity<CoursEnseignant>()
            .HasOne(x => x.Enseignant).WithMany(e => e.Cours).HasForeignKey(x => x.EnseignantId);

        b.Entity<Filiere>()
            .HasOne(f => f.Niveau).WithMany(n => n.Filieres)
            .HasForeignKey(f => f.NiveauId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Cours>()
            .HasOne(c => c.Niveau).WithMany(n => n.Cours)
            .HasForeignKey(c => c.NiveauId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Cours>()
            .HasOne(c => c.Filiere).WithMany(f => f.Cours)
            .HasForeignKey(c => c.FiliereId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<SlotEDT>()
            .HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.EnseignantId }).IsUnique();
        b.Entity<SlotEDT>()
            .HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.SalleId }).IsUnique();
        b.Entity<SlotEDT>()
            .HasIndex(s => new { s.SemestreId, s.Jour, s.HeureDebut, s.NiveauId, s.FiliereId }).IsUnique();

        b.Entity<SlotEDT>().HasOne(s => s.Cours).WithMany(c => c.Slots).HasForeignKey(s => s.CoursId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<SlotEDT>().HasOne(s => s.Enseignant).WithMany(e => e.Slots).HasForeignKey(s => s.EnseignantId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<SlotEDT>().HasOne(s => s.Salle).WithMany(sa => sa.Slots).HasForeignKey(s => s.SalleId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<SlotEDT>().HasOne(s => s.Niveau).WithMany().HasForeignKey(s => s.NiveauId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<SlotEDT>().HasOne(s => s.Filiere).WithMany().HasForeignKey(s => s.FiliereId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<SlotEDT>().HasOne(s => s.Semestre).WithMany(se => se.Slots).HasForeignKey(s => s.SemestreId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Notification>()
            .HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Disponibilite>()
            .HasOne(d => d.Semestre).WithMany().HasForeignKey(d => d.SemestreId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Disponibilite>()
            .HasOne(d => d.Cours).WithMany().HasForeignKey(d => d.CoursId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Disponibilite>()
            .HasOne(d => d.Niveau).WithMany().HasForeignKey(d => d.NiveauId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Disponibilite>()
            .HasIndex(d => new { d.EnseignantId, d.SemestreId, d.CoursId, d.Jour, d.Creneau }).IsUnique();
    }
}