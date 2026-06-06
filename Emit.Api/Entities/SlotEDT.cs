namespace Emit.Api.Entities;

public class SlotEDT
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Jour Jour { get; set; }
    public TimeOnly HeureDebut { get; set; }
    public TimeOnly HeureFin { get; set; }

    public Guid CoursId { get; set; }
    public Cours Cours { get; set; } = null!;

    public Guid EnseignantId { get; set; }
    public Enseignant Enseignant { get; set; } = null!;

    public Guid SalleId { get; set; }
    public Salle Salle { get; set; } = null!;

    public Guid NiveauId { get; set; }
    public Niveau Niveau { get; set; } = null!;

    public Guid FiliereId { get; set; }
    public Filiere Filiere { get; set; } = null!;

    public Guid SemestreId { get; set; }
    public Semestre Semestre { get; set; } = null!;
}
