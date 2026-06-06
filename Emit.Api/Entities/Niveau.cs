namespace Emit.Api.Entities;

public class Niveau
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NiveauLibelle Libelle { get; set; }
    public int EffectifMax { get; set; }
    public ICollection<Filiere> Filieres { get; set; } = new List<Filiere>();
    public ICollection<Cours> Cours { get; set; } = new List<Cours>();
}
