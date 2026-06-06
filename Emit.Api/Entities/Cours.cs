namespace Emit.Api.Entities;

public class Cours
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Intitule { get; set; } = null!;
    public CoursType Type { get; set; }
    public int VolumeHoraire { get; set; }
    public int HeuresPlanifiees { get; set; }

    public Guid NiveauId { get; set; }
    public Niveau Niveau { get; set; } = null!;

    public Guid FiliereId { get; set; }
    public Filiere Filiere { get; set; } = null!;

    public ICollection<CoursEnseignant> Enseignants { get; set; } = new List<CoursEnseignant>();
    public ICollection<SlotEDT> Slots { get; set; } = new List<SlotEDT>();
}

public class CoursEnseignant
{
    public Guid CoursId { get; set; }
    public Cours Cours { get; set; } = null!;
    public Guid EnseignantId { get; set; }
    public Enseignant Enseignant { get; set; } = null!;
}
